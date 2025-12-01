mod commands;
#[cfg(windows)]
mod keyboard_hook;

use commands::{
    get_app_data_dir,
    load_config,
    save_config,
    save_config_silent,
    save_icon,
    save_icon_from_path,
    set_overlay_click_through,
    emit_position_changed,
    quick_create_timer,
    create_timer_from_preset,
    start_timer,
    open_overlay_devtools,
};

#[cfg(windows)]
use commands::{
    register_low_level_shortcut,
    unregister_all_low_level_shortcuts,
};
use tauri::{
    Manager,
    Emitter,
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    tray::TrayIconBuilder,
    image::Image,
    WebviewWindowBuilder,
    WebviewUrl,
};
use serde_json;
use serde_json::json;
use std::fs;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            println!("[SETUP] Initializing application...");
            
            // Desabilitar sombra e garantir que decorations estão desabilitadas na janela overlay
            if let Some(overlay_window) = app.get_webview_window("overlay") {
                println!("[SETUP] Configuring overlay window...");
                let _ = overlay_window.set_shadow(false);
                
                // Ativar click-through após um pequeno delay para garantir que a janela está visível
                let overlay_window_clone = overlay_window.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    println!("[SETUP] Enabling click-through on overlay window");
                    if let Err(err) = overlay_window_clone.set_ignore_cursor_events(true) {
                        println!("[SETUP] ERROR: Failed to set ignore cursor events: {}", err);
                    } else {
                        println!("[SETUP] Click-through enabled successfully");
                    }
                });
            } else {
                println!("[SETUP] WARNING: Overlay window not found during setup");
            }
            
            let settings_item = MenuItemBuilder::with_id("settings", "Settings").build(app)?;
            let reset_timers_item = MenuItemBuilder::with_id("reset_timers", "Reset All Timers").build(app)?;
            
            let config_str = load_config(app.handle().clone()).unwrap_or_else(|_| "{}".to_string());
            let config_json: serde_json::Value = serde_json::from_str(&config_str).unwrap_or_else(|_| json!({}));
            let icons_array = config_json
                .get("icons")
                .and_then(|i| i.as_array())
                .cloned()
                .unwrap_or_else(Vec::new);
            let presets_array = config_json
                .get("timerPresets")
                .and_then(|p| p.as_array())
                .cloned()
                .unwrap_or_else(Vec::new);

            let reset_specific_items: Vec<_> = icons_array
                .iter()
                .filter_map(|icon| {
                    let id = icon.get("id")?.as_str()?;
                    let name = icon.get("name").and_then(|n| n.as_str()).unwrap_or_else(|| {
                        icon.get("iconName").and_then(|n| n.as_str()).unwrap_or("Timer")
                    });
                    let item_id = format!("reset_timer_{}", id);
                    MenuItemBuilder::with_id(&item_id, name).build(app).ok()
                })
                .collect();

            let start_timer_items: Vec<_> = icons_array
                .iter()
                .filter_map(|icon| {
                    let id = icon.get("id")?.as_str()?;
                    let name = icon.get("name").and_then(|n| n.as_str()).unwrap_or_else(|| {
                        icon.get("iconName").and_then(|n| n.as_str()).unwrap_or("Timer")
                    });
                    let item_id = format!("start_timer_{}", id);
                    MenuItemBuilder::with_id(&item_id, format!("Start {}", name)).build(app).ok()
                })
                .collect();

            let preset_timer_items: Vec<_> = presets_array
                .iter()
                .filter_map(|preset| {
                    let id = preset.get("id")?.as_str()?;
                    let name = preset.get("name").and_then(|n| n.as_str()).unwrap_or("Preset");
                    let item_id = format!("create_preset_{}", id);
                    MenuItemBuilder::with_id(&item_id, name).build(app).ok()
                })
                .collect();
            
            let reset_specific_items_refs: Vec<&dyn tauri::menu::IsMenuItem<_>> = reset_specific_items.iter().map(|item| item as &dyn tauri::menu::IsMenuItem<_>).collect();
            let reset_specific_item: Box<dyn tauri::menu::IsMenuItem<_>> = if !reset_specific_items.is_empty() {
                Box::new(SubmenuBuilder::with_id(app, "reset_specific", "Reset Specific Timer")
                    .items(&reset_specific_items_refs)
                    .build()?)
            } else {
                Box::new(MenuItemBuilder::with_id("reset_specific", "Reset Specific Timer (No timers)").build(app)?)
            };

            let start_timer_items_refs: Vec<&dyn tauri::menu::IsMenuItem<_>> = start_timer_items.iter().map(|item| item as &dyn tauri::menu::IsMenuItem<_>).collect();
            let start_timer_menu: Box<dyn tauri::menu::IsMenuItem<_>> = if !start_timer_items.is_empty() {
                Box::new(SubmenuBuilder::with_id(app, "start_timers", "Start/Pause Timers")
                    .items(&start_timer_items_refs)
                    .build()?)
            } else {
                Box::new(MenuItemBuilder::with_id("start_timers_disabled", "Start/Pause Timers (No timers)").build(app)?)
            };

            let preset_items_refs: Vec<&dyn tauri::menu::IsMenuItem<_>> = preset_timer_items.iter().map(|item| item as &dyn tauri::menu::IsMenuItem<_>).collect();
            let presets_menu: Box<dyn tauri::menu::IsMenuItem<_>> = if !preset_timer_items.is_empty() {
                Box::new(SubmenuBuilder::with_id(app, "create_from_preset", "Create Timer from Preset")
                    .items(&preset_items_refs)
                    .build()?)
            } else {
                Box::new(MenuItemBuilder::with_id("create_from_preset_disabled", "Create Timer from Preset (No presets)").build(app)?)
            };
            
            let quick_create_items = vec![
                MenuItemBuilder::with_id("quick_create_30s", "30 seconds").build(app)?,
                MenuItemBuilder::with_id("quick_create_1min", "1 minute").build(app)?,
                MenuItemBuilder::with_id("quick_create_2min", "2 minutes").build(app)?,
                MenuItemBuilder::with_id("quick_create_5min", "5 minutes").build(app)?,
                MenuItemBuilder::with_id("quick_create_10min", "10 minutes").build(app)?,
                MenuItemBuilder::with_id("quick_create_15min", "15 minutes").build(app)?,
                MenuItemBuilder::with_id("quick_create_30min", "30 minutes").build(app)?,
            ];
            
            let quick_create_items_refs: Vec<&dyn tauri::menu::IsMenuItem<_>> = quick_create_items.iter().map(|item| item as &dyn tauri::menu::IsMenuItem<_>).collect();
            let quick_create_item = SubmenuBuilder::with_id(app, "quick_create", "Quick Create Timer")
                .items(&quick_create_items_refs)
                .build()?;
            
            let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            
            let menu = MenuBuilder::new(app)
                .items(&[&settings_item])
                .items(&[&reset_timers_item])
                .items(&[start_timer_menu.as_ref()])
                .items(&[reset_specific_item.as_ref()])
                .separator()
                .items(&[presets_menu.as_ref()])
                .items(&[&quick_create_item])
                .separator()
                .items(&[&quit_item])
                .build()?;

            // Carregar ícone do tray
            let tray_icon_path = app.path()
                .resource_dir()
                .ok()
                .and_then(|dir| {
                    let path = dir.join("icons").join("tray-icon.png");
                    if path.exists() {
                        Some(path)
                    } else {
                        None
                    }
                });

            let tray_icon = if let Some(path) = tray_icon_path {
                match fs::read(&path) {
                    Ok(data) => {
                        match image::load_from_memory(&data) {
                            Ok(img) => {
                                let rgba = img.to_rgba8();
                                let (width, height) = rgba.dimensions();
                                Some(Image::new_owned(rgba.into_raw(), width, height))
                            }
                            Err(e) => {
                                println!("[TRAY] Failed to decode image: {}", e);
                                None
                            }
                        }
                    }
                    Err(e) => {
                        println!("[TRAY] Failed to read tray icon file: {}", e);
                        None
                    }
                }
            } else {
                println!("[TRAY] Tray icon path not found");
                None
            };

            let mut tray_builder = TrayIconBuilder::new();
            if let Some(icon) = tray_icon {
                tray_builder = tray_builder.icon(icon);
            }
            
            let app_handle_for_tray = app.handle().clone();
            let _tray = tray_builder
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(move |_tray, event| {
                    use tauri::tray::TrayIconEvent;
                    match event {
                        TrayIconEvent::Click { button, .. } => {
                            if button == tauri::tray::MouseButton::Left {
                                println!("[TRAY] Tray icon clicked (left click)");
                                let app = app_handle_for_tray.clone();
                                if let Some(window) = app.get_webview_window("settings") {
                                    println!("[TRAY] Settings window exists, showing and focusing");
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                } else {
                                    println!("[TRAY] Settings window not found, creating new one");
                                    match WebviewWindowBuilder::new(
                                        &app,
                                        "settings",
                                        WebviewUrl::App("settings.html".into())
                                    )
                                    .title("Overlay Timer - Settings")
                                    .inner_size(700.0, 600.0)
                                    .resizable(true)
                                    .visible(true)
                                    .decorations(false)
                                    .build() {
                                        Ok(window) => {
                                            println!("[TRAY] Settings window created successfully");
                                            let _ = window.show();
                                            let _ = window.set_focus();
                                        }
                                        Err(e) => {
                                            println!("[TRAY] ERROR: Failed to create settings window: {:?}", e);
                                        }
                                    }
                                }
                            }
                        }
                        _ => {}
                    }
                })
                .on_menu_event(move |app, event| {
                    let event_id = event.id.as_ref();
                    println!("[TRAY] Menu event: {}", event_id);
                    
                    // Handle start specific timer
                    if event_id.starts_with("start_timer_") {
                        let timer_id = event_id.strip_prefix("start_timer_").unwrap_or("");
                        println!("[TRAY] Start timer clicked: {}", timer_id);
                        if let Some(overlay_window) = app.get_webview_window("overlay") {
                            let _ = overlay_window.emit("start-specific-timer", timer_id);
                        }
                        return;
                    }

                    // Handle reset specific timer
                    if event_id.starts_with("reset_timer_") {
                        let timer_id = event_id.strip_prefix("reset_timer_").unwrap_or("");
                        println!("[TRAY] Reset specific timer clicked: {}", timer_id);
                        if let Some(overlay_window) = app.get_webview_window("overlay") {
                            let _ = overlay_window.emit("reset-specific-timer", timer_id);
                        }
                        return;
                    }

                    // Handle create timer from preset
                    if event_id.starts_with("create_preset_") {
                        let preset_id = event_id.strip_prefix("create_preset_").unwrap_or("").to_string();
                        println!("[TRAY] Create timer from preset clicked: {}", preset_id);
                        let app_handle_clone = app.clone();
                        std::thread::spawn(move || {
                            if let Err(e) = create_timer_from_preset(app_handle_clone, preset_id.clone()) {
                                println!("[TRAY] ERROR: Failed to create timer from preset {}: {}", preset_id, e);
                            }
                        });
                        return;
                    }
                    
                    // Handle quick create timer
                    let duration_map: std::collections::HashMap<&str, u64> = [
                        ("quick_create_30s", 30),
                        ("quick_create_1min", 60),
                        ("quick_create_2min", 120),
                        ("quick_create_5min", 300),
                        ("quick_create_10min", 600),
                        ("quick_create_15min", 900),
                        ("quick_create_30min", 1800),
                    ].iter().cloned().collect();
                    
                    if let Some(&duration) = duration_map.get(event_id) {
                        println!("[TRAY] Quick create timer clicked: {} seconds", duration);
                        let app_handle_quick = app.clone();
                        std::thread::spawn(move || {
                            if let Err(e) = quick_create_timer(app_handle_quick, duration) {
                                println!("[TRAY] ERROR: Failed to quick create timer: {}", e);
                            }
                        });
                        return;
                    }
                    
                    match event_id {
                        "settings" => {
                            println!("[TRAY] Settings menu item clicked");
                            if let Some(window) = app.get_webview_window("settings") {
                                println!("[TRAY] Settings window exists, showing and focusing");
                                let _ = window.show();
                                let _ = window.set_focus();
                                #[cfg(debug_assertions)]
                                {
                                    println!("[TRAY] Opening DevTools for settings window");
                                    let _ = window.open_devtools();
                                }
                            } else {
                                println!("[TRAY] Settings window not found, creating new one");
                                match WebviewWindowBuilder::new(
                                    app,
                                    "settings",
                                    WebviewUrl::App("settings.html".into())
                                )
                                .title("Overlay Timer - Settings")
                                .inner_size(700.0, 600.0)
                                .resizable(true)
                                .visible(true)
                                .decorations(false)
                                .build() {
                                    Ok(window) => {
                                        println!("[TRAY] Settings window created successfully");
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                    Err(e) => {
                                        println!("[TRAY] ERROR: Failed to create settings window: {:?}", e);
                                    }
                                }
                            }
                        }
                        "reset_timers" => {
                            println!("[TRAY] Reset all timers clicked");
                            if let Some(overlay_window) = app.get_webview_window("overlay") {
                                let _ = overlay_window.emit("reset-all-timers", ());
                            }
                        }
                        "quit" => {
                            println!("[TRAY] Quit menu item clicked");
                            app.exit(0);
                        }
                        _ => {
                            println!("[TRAY] Unknown menu item: {}", event_id);
                        }
                    }
                })
                .build(app)
                .expect("Failed to build tray icon");

            #[cfg(windows)]
            {
                // Registrar hook de baixo nível no Windows
                if let Err(e) = keyboard_hook::register_low_level_hook() {
                    println!("[SETUP] WARNING: Failed to register low-level keyboard hook: {}", e);
                    println!("[SETUP] Falling back to standard global-shortcut plugin");
                } else {
                    println!("[SETUP] Low-level keyboard hook registered successfully");
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_overlay_devtools,
            get_app_data_dir,
            load_config,
            save_config,
            save_config_silent,
            save_icon,
            save_icon_from_path,
            set_overlay_click_through,
            emit_position_changed,
            quick_create_timer,
            create_timer_from_preset,
            start_timer,
            #[cfg(windows)]
            register_low_level_shortcut,
            #[cfg(windows)]
            unregister_all_low_level_shortcuts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

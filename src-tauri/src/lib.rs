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
};

#[cfg(windows)]
use commands::{
    register_low_level_shortcut,
    unregister_all_low_level_shortcuts,
};
use tauri::{
    Manager,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    image::Image,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            println!("[SETUP] Initializing application...");
            
            // Desabilitar sombra na janela overlay
            if let Some(overlay_window) = app.get_webview_window("overlay") {
                println!("[SETUP] Disabling shadow on overlay window");
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
            
            // Configurar settings window para esconder ao invés de fechar e definir ícone
            if let Some(settings_window) = app.get_webview_window("settings") {
                println!("[SETUP] Setting up settings window close handler");
                
                // Definir ícone da janela usando o ícone padrão do app
                if let Some(default_icon) = app.default_window_icon() {
                    println!("[SETUP] Setting window icon from default app icon");
                    if let Err(e) = settings_window.set_icon(default_icon.clone()) {
                        println!("[SETUP] WARNING: Failed to set window icon: {}", e);
                    } else {
                        println!("[SETUP] Window icon set successfully");
                    }
                } else {
                    println!("[SETUP] WARNING: No default window icon found");
                }
                
                let settings_window_clone = settings_window.clone();
                let _ = settings_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        println!("[SETUP] Settings window close requested, hiding instead");
                        api.prevent_close();
                        let _ = settings_window_clone.hide();
                    }
                });
            }
            
            let app_handle1 = app.handle().clone();
            let app_handle2 = app.handle().clone();
            
            let settings_item = MenuItemBuilder::with_id("settings", "Settings").build(app)?;
            let reset_timers_item = MenuItemBuilder::with_id("reset_timers", "Reset All Timers").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            
            let menu = MenuBuilder::new(app)
                .items(&[&settings_item])
                .items(&[&reset_timers_item])
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
                })
                .or_else(|| {
                    // Fallback para desenvolvimento: usar o caminho do projeto
                    let project_path = std::env::current_dir()
                        .ok()?
                        .join("src-tauri")
                        .join("icons")
                        .join("tray-icon.png");
                    if project_path.exists() {
                        Some(project_path)
                    } else {
                        None
                    }
                })
                .ok_or_else(|| "Failed to find tray icon file".to_string())?;
            
            let img = image::open(&tray_icon_path)
                .map_err(|e| format!("Failed to open tray icon image: {}", e))?;
            let rgba = img.to_rgba8();
            let (width, height) = rgba.dimensions();
            let tray_icon = Image::new_owned(rgba.into_raw(), width, height);

            let _tray = TrayIconBuilder::new()
                .icon(tray_icon)
                .menu(&menu)
                .on_menu_event(move |_tray, event| {
                    let app = app_handle1.clone();
                    match event.id().as_ref() {
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
                                println!("[TRAY] Settings window not found, trying to get or create");
                                // Tentar obter a janela novamente (pode ter sido criada mas não registrada)
                                if let Some(window) = app.get_webview_window("settings") {
                                    println!("[TRAY] Settings window found on retry");
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                    #[cfg(debug_assertions)]
                                    {
                                        let _ = window.open_devtools();
                                    }
                                } else {
                                    println!("[TRAY] WARNING: Settings window still not found. It may have been closed. Restart the app to recreate it.");
                                }
                            }
                        }
                        "quit" => {
                            println!("[TRAY] Quit menu item clicked, exiting...");
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(move |_tray, event| {
                    let app = app_handle2.clone();
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } = event {
                        // Clique esquerdo - abrir/focar settings
                        println!("[TRAY] Left click on tray icon");
                        if let Some(window) = app.get_webview_window("settings") {
                            println!("[TRAY] Showing settings window from tray click");
                            let _ = window.show();
                            let _ = window.set_focus();
                            // Abrir DevTools automaticamente em desenvolvimento
                            #[cfg(debug_assertions)]
                            {
                                println!("[TRAY] Opening DevTools for settings window");
                                let _ = window.open_devtools();
                            }
                        } else {
                            println!("[TRAY] Settings window not found on tray click, trying to get or create");
                            // Tentar obter a janela novamente
                            if let Some(window) = app.get_webview_window("settings") {
                                println!("[TRAY] Settings window found on retry");
                                let _ = window.show();
                                let _ = window.set_focus();
                                #[cfg(debug_assertions)]
                                {
                                    let _ = window.open_devtools();
                                }
                            } else {
                                println!("[TRAY] WARNING: Settings window still not found. It may have been closed. Restart the app to recreate it.");
                            }
                        }
                    }
                })
                .build(app)?;

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
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            save_config,
            save_config_silent,
            load_config,
            save_icon,
            save_icon_from_path,
            get_app_data_dir,
            set_overlay_click_through,
            emit_position_changed,
            #[cfg(windows)]
            register_low_level_shortcut,
            #[cfg(windows)]
            unregister_all_low_level_shortcuts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

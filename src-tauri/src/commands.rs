use serde_json::{json, Value};
use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager};

#[tauri::command]
pub fn open_overlay_devtools(app: AppHandle) -> Result<(), String> {
    log_command(
        "open_overlay_devtools",
        "Opening DevTools for overlay window",
    );

    if let Some(overlay_window) = app.get_webview_window("overlay") {
        overlay_window.open_devtools();
        log_command("open_overlay_devtools", "DevTools opened successfully");
        Ok(())
    } else {
        let error_msg = "Overlay window not found";
        log_command("open_overlay_devtools", &format!("ERROR: {}", error_msg));
        Err(error_msg.to_string())
    }
}

fn log_command(command: &str, message: &str) {
    println!("[COMMAND:{}] {}", command, message);
}

#[tauri::command]
pub fn save_icon_from_path(
    app: AppHandle,
    icon_id: String,
    source_path: String,
) -> Result<String, String> {
    log_command(
        "save_icon_from_path",
        &format!("Starting, source: {}", source_path),
    );
    let app_data_dir = app.path().app_data_dir().map_err(|e| {
        log_command(
            "save_icon_from_path",
            &format!("ERROR: Failed to get app data dir: {}", e),
        );
        format!("Failed to get app data dir: {}", e)
    })?;

    let icons_dir = app_data_dir.join("icons");
    fs::create_dir_all(&icons_dir).map_err(|e| {
        log_command(
            "save_icon_from_path",
            &format!("ERROR: Failed to create icons dir: {}", e),
        );
        format!("Failed to create icons dir: {}", e)
    })?;

    let icon_path = icons_dir.join(format!("{}.png", icon_id));

    // Copiar arquivo da origem para o destino
    fs::copy(&source_path, &icon_path).map_err(|e| {
        log_command(
            "save_icon_from_path",
            &format!("ERROR: Failed to copy file: {}", e),
        );
        format!("Failed to copy file: {}", e)
    })?;

    log_command(
        "save_icon_from_path",
        &format!("Icon saved to: {:?}", icon_path),
    );

    // Return relative path for frontend
    Ok(format!("icons/{}.png", icon_id))
}

#[tauri::command]
pub fn save_config(app: AppHandle, config: String, emit_event: Option<bool>) -> Result<(), String> {
    log_command("save_config", "Starting...");
    let app_data_dir = app.path().app_data_dir().map_err(|e| {
        log_command(
            "save_config",
            &format!("ERROR: Failed to get app data dir: {}", e),
        );
        format!("Failed to get app data dir: {}", e)
    })?;

    log_command("save_config", &format!("App data dir: {:?}", app_data_dir));

    // Create directory if it doesn't exist
    fs::create_dir_all(&app_data_dir).map_err(|e| {
        log_command(
            "save_config",
            &format!("ERROR: Failed to create app data dir: {}", e),
        );
        format!("Failed to create app data dir: {}", e)
    })?;

    let config_path = app_data_dir.join("config.json");
    log_command(
        "save_config",
        &format!("Writing config to: {:?}", config_path),
    );
    fs::write(&config_path, config).map_err(|e| {
        log_command(
            "save_config",
            &format!("ERROR: Failed to write config: {}", e),
        );
        format!("Failed to write config: {}", e)
    })?;

    // Emitir evento apenas se emit_event for true (padrão: true para manter compatibilidade)
    let should_emit = emit_event.unwrap_or(true);
    if should_emit {
        log_command("save_config", "Emitting config-changed event");
        app.emit("config-changed", ())
            .map_err(|e| {
                log_command(
                    "save_config",
                    &format!("WARNING: Failed to emit event: {}", e),
                );
                // Não falhar o comando se o evento não puder ser emitido
            })
            .ok();
    } else {
        log_command(
            "save_config",
            "Skipping config-changed event (position-only change)",
        );
    }

    log_command("save_config", "Success");
    Ok(())
}

#[tauri::command]
pub fn save_config_silent(app: AppHandle, config: String) -> Result<(), String> {
    log_command("save_config_silent", "Starting (no event emit)...");
    let app_data_dir = app.path().app_data_dir().map_err(|e| {
        log_command(
            "save_config_silent",
            &format!("ERROR: Failed to get app data dir: {}", e),
        );
        format!("Failed to get app data dir: {}", e)
    })?;

    log_command(
        "save_config_silent",
        &format!("App data dir: {:?}", app_data_dir),
    );

    // Create directory if it doesn't exist
    fs::create_dir_all(&app_data_dir).map_err(|e| {
        log_command(
            "save_config_silent",
            &format!("ERROR: Failed to create app data dir: {}", e),
        );
        format!("Failed to create app data dir: {}", e)
    })?;

    let config_path = app_data_dir.join("config.json");
    log_command(
        "save_config_silent",
        &format!("Writing config to: {:?}", config_path),
    );
    fs::write(&config_path, config).map_err(|e| {
        log_command(
            "save_config_silent",
            &format!("ERROR: Failed to write config: {}", e),
        );
        format!("Failed to write config: {}", e)
    })?;

    // NÃO emitir evento config-changed (silent)
    log_command("save_config_silent", "Success (no event emitted)");
    Ok(())
}

#[tauri::command]
pub fn emit_position_changed(app: AppHandle) -> Result<(), String> {
    log_command("emit_position_changed", "Emitting position-changed event");
    app.emit("position-changed", ()).map_err(|e| {
        log_command(
            "emit_position_changed",
            &format!("WARNING: Failed to emit event: {}", e),
        );
        format!("Failed to emit position-changed event: {}", e)
    })?;
    log_command("emit_position_changed", "Event emitted successfully");
    Ok(())
}

#[tauri::command]
pub fn load_config(app: AppHandle) -> Result<String, String> {
    log_command("load_config", "Starting...");
    let app_data_dir = app.path().app_data_dir().map_err(|e| {
        log_command(
            "load_config",
            &format!("ERROR: Failed to get app data dir: {}", e),
        );
        format!("Failed to get app data dir: {}", e)
    })?;

    let config_path = app_data_dir.join("config.json");
    log_command(
        "load_config",
        &format!("Looking for config at: {:?}", config_path),
    );

    if !config_path.exists() {
        log_command("load_config", "Config file does not exist, returning error");
        return Err("Config file does not exist".to_string());
    }

    let config = fs::read_to_string(&config_path).map_err(|e| {
        log_command(
            "load_config",
            &format!("ERROR: Failed to read config: {}", e),
        );
        format!("Failed to read config: {}", e)
    })?;

    log_command("load_config", "Config loaded successfully");
    Ok(config)
}

#[tauri::command]
pub fn save_icon(app: AppHandle, icon_id: String, data: Vec<u8>) -> Result<String, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let icons_dir = app_data_dir.join("icons");
    fs::create_dir_all(&icons_dir).map_err(|e| format!("Failed to create icons dir: {}", e))?;

    let icon_path = icons_dir.join(format!("{}.png", icon_id));
    fs::write(&icon_path, data).map_err(|e| format!("Failed to write icon: {}", e))?;

    // Return relative path for frontend
    Ok(format!("icons/{}.png", icon_id))
}

#[tauri::command]
pub fn get_app_data_dir(app: AppHandle) -> Result<String, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    Ok(app_data_dir.to_string_lossy().to_string())
}

/// Controla se a janela de overlay deve ignorar eventos de cursor (click-through).
#[tauri::command]
pub fn set_overlay_click_through(app: AppHandle, ignore: bool) -> Result<(), String> {
    log_command(
        "set_overlay_click_through",
        &format!("Setting ignore_cursor_events = {} for overlay", ignore),
    );

    if let Some(overlay_window) = app.get_webview_window("overlay") {
        overlay_window
            .set_ignore_cursor_events(ignore)
            .map_err(|e| format!("Failed to set ignore cursor events: {}", e))?;
        Ok(())
    } else {
        Err("Overlay window not found".to_string())
    }
}

#[tauri::command]
pub fn start_timer(app: AppHandle, timer_id: String) -> Result<(), String> {
    log_command(
        "start_timer",
        &format!("Request to start timer: {}", timer_id),
    );
    if let Some(overlay_window) = app.get_webview_window("overlay") {
        overlay_window
            .emit("start-specific-timer", timer_id)
            .map_err(|e| format!("Failed to emit start event: {}", e))?;
        Ok(())
    } else {
        Err("Overlay window not found".to_string())
    }
}

#[tauri::command]
pub fn quick_create_timer(app: AppHandle, duration: u64) -> Result<(), String> {
    log_command(
        "quick_create_timer",
        &format!("Creating timer with duration: {}s", duration),
    );

    let config_str = load_config(app.clone())?;
    let mut config: Value =
        serde_json::from_str(&config_str).map_err(|e| format!("Failed to parse config: {}", e))?;

    let icons = config
        .get("icons")
        .and_then(|i| i.as_array())
        .cloned()
        .unwrap_or_else(|| vec![]);

    let mut used_keybinds: Vec<String> = icons
        .iter()
        .filter_map(|icon| {
            icon.get("keybind")
                .and_then(|k| k.as_str())
                .map(|s| s.to_string())
        })
        .collect();

    if let Some(reset_keybind) = config.get("resetAllTimersKeybind").and_then(|k| k.as_str()) {
        used_keybinds.push(reset_keybind.to_string());
    }

    let mut f_key = 1;
    let mut available_keybind = format!("Alt+F{}", f_key);
    while used_keybinds.contains(&available_keybind) && f_key <= 12 {
        f_key += 1;
        available_keybind = format!("Alt+F{}", f_key);
    }

    if f_key > 12 {
        return Err("No available Alt+F* shortcuts (F1-F12 all in use)".to_string());
    }

    log_command(
        "quick_create_timer",
        &format!("Using keybind: {}", available_keybind),
    );

    let new_icon = json!({
        "id": format!("icon-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis()),
        "iconName": "Timer",
        "keybind": available_keybind,
        "timerDuration": duration,
        "notificationType": "notification",
        "timerType": "countdown"
    });

    let mut icons_vec = icons;
    icons_vec.push(new_icon);
    config["icons"] = json!(icons_vec);

    let config_str = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    save_config(app.clone(), config_str, Some(true))?;

    log_command("quick_create_timer", "Timer created successfully");
    Ok(())
}

#[tauri::command]
pub fn create_timer_from_preset(app: AppHandle, preset_id: String) -> Result<(), String> {
    log_command(
        "create_timer_from_preset",
        &format!("Creating timer from preset: {}", preset_id),
    );

    let config_str = load_config(app.clone())?;
    let mut config: Value =
        serde_json::from_str(&config_str).map_err(|e| format!("Failed to parse config: {}", e))?;

    let presets = config
        .get("timerPresets")
        .and_then(|p| p.as_array())
        .ok_or_else(|| "No presets configured".to_string())?;

    let preset = presets
        .iter()
        .find(|p| p.get("id").and_then(|id| id.as_str()) == Some(preset_id.as_str()))
        .ok_or_else(|| "Preset not found".to_string())?;

    let duration = preset
        .get("duration")
        .and_then(|d| d.as_u64())
        .ok_or_else(|| "Preset missing duration".to_string())?;

    let icon_name = preset
        .get("iconName")
        .and_then(|v| v.as_str())
        .unwrap_or("Timer");
    let notification_type = preset
        .get("notificationType")
        .and_then(|v| v.as_str())
        .unwrap_or("notification");
    let name = preset
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("Timer Preset");
    let keybind = preset
        .get("keybind")
        .and_then(|v| v.as_str())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("System time error: {}", e))?
        .as_millis();
    let new_icon_id = format!("icon-{}", timestamp);

    let mut new_icon = json!({
        "id": new_icon_id,
        "name": name,
        "iconName": icon_name,
        "timerDuration": duration,
        "notificationType": notification_type,
        "timerType": "countdown"
    });

    if let Some(k) = keybind {
        new_icon["keybind"] = json!(k);
    }

    let icons = config
        .get("icons")
        .and_then(|i| i.as_array())
        .cloned()
        .unwrap_or_else(Vec::new);
    let mut icons_vec = icons;
    icons_vec.push(new_icon);
    config["icons"] = json!(icons_vec);

    let updated_config = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    save_config(app.clone(), updated_config, Some(true))?;
    log_command(
        "create_timer_from_preset",
        "Timer created successfully from preset",
    );
    Ok(())
}

#[cfg(windows)]
use crate::keyboard_hook;

#[cfg(windows)]
#[tauri::command]
pub fn register_low_level_shortcut(
    shortcut: String,
    icon_id: String,
    app: AppHandle,
) -> Result<(), String> {
    log_command(
        "register_low_level_shortcut",
        &format!("Registering shortcut: {} for icon: {}", shortcut, icon_id),
    );

    let app_clone = app.clone();
    let shortcut_clone = shortcut.clone();
    let icon_id_clone = icon_id.clone();
    let callback = Box::new(move || {
        println!(
            "[KEYBOARD_HOOK] Shortcut triggered: {} for icon: {}",
            shortcut_clone, icon_id_clone
        );
        if icon_id_clone == "__reset_all_timers__" {
            if let Some(overlay_window) = app_clone.get_webview_window("overlay") {
                let _ = overlay_window.emit("reset-all-timers", ());
                println!("[KEYBOARD_HOOK] Reset all timers event emitted to overlay window");
            } else {
                println!("[KEYBOARD_HOOK] WARNING: Overlay window not found when trying to emit reset-all-timers");
            }
        } else {
            let _ = app_clone.emit("shortcut-triggered", icon_id_clone.clone());
        }
    });

    keyboard_hook::register_shortcut(shortcut, callback)
        .map_err(|e| format!("Failed to register shortcut: {}", e))?;

    Ok(())
}

#[cfg(windows)]
#[tauri::command]
pub fn unregister_all_low_level_shortcuts() -> Result<(), String> {
    log_command(
        "unregister_all_low_level_shortcuts",
        "Unregistering all shortcuts",
    );
    keyboard_hook::unregister_all_shortcuts()
        .map_err(|e| format!("Failed to unregister shortcuts: {}", e))?;
    Ok(())
}

#[cfg(not(windows))]
#[tauri::command]
pub fn register_low_level_shortcut(
    _shortcut: String,
    _icon_id: String,
    _app: AppHandle,
) -> Result<(), String> {
    Err("Low-level keyboard hooks are only available on Windows".to_string())
}

#[cfg(not(windows))]
#[tauri::command]
pub fn unregister_all_low_level_shortcuts() -> Result<(), String> {
    Ok(())
}

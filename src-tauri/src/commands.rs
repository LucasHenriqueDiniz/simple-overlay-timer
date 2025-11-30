use std::fs;
use tauri::{AppHandle, Emitter, Manager};

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

    log_command("save_config_silent", &format!("App data dir: {:?}", app_data_dir));

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

#[cfg(windows)]
use std::collections::HashMap;
#[cfg(windows)]
use std::sync::LazyLock;
#[cfg(windows)]
use std::sync::Mutex;
#[cfg(windows)]
use windows::{
    core::*, Win32::Foundation::*, Win32::System::LibraryLoader::*,
    Win32::UI::Input::KeyboardAndMouse::*, Win32::UI::WindowsAndMessaging::*,
};

#[cfg(windows)]
type ShortcutCallback = Box<dyn Fn() + Send + Sync>;

#[cfg(windows)]
static SHORTCUT_CALLBACKS: LazyLock<Mutex<HashMap<String, ShortcutCallback>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));
#[cfg(windows)]
static HOOK_HANDLE: LazyLock<Mutex<Option<isize>>> = LazyLock::new(|| Mutex::new(None));

#[cfg(windows)]
unsafe extern "system" fn low_level_keyboard_proc(
    n_code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    if n_code >= 0 {
        if let Ok(callbacks) = SHORTCUT_CALLBACKS.lock() {
            let kbd = &*(l_param.0 as *const KBDLLHOOKSTRUCT);
            let vk_code = kbd.vkCode;

            // Verificar se é keydown (WM_KEYDOWN = 0x0100, WM_SYSKEYDOWN = 0x0104)
            if w_param.0 == 0x0100 || w_param.0 == 0x0104 {
                // Verificar modificadores
                let alt = (GetAsyncKeyState(VK_MENU.0 as i32) as u16) & 0x8000 != 0;
                let ctrl = (GetAsyncKeyState(VK_CONTROL.0 as i32) as u16) & 0x8000 != 0;
                let shift = (GetAsyncKeyState(VK_SHIFT.0 as i32) as u16) & 0x8000 != 0;

                // Construir string do atalho
                let mut parts = Vec::new();
                if alt {
                    parts.push("Alt".to_string());
                }
                if ctrl {
                    parts.push("Ctrl".to_string());
                }
                if shift {
                    parts.push("Shift".to_string());
                }

                // Converter VK code para nome da tecla
                let key_name = vk_code_to_key_name(vk_code);
                if let Some(key) = key_name {
                    parts.push(key);
                    let shortcut = parts.join("+");

                    // Chamar callback se existir
                    if let Some(callback) = callbacks.get(&shortcut) {
                        callback();
                    }
                }
            }
        }
    }

    CallNextHookEx(HHOOK::default(), n_code, w_param, l_param)
}

#[cfg(windows)]
fn vk_code_to_key_name(vk_code: u32) -> Option<String> {
    match vk_code {
        0x30..=0x39 => Some(format!("{}", vk_code - 0x30)), // 0-9
        0x41..=0x5A => Some(((vk_code - 0x41 + b'A' as u32) as u8 as char).to_string()), // A-Z
        0x70..=0x7B => Some(format!("F{}", vk_code - 0x70 + 1)), // F1-F12
        0x60..=0x69 => Some(format!("Numpad{}", vk_code - 0x60)), // Numpad0-9
        0x20 => Some("Space".to_string()),                  // VK_SPACE
        0x0D => Some("Enter".to_string()),                  // VK_RETURN
        0x09 => Some("Tab".to_string()),                    // VK_TAB
        0x1B => Some("Escape".to_string()),                 // VK_ESCAPE
        0x08 => Some("Backspace".to_string()),              // VK_BACK
        0x2E => Some("Delete".to_string()),                 // VK_DELETE
        0x2D => Some("Insert".to_string()),                 // VK_INSERT
        0x24 => Some("Home".to_string()),                   // VK_HOME
        0x23 => Some("End".to_string()),                    // VK_END
        0x21 => Some("PageUp".to_string()),                 // VK_PRIOR
        0x22 => Some("PageDown".to_string()),               // VK_NEXT
        0x26 => Some("ArrowUp".to_string()),                // VK_UP
        0x28 => Some("ArrowDown".to_string()),              // VK_DOWN
        0x25 => Some("ArrowLeft".to_string()),              // VK_LEFT
        0x27 => Some("ArrowRight".to_string()),             // VK_RIGHT
        _ => None,
    }
}

#[cfg(windows)]
pub fn register_low_level_hook() -> Result<()> {
    unsafe {
        let hook = SetWindowsHookExA(
            WH_KEYBOARD_LL,
            Some(low_level_keyboard_proc),
            GetModuleHandleA(None)?,
            0,
        )?;

        let mut handle = HOOK_HANDLE.lock().unwrap();
        *handle = Some(hook.0 as *mut std::ffi::c_void as isize);

        println!("[KEYBOARD_HOOK] Low-level keyboard hook registered");
        Ok(())
    }
}

#[cfg(windows)]
#[allow(dead_code)]
pub fn unregister_low_level_hook() -> Result<()> {
    unsafe {
        let mut handle = HOOK_HANDLE.lock().unwrap();
        if let Some(hook_value) = handle.take() {
            let hook = HHOOK(hook_value as *mut std::ffi::c_void);
            UnhookWindowsHookEx(hook)?;
            println!("[KEYBOARD_HOOK] Low-level keyboard hook unregistered");
        }
        Ok(())
    }
}

#[cfg(windows)]
pub fn register_shortcut(shortcut: String, callback: ShortcutCallback) -> Result<()> {
    let mut callbacks = SHORTCUT_CALLBACKS.lock().unwrap();
    callbacks.insert(shortcut.clone(), callback);
    println!("[KEYBOARD_HOOK] Registered shortcut: {}", shortcut);
    Ok(())
}

#[cfg(windows)]
pub fn unregister_all_shortcuts() -> Result<()> {
    let mut callbacks = SHORTCUT_CALLBACKS.lock().unwrap();
    callbacks.clear();
    println!("[KEYBOARD_HOOK] All shortcuts unregistered");
    Ok(())
}

#[cfg(not(windows))]
pub fn register_low_level_hook() -> Result<()> {
    Ok(())
}

#[cfg(not(windows))]
pub fn unregister_low_level_hook() -> Result<()> {
    Ok(())
}

#[cfg(not(windows))]
pub fn register_shortcut(_shortcut: String, _callback: ShortcutCallback) -> Result<()> {
    Ok(())
}

#[cfg(not(windows))]
pub fn unregister_all_shortcuts() -> Result<()> {
    Ok(())
}

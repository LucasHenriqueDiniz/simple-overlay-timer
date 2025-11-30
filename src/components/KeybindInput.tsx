import { useState, useEffect, KeyboardEvent } from 'react';
import { TextInput } from '@mantine/core';

interface KeybindInputProps {
  value: string;
  onChange: (value: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function KeybindInput({ value, onChange, onError, disabled }: KeybindInputProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    setDisplayValue(value);
    if (!value || value.includes('+')) {
      setErrorMessage(undefined);
    }
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();

    const modifiers: string[] = [];
    if (e.altKey) modifiers.push('Alt');
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.metaKey) modifiers.push('Meta');

    // Ignore if only modifiers are pressed
    if (modifiers.length > 0 && ['Alt', 'Ctrl', 'Shift', 'Meta'].includes(e.key)) {
      return;
    }

    // Map special keys - usar e.code para detectar numpad corretamente
    let key = e.key;
    
    // Detectar teclas do numpad usando e.code (mais confiável)
    // e.code tem valores como: Numpad0, Numpad1, NumpadAdd, NumpadSubtract, etc.
    if (e.code && e.code.startsWith('Numpad')) {
      // Usar o código diretamente - Tauri aceita os códigos do numpad
      key = e.code; // Numpad0, Numpad1, NumpadAdd, NumpadSubtract, etc.
      console.log(`[KEYBIND] Detected numpad key: code="${e.code}", key="${e.key}" -> using "${key}"`);
    } else if (key === ' ') {
      key = 'Space';
    } else if (key.startsWith('F') && key.length > 1) {
      // F1-F12
      key = key.toUpperCase();
    } else if (key === '-') {
      // Minus pode ser do numpad ou normal - usar e.code para distinguir
      if (e.code === 'NumpadSubtract') {
        key = 'NumpadSubtract';
        console.log(`[KEYBIND] Detected numpad subtract: ${e.code}`);
      } else {
        key = 'Minus';
      }
    } else if (key === '+') {
      // Plus pode ser do numpad ou normal
      if (e.code === 'NumpadAdd') {
        key = 'NumpadAdd';
        console.log(`[KEYBIND] Detected numpad add: ${e.code}`);
      } else {
        key = 'Plus';
      }
    } else if (key.length === 1) {
      // Regular keys - NÃO normalizar números para numpad
      // Se o usuário pressionar "6" normal, deve ser "6", não "Numpad6"
      // Se pressionar "6" do numpad, e.code será "Numpad6" e será capturado acima
      key = key.toUpperCase();
    }

    if (modifiers.length === 0) {
      const errorMsg = 'Shortcut must include at least one modifier (Alt, Ctrl, Shift or Meta) to avoid interfering with other applications';
      console.warn(`[KEYBIND] ${errorMsg}`);
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
      setDisplayValue('');
      return;
    }
    
    setErrorMessage(undefined);

    const shortcut = [...modifiers, key].join('+');

    console.log(`[KEYBIND] Key pressed: key="${e.key}", code="${e.code}", shortcut="${shortcut}"`);
    setDisplayValue(shortcut);
    onChange(shortcut);
    onError?.(undefined as any);
  };

  return (
    <div>
      <TextInput
        value={displayValue}
        onKeyDown={handleKeyDown}
        placeholder="Press keys with modifier (e.g., Alt+F1, Ctrl+1)"
        readOnly
        disabled={disabled}
        error={errorMessage || (displayValue && !displayValue.includes('+') ? 'Use a modifier (Alt, Ctrl, Shift or Meta)' : undefined)}
        styles={{
          input: {
            cursor: disabled ? 'not-allowed' : 'text',
            fontFamily: 'monospace'
          }
        }}
      />
      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
        Required: use Alt, Ctrl, Shift or Meta + key to avoid interfering with other applications
      </div>
    </div>
  );
}




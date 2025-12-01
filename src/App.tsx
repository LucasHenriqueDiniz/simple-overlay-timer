import { useEffect, useState, useRef } from 'react';
import { MantineProvider } from '@mantine/core';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { getCurrentWindow, primaryMonitor, PhysicalPosition } from '@tauri-apps/api/window';
import { useConfig } from './hooks/useConfig';
import { OverlayIcon } from './components/OverlayIcon';
import { IconConfigModal } from './components/IconConfigModal';
import { SettingsPanel } from './components/SettingsPanel';
import { IconConfig, AppConfig } from './types/config';
import './App.css';

function App() {
  const { config, loading, saveConfig } = useConfig();
  const [selectedIcon, setSelectedIcon] = useState<IconConfig | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const timerRefs = useRef<{ [key: string]: () => void }>({});

  // Register global shortcuts
  useEffect(() => {
    if (loading || !config.icons.length) return;

    const registerShortcuts = async () => {
      try {
        await unregisterAll();
        
        for (const icon of config.icons) {
          if (!icon.keybind) continue;
          const normalizedKeybind = icon.keybind.trim();
          if (!normalizedKeybind) continue;

          await register(normalizedKeybind, () => {
            const startFn = timerRefs.current[icon.id];
            if (startFn) {
              startFn();
            }
          });
        }
      } catch (error) {
        console.error('Failed to register shortcuts:', error);
      }
    };

    registerShortcuts();

    return () => {
      unregisterAll().catch(console.error);
    };
  }, [config.icons, loading]);

  // Position overlay based on config
  useEffect(() => {
    if (loading) return;

    const positionOverlay = async () => {
      try {
        const window = getCurrentWindow();
        const monitor = await primaryMonitor();
        if (!monitor) return;

        const screenWidth = monitor.size.width;
        const screenHeight = monitor.size.height;
        const windowSize = await window.innerSize();
        const windowWidth = windowSize.width;
        const windowHeight = windowSize.height;
        
        let x = config.overlayPosition.x;
        let y = config.overlayPosition.y;

        if (config.overlayCorner) {
          switch (config.overlayCorner) {
            case 'top-left':
              x = 20;
              y = 20;
              break;
            case 'top-right':
              x = screenWidth - windowWidth - 20;
              y = 20;
              break;
            case 'bottom-left':
              x = 20;
              y = screenHeight - windowHeight - 20;
              break;
            case 'bottom-right':
              x = screenWidth - windowWidth - 20;
              y = screenHeight - windowHeight - 20;
              break;
          }
        }

        await window.setPosition(new PhysicalPosition(x, y));
      } catch (error) {
        console.error('Failed to position overlay:', error);
      }
    };

    positionOverlay();
  }, [config.overlayPosition, config.overlayCorner, loading]);

  const handleIconClick = (icon: IconConfig) => {
    setSelectedIcon(icon);
    setModalOpened(true);
  };

  const handleSaveIcon = async (iconConfig: IconConfig) => {
    const newIcons = config.icons.map(icon => 
      icon.id === iconConfig.id ? iconConfig : icon
    );
    
    if (!config.icons.find(i => i.id === iconConfig.id)) {
      newIcons.push(iconConfig);
    }

    const newConfig: AppConfig = {
      ...config,
      icons: newIcons
    };

    await saveConfig(newConfig);
  };

  const handleAddIcon = () => {
    setSelectedIcon(null);
    setModalOpened(true);
  };

  // handleTimerStart removido - não está sendo usado

  const existingKeybinds = config.icons
    .filter(icon => !selectedIcon || icon.id !== selectedIcon.id)
    .map(icon => icon.keybind?.trim())
    .filter((key): key is string => Boolean(key));

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <MantineProvider>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          minWidth: 'fit-content',
          position: 'relative'
        }}
      >
        {config.icons.map((icon) => (
          <OverlayIcon
            key={icon.id}
            config={icon}
            onConfigClick={() => handleIconClick(icon)}
            onStartTimerReady={(startFn) => {
              timerRefs.current[icon.id] = startFn;
            }}
          />
        ))}
        
        {showSettings && (
          <div style={{ marginLeft: '16px' }}>
            <SettingsPanel
              config={config}
              onConfigChange={saveConfig}
              onAddIcon={handleAddIcon}
            />
          </div>
        )}
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'white',
            zIndex: 1000
          }}
        >
          ⚙️
        </button>
      </div>

      <IconConfigModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setSelectedIcon(null);
        }}
        config={selectedIcon}
        onSave={handleSaveIcon}
        existingKeybinds={existingKeybinds}
      />
    </MantineProvider>
  );
}

export default App;

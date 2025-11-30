import { useState, useEffect } from 'react';
import { MantineProvider, Container, Title } from '@mantine/core';
import { useConfig } from './hooks/useConfig';
import { IconConfigModal } from './components/IconConfigModal';
import { SettingsPanel } from './components/SettingsPanel';
import { IconConfig } from './types/config';
import { settingsLogger } from './utils/logger';
import { getCurrentWindow } from '@tauri-apps/api/window';
import '@mantine/core/styles.css';
import './Settings.css';

function SettingsWindow() {
  const { config, loading, saveConfig } = useConfig();
  const [selectedIcon, setSelectedIcon] = useState<IconConfig | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    settingsLogger.info('SettingsWindow component mounted');
    
    // Interceptar fechamento da janela para esconder ao invés de fechar
    const setupWindowCloseHandler = async () => {
      try {
        const window = getCurrentWindow();
        await window.onCloseRequested(async (event) => {
          settingsLogger.info('Settings window close requested, hiding instead');
          event.preventDefault();
          await window.hide();
        });
        settingsLogger.info('Window close handler set up');
      } catch (error) {
        settingsLogger.error('Failed to set up window close handler:', error);
      }
    };
    
    setupWindowCloseHandler();
  }, []);

  // Force show after 2 seconds if still loading
  useEffect(() => {
    settingsLogger.debug('SettingsWindow render - loading:', loading, 'config:', config);
  }, [loading, config]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        settingsLogger.warn('Config loading taking too long, forcing show');
        setForceShow(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [loading]);

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

    const newConfig = {
      ...config,
      icons: newIcons
    };

    await saveConfig(newConfig);
  };

  const handleAddIcon = () => {
    setSelectedIcon(null);
    setModalOpened(true);
  };

  const existingKeybinds = config.icons
    .filter(icon => !selectedIcon || icon.id !== selectedIcon.id)
    .map(icon => icon.keybind);

  const showContent = !loading || forceShow;

  return (
    <MantineProvider>
      <div style={{ 
        background: '#ffffff', 
        minHeight: '100vh', 
        padding: '20px',
        width: '100%',
        height: '100%',
        color: '#000000'
      }}>
        {!showContent ? (
          <div style={{ padding: '20px', color: '#000000' }}>
            <h1>Carregando configurações...</h1>
          </div>
        ) : (
          <>
            <Container size="md" py="xl" style={{ width: '100%' }}>
              <Title order={1} mb="xl" style={{ color: '#000000' }}>Configurações - Overlay Timer</Title>
              
              <SettingsPanel
                config={config}
                onConfigChange={saveConfig}
                onAddIcon={handleAddIcon}
                onIconClick={(iconId) => {
                  const icon = config.icons.find(i => i.id === iconId);
                  if (icon) {
                    handleIconClick(icon);
                  }
                }}
              />
            </Container>

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
          </>
        )}
      </div>
    </MantineProvider>
  );
}

export default SettingsWindow;


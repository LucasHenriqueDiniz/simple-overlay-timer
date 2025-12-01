import { useState, useEffect } from 'react';
import { MantineProvider, Container } from '@mantine/core';
import { useConfig } from './hooks/useConfig';
import { IconConfigModal } from './components/IconConfigModal';
import { WelcomeModal } from './components/WelcomeModal';
import { SettingsTabs } from './components/SettingsTabs';
import { SettingsHeader } from './components/SettingsHeader';
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
  const [welcomeOpen, setWelcomeOpen] = useState(false);

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
    if (!loading && config.showWelcomeModal !== false) {
      setWelcomeOpen(true);
    }
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

  const handleCloseWelcome = async () => {
    setWelcomeOpen(false);
    if (config.showWelcomeModal !== false) {
      await saveConfig({ ...config, showWelcomeModal: false });
    }
  };

  const handleCreateTimerFromWelcome = async () => {
    setWelcomeOpen(false);
    setSelectedIcon(null);
    setModalOpened(true);
    if (config.showWelcomeModal !== false) {
      await saveConfig({ ...config, showWelcomeModal: false });
    }
  };

  const existingKeybinds = config.icons
    .filter(icon => !selectedIcon || icon.id !== selectedIcon.id)
    .map(icon => icon.keybind?.trim())
    .filter((key): key is string => Boolean(key));

  const showContent = !loading || forceShow;

  return (
    <MantineProvider>
      <div style={{ 
        background: '#ffffff', 
        minHeight: '100vh',
        width: '100%',
        height: '100%',
        color: '#000000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <SettingsHeader />
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {!showContent ? (
            <div style={{ padding: '20px', color: '#000000' }}>
              <h1>Loading settings...</h1>
            </div>
          ) : (
            <>
              <Container size="md" py="xl" style={{ width: '100%' }}>
                <SettingsTabs
                  config={config}
                  onConfigChange={saveConfig}
                  onAddIcon={handleAddIcon}
                  onIconClick={(iconId: string) => {
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
              <WelcomeModal
                opened={welcomeOpen}
                onClose={handleCloseWelcome}
                onCreateFirstTimer={handleCreateTimerFromWelcome}
                existingTimers={config.icons}
              />
            </>
          )}
        </div>
      </div>
    </MantineProvider>
  );
}

export default SettingsWindow;


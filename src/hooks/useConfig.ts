import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AppConfig, getDefaultConfig } from '../types/config';
import { configLogger } from '../utils/logger';

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(getDefaultConfig());
  const [loading, setLoading] = useState(true);

  const loadConfig = async () => {
    try {
      configLogger.info('Loading config...');
      setLoading(true);
      const json = await invoke<string>('load_config');
      const loadedConfig = JSON.parse(json) as AppConfig;
      configLogger.info('Config loaded successfully:', loadedConfig);
      setConfig(loadedConfig);
    } catch (error) {
      configLogger.warn('Config not found, using default:', error);
      const defaultConfig = getDefaultConfig();
      configLogger.info('Using default config:', defaultConfig);
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
      configLogger.info('Config loading completed');
    }
  };

  const saveConfig = async (newConfig: AppConfig, emitEvent: boolean = true) => {
    try {
      configLogger.info('Saving config:', newConfig);
      await invoke('save_config', { 
        config: JSON.stringify(newConfig),
        emitEvent: emitEvent
      });
      configLogger.info('Config saved successfully');
      setConfig(newConfig);
    } catch (error) {
      configLogger.error('Failed to save config:', error);
      throw error;
    }
  };

  useEffect(() => {
    configLogger.info('useConfig hook initialized');
    loadConfig();
  }, []);

  return { config, loading, saveConfig, reloadConfig: loadConfig };
}




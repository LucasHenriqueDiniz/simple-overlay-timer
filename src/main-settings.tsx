console.log('[MAIN-SETTINGS] Script file loaded');

import React from "react";
import ReactDOM from "react-dom/client";
import SettingsWindow from "./SettingsWindow";
import { settingsLogger } from "./utils/logger";
import '@mantine/core/styles.css';

console.log('[MAIN-SETTINGS] React imported:', React);
console.log('[MAIN-SETTINGS] ReactDOM imported:', ReactDOM);
console.log('[MAIN-SETTINGS] SettingsWindow imported:', SettingsWindow);
console.log('[MAIN-SETTINGS] Logger imported:', settingsLogger);

settingsLogger.info('main-settings.tsx loaded');
settingsLogger.info('React version:', React.version);
settingsLogger.info('Document ready state:', document.readyState);

// Função de inicialização
function init() {
  console.log('[MAIN-SETTINGS] Init function called');
  settingsLogger.info('Initializing SettingsWindow...');
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    settingsLogger.error('Root element not found!');
    document.body.innerHTML = '<div style="padding: 20px; color: red; background: white; font-size: 16px;">Root element not found!</div>';
    return;
  }

  settingsLogger.info('Root element found, rendering SettingsWindow...');
  
  try {
    console.log('[MAIN-SETTINGS] Creating root...');
    const root = ReactDOM.createRoot(rootElement);
    console.log('[MAIN-SETTINGS] Rendering SettingsWindow...');
    root.render(
      <React.StrictMode>
        <SettingsWindow />
      </React.StrictMode>
    );
    settingsLogger.info('SettingsWindow rendered successfully');
    console.log('[MAIN-SETTINGS] Render complete');
  } catch (error) {
    console.error('[MAIN-SETTINGS] Render error:', error);
    settingsLogger.error('Error rendering SettingsWindow:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    rootElement.innerHTML = `
      <div style="padding: 20px; background: #ffffff; color: #000000; font-family: Arial, sans-serif;">
        <h1 style="color: #000;">Erro ao renderizar SettingsWindow</h1>
        <p style="color: red; font-weight: bold;">${errorMsg}</p>
        <pre style="background: #f5f5f5; padding: 10px; overflow: auto; font-size: 12px;">${errorStack}</pre>
        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">Recarregar</button>
      </div>
    `;
  }
}

// Aguardar DOM estar pronto
if (document.readyState === 'loading') {
  console.log('[MAIN-SETTINGS] Waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', init);
} else {
  console.log('[MAIN-SETTINGS] DOM already ready, calling init');
  init();
}


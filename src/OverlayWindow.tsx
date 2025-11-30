import { useEffect, useRef } from 'react';
import { MantineProvider } from '@mantine/core';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { getCurrentWindow, PhysicalPosition, PhysicalSize } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { useConfig } from './hooks/useConfig';
import { useMonitors } from './hooks/useMonitors';
import { OverlayIcon } from './components/OverlayIcon';
import { overlayLogger } from './utils/logger';
import '@mantine/core/styles.css';
import './App.css';

function OverlayWindow() {
  const { config, loading, reloadConfig } = useConfig();
  const { monitors } = useMonitors();
  const timerRefs = useRef<{ [key: string]: () => void }>({});
  const resetTimerRefs = useRef<{ [key: string]: () => void }>({});

  // Escutar eventos de mudança de config e posição
  useEffect(() => {
    const window = getCurrentWindow();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    
    // Escutar config-changed (mudanças gerais: ícones, orientação, etc)
    const unlistenConfig = window.listen('config-changed', async () => {
      overlayLogger.info('[OVERLAY] Config changed event received, debouncing reload...');
      
      // Debounce: aguardar 200ms antes de recarregar
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = setTimeout(async () => {
        try {
          overlayLogger.info('[OVERLAY] Reloading config after debounce...');
          await reloadConfig();
          overlayLogger.info('[OVERLAY] Config reloaded successfully after event');
        } catch (error) {
          overlayLogger.error('[OVERLAY] Failed to reload config after event:', error);
        }
      }, 200);
    });

    const unlistenPosition = window.listen('position-changed', () => {
      overlayLogger.info('[OVERLAY] Position changed event received - setting flag to ignore next position update');
      positionChangedRef.current = true;
    });

    const unlistenReset = window.listen('reset-all-timers', () => {
      overlayLogger.info('[OVERLAY] Reset all timers event received');
      Object.values(resetTimerRefs.current).forEach((resetFn) => {
        if (resetFn) {
          resetFn();
        }
      });
      overlayLogger.info(`[OVERLAY] Reset ${Object.keys(resetTimerRefs.current).length} timers`);
    });

    overlayLogger.info('[OVERLAY] Listening for config-changed, position-changed and reset-all-timers events');

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      unlistenConfig.then((unlistenFn) => unlistenFn()).catch((err) => {
        overlayLogger.error('Failed to unlisten config-changed event:', err);
      });
      unlistenPosition.then((unlistenFn) => unlistenFn()).catch((err) => {
        overlayLogger.error('Failed to unlisten position-changed event:', err);
      });
      unlistenReset.then((unlistenFn) => unlistenFn()).catch((err) => {
        overlayLogger.error('Failed to unlisten reset-all-timers event:', err);
      });
    };
  }, [reloadConfig]);

  // Calcular tamanho dinâmico do overlay baseado na orientação e número de ícones
  const getOverlaySize = () => {
    const iconSize = config.compactMode ? 60 : 80;
    const gap = 8;
    const iconCount = config.icons.length || 1;
    const padding = 4; // Padding de segurança para evitar corte

    if (config.overlayOrientation === 'vertical') {
      return {
        width: iconSize + padding * 2,
        height: iconCount * iconSize + (iconCount > 0 ? (iconCount - 1) * gap : 0) + padding * 2
      };
    } else {
      return {
        width: iconCount * iconSize + (iconCount > 0 ? (iconCount - 1) * gap : 0) + padding * 2,
        height: iconSize + padding * 2
      };
    }
  };

  useEffect(() => {
    overlayLogger.info('OverlayWindow component mounted');
  }, []);

  // Escutar eventos de atalhos do hook de baixo nível
  useEffect(() => {
    const window = getCurrentWindow();
    
    const unlisten = window.listen('shortcut-triggered', async (event: any) => {
      const iconId = event.payload as string;
      overlayLogger.info(`Low-level hook triggered shortcut for icon: ${iconId}`);
      
      const startFn = timerRefs.current[iconId];
      if (startFn) {
        overlayLogger.info(`Starting timer for icon: ${iconId}`);
        try {
          startFn();
        } catch (error) {
          overlayLogger.error(`Error calling start function for icon ${iconId}:`, error);
        }
      } else {
        overlayLogger.warn(`No timer function found for icon: ${iconId}`);
      }
    });

    return () => {
      unlisten.then((unlistenFn) => unlistenFn()).catch((err) => {
        overlayLogger.error('Failed to unlisten shortcut-triggered event:', err);
      });
    };
  }, []);

  useEffect(() => {
    if (loading) {
      overlayLogger.info('Skipping shortcut registration: loading');
      return;
    }

    const registerShortcuts = async () => {
      try {
        console.log(`[SHORTCUT] ========== STARTING SHORTCUT REGISTRATION ==========`);
        overlayLogger.info('=== Starting shortcut registration ===');
        
        const useLowLevelHook = navigator.platform.includes('Win');
        
        if (useLowLevelHook) {
          try {
            console.log(`[SHORTCUT] Attempting to use low-level keyboard hook...`);
            await invoke('unregister_all_low_level_shortcuts');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (config.icons.length > 0) {
              for (const icon of config.icons) {
                const iconId = icon.id;
                const normalizedKeybind = icon.keybind.trim();
                
                try {
                  await invoke('register_low_level_shortcut', {
                    shortcut: normalizedKeybind,
                    iconId: iconId
                  });
                  console.log(`[SHORTCUT] ✓ Registered low-level shortcut "${normalizedKeybind}" for icon: ${iconId}`);
                  overlayLogger.info(`✓ Registered low-level shortcut "${normalizedKeybind}" for icon: ${iconId}`);
                } catch (error) {
                  console.error(`[SHORTCUT] ✗ Failed to register low-level shortcut "${normalizedKeybind}":`, error);
                  overlayLogger.error(`✗ Failed to register low-level shortcut "${normalizedKeybind}":`, error);
                }
              }
            }

            if (config.resetAllTimersKeybind) {
              try {
                const normalizedKeybind = config.resetAllTimersKeybind.trim();
                await invoke('register_low_level_shortcut', {
                  shortcut: normalizedKeybind,
                  iconId: '__reset_all_timers__'
                });
                console.log(`[SHORTCUT] ✓ Registered reset all timers shortcut: "${normalizedKeybind}"`);
                overlayLogger.info(`✓ Registered reset all timers shortcut: "${normalizedKeybind}"`);
              } catch (error) {
                console.error(`[SHORTCUT] ✗ Failed to register reset all timers shortcut:`, error);
                overlayLogger.error(`✗ Failed to register reset all timers shortcut:`, error);
              }
            }

            console.log(`[SHORTCUT] Using low-level keyboard hook for games`);
            overlayLogger.info('Using low-level keyboard hook for games');
            return;
          } catch (error) {
            console.warn(`[SHORTCUT] Low-level hook failed, falling back to standard plugin:`, error);
            overlayLogger.warn('Low-level hook failed, falling back to standard plugin');
          }
        }
        
        console.log(`[SHORTCUT] Using standard global-shortcut plugin`);
        overlayLogger.info('Using standard global-shortcut plugin');
        
        console.log(`[SHORTCUT] Unregistering all shortcuts before registering ${config.icons.length} new ones...`);
        overlayLogger.info(`Unregistering all shortcuts before registering ${config.icons.length} new ones...`);
        
        await unregisterAll();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (config.icons.length > 0) {
          const timerKeys = Object.keys(timerRefs.current);
          console.log(`[SHORTCUT] Current timerRefs keys: ${timerKeys.join(', ') || 'NONE'}`);
          overlayLogger.info(`Current timerRefs keys: ${timerKeys.join(', ') || 'NONE'}`);
          console.log(`[SHORTCUT] Registering ${config.icons.length} shortcuts...`);
          overlayLogger.info(`Registering ${config.icons.length} shortcuts...`);
          
          for (const icon of config.icons) {
            const iconId = icon.id;
            const normalizedKeybind = icon.keybind.trim();
            
            console.log(`[SHORTCUT] Attempting to register: "${normalizedKeybind}" for icon: ${iconId}`);
            overlayLogger.info(`Attempting to register: "${normalizedKeybind}" for icon: ${iconId}`);
            
            try {
              await register(normalizedKeybind, () => {
                console.log(`[SHORTCUT] ===== TRIGGERED ===== "${normalizedKeybind}" for icon: ${iconId}`);
                overlayLogger.info(`Shortcut triggered: "${normalizedKeybind}" for icon: ${iconId}`);
                
                const startFn = timerRefs.current[iconId];
                if (startFn) {
                  overlayLogger.info(`Starting timer for icon: ${iconId}`);
                  console.log(`[SHORTCUT] Starting timer for icon: ${iconId}`);
                  try {
                    startFn();
                    console.log(`[SHORTCUT] Timer start function called successfully for icon: ${iconId}`);
                  } catch (error) {
                    console.error(`[SHORTCUT] Error calling start function for icon ${iconId}:`, error);
                    overlayLogger.error(`Error calling start function for icon ${iconId}:`, error);
                  }
                } else {
                  overlayLogger.warn(`No timer function found for icon: ${iconId}`);
                  console.warn(`[SHORTCUT] No timer function for icon: ${iconId}`);
                }
              });
              
              console.log(`[SHORTCUT] ✓✓✓ Successfully registered shortcut "${normalizedKeybind}" for icon: ${iconId}`);
              overlayLogger.info(`✓ Successfully registered shortcut "${normalizedKeybind}" for icon: ${iconId}`);
            } catch (error) {
              console.error(`[SHORTCUT] ✗✗✗ FAILED to register shortcut "${normalizedKeybind}":`, error);
              overlayLogger.error(`✗ Failed to register shortcut "${normalizedKeybind}":`, error);
              if (error instanceof Error) {
                console.error(`[SHORTCUT] Error message: ${error.message}`);
                console.error(`[SHORTCUT] Error stack: ${error.stack}`);
              }
            }
          }
        }

        if (config.resetAllTimersKeybind) {
          try {
            const normalizedKeybind = config.resetAllTimersKeybind.trim();
            await register(normalizedKeybind, () => {
              overlayLogger.info('[SHORTCUT] Reset all timers shortcut triggered');
              const overlayWindow = getCurrentWindow();
              overlayWindow.emit('reset-all-timers', null);
            });
            console.log(`[SHORTCUT] ✓ Registered reset all timers shortcut: "${normalizedKeybind}"`);
            overlayLogger.info(`✓ Registered reset all timers shortcut: "${normalizedKeybind}"`);
          } catch (error) {
            console.error(`[SHORTCUT] ✗ Failed to register reset all timers shortcut:`, error);
            overlayLogger.error(`✗ Failed to register reset all timers shortcut:`, error);
          }
        }

        console.log(`[SHORTCUT] ========== ALL SHORTCUTS REGISTRATION COMPLETED ==========`);
        overlayLogger.info('=== All shortcuts registration completed ===');
      } catch (error) {
        console.error('[SHORTCUT] ========== REGISTRATION ERROR ==========', error);
        overlayLogger.error('Failed to register shortcuts:', error);
        if (error instanceof Error) {
          console.error(`[SHORTCUT] Error message: ${error.message}`);
          console.error(`[SHORTCUT] Error stack: ${error.stack}`);
        }
      }
    };
    
    const timeoutId = setTimeout(() => {
      registerShortcuts();
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      overlayLogger.info('Cleaning up shortcuts...');
      unregisterAll().catch((err) => {
        overlayLogger.error('Error unregistering shortcuts:', err);
      });
      invoke('unregister_all_low_level_shortcuts').catch(console.error);
    };
  }, [config.icons, config.resetAllTimersKeybind, loading]);

  // Flag para ignorar reposicionamento quando position-changed foi recebido
  const positionChangedRef = useRef(false);

  // Position overlay based on config
  useEffect(() => {
    if (loading || monitors.length === 0) return;
    
    // Se position-changed foi recebido recentemente, ignorar este reposicionamento
    if (positionChangedRef.current) {
      overlayLogger.info('[OVERLAY] Ignoring position update - position was changed manually');
      positionChangedRef.current = false; // Reset flag
      return;
    }

    const positionOverlay = async () => {
      try {
        const window = getCurrentWindow();
        
        // Obter monitor selecionado ou primário
        const monitorIndex = config.overlayMonitor ?? 0;
        const selectedMonitor = monitors[monitorIndex] || monitors[0];
        if (!selectedMonitor) {
          overlayLogger.warn(`Monitor ${monitorIndex} not found, using primary`);
          return;
        }
        
        // Log config completo para debug de ordens de atualização
        overlayLogger.debug(
          `[OVERLAY] Positioning overlay: monitor=${monitorIndex}, ` +
          `position=(${config.overlayPosition.x}, ${config.overlayPosition.y}), ` +
          `corner=${config.overlayCorner || 'none'}`
        );
        console.log(
          `[OVERLAY] Positioning: monitor=${monitorIndex}, ` +
          `pos=(${config.overlayPosition.x},${config.overlayPosition.y})`
        );

        // Calcular tamanho atual do overlay
        const overlaySize = getOverlaySize();
        
        // Obter posição relativa ao monitor selecionado
        const monitorPosition = selectedMonitor.position;
        const screenWidth = selectedMonitor.size.width;
        const screenHeight = selectedMonitor.size.height;
        
        let relativeX = config.overlayPosition.x;
        let relativeY = config.overlayPosition.y;

        // Se overlayCorner estiver definido, usar corner
        if (config.overlayCorner) {
          const corner = config.overlayCorner;
          const margin = 20;
          switch (corner) {
            case 'top-left':
              relativeX = margin;
              relativeY = margin;
              break;
            case 'top-right':
              relativeX = screenWidth - overlaySize.width - margin;
              relativeY = margin;
              break;
            case 'bottom-left':
              relativeX = margin;
              relativeY = screenHeight - overlaySize.height - margin;
              break;
            case 'bottom-right':
              relativeX = screenWidth - overlaySize.width - margin;
              relativeY = screenHeight - overlaySize.height - margin;
              break;
          }
        }

        // Garantir que está dentro dos limites do monitor
        const maxX = screenWidth - overlaySize.width;
        const maxY = screenHeight - overlaySize.height;
        const clampedX = Math.max(0, Math.min(relativeX, maxX));
        const clampedY = Math.max(0, Math.min(relativeY, maxY));

        // Converter para coordenadas absolutas na tela
        const absoluteX = Math.round(monitorPosition.x + clampedX);
        const absoluteY = Math.round(monitorPosition.y + clampedY);

        // Garantir que a janela está visível
        try {
          await window.show();
        } catch (showError) {
          overlayLogger.debug('Window already visible or show failed:', showError);
        }
        
        // 1) Ajustar tamanho físico primeiro (evita efeitos estranhos)
        await window.setSize(new PhysicalSize(overlaySize.width, overlaySize.height));

        // 2) Posicionar (simplificado - remover delays excessivos que podem estar causando problemas)
        await window.setPosition(new PhysicalPosition(absoluteX, absoluteY));
        
        overlayLogger.info(
          `[OVERLAY] Overlay positioned: monitor=${monitorIndex} (${selectedMonitor.name}), ` +
          `monitorPos=(${monitorPosition.x}, ${monitorPosition.y}), ` +
          `monitorSize=${screenWidth}x${screenHeight}, ` +
          `relativePos=(${clampedX}, ${clampedY}), ` +
          `absolutePos=(${absoluteX}, ${absoluteY})`
        );
        console.log(
          `[OVERLAY] Positioned: monitor=${monitorIndex}, ` +
          `absolute=(${absoluteX},${absoluteY}), relative=(${clampedX},${clampedY})`
        );
      } catch (error) {
        overlayLogger.error('Failed to position overlay, attempting retry...', error);
        console.error('[POSITION] Error positioning overlay, attempting retry...', error);

        // Tentativa de retry (Tauri tem alguns problemas de timing/first-call em multi-monitor)
        try {
          await new Promise(res => setTimeout(res, 120));
          
          // Recalcular tudo para o retry
          const retryWindow = getCurrentWindow();
          const retryMonitorIndex = config.overlayMonitor ?? 0;
          const retrySelectedMonitor = monitors[retryMonitorIndex] || monitors[0];
          if (!retrySelectedMonitor) return;
          
          const retryOverlaySize = getOverlaySize();
          const retryMonitorPosition = retrySelectedMonitor.position;
          const retryScreenWidth = retrySelectedMonitor.size.width;
          const retryScreenHeight = retrySelectedMonitor.size.height;
          
          let retryRelativeX = config.overlayPosition.x;
          let retryRelativeY = config.overlayPosition.y;

          if (config.overlayCorner) {
            const corner = config.overlayCorner;
            const margin = 20;
            switch (corner) {
              case 'top-left':
                retryRelativeX = margin;
                retryRelativeY = margin;
                break;
              case 'top-right':
                retryRelativeX = retryScreenWidth - retryOverlaySize.width - margin;
                retryRelativeY = margin;
                break;
              case 'bottom-left':
                retryRelativeX = margin;
                retryRelativeY = retryScreenHeight - retryOverlaySize.height - margin;
                break;
              case 'bottom-right':
                retryRelativeX = retryScreenWidth - retryOverlaySize.width - margin;
                retryRelativeY = retryScreenHeight - retryOverlaySize.height - margin;
                break;
            }
          }
          
          const retryMaxX = retryScreenWidth - retryOverlaySize.width;
          const retryMaxY = retryScreenHeight - retryOverlaySize.height;
          const retryClampedX = Math.max(0, Math.min(retryRelativeX, retryMaxX));
          const retryClampedY = Math.max(0, Math.min(retryRelativeY, retryMaxY));
          const retryAbsoluteX = Math.round(retryMonitorPosition.x + retryClampedX);
          const retryAbsoluteY = Math.round(retryMonitorPosition.y + retryClampedY);
          
          await retryWindow.setSize(new PhysicalSize(retryOverlaySize.width, retryOverlaySize.height));
          await retryWindow.setPosition(new PhysicalPosition(retryAbsoluteX, retryAbsoluteY));
          
          overlayLogger.info(`[POSITION] Retry succeeded: absolute=(${retryAbsoluteX},${retryAbsoluteY})`);
          console.log('[POSITION] Retry succeeded');
        } catch (err2) {
          overlayLogger.error('Retry also failed:', err2);
          console.error('[POSITION] Retry also failed:', err2);
        }
      }
    };

    positionOverlay();
  }, [
    config.overlayPosition, 
    config.overlayCorner, 
    config.overlayOrientation, 
    config.icons.length, 
    config.compactMode,
    config.overlayMonitor,
    loading, 
    monitors
  ]);

  if (loading) {
    return (
      <MantineProvider>
        <div style={{ padding: '20px', color: 'white' }}>Loading...</div>
      </MantineProvider>
    );
  }

  if (config.icons.length === 0) {
    return (
      <MantineProvider>
        <div
          style={{
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center',
            fontSize: '12px'
          }}
        >
          <p style={{ margin: 0 }}>Nenhum ícone configurado.</p>
          <p style={{ fontSize: '10px', marginTop: '4px', marginBottom: 0 }}>
            Clique no ícone do tray para configurar
          </p>
        </div>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider>
      <div
        key={`overlay-${config.overlayOrientation}-${config.icons.length}-${config.compactMode}`}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          display: 'flex',
          flexDirection: config.overlayOrientation === 'vertical' ? 'column' : 'row',
          gap: '8px',
          padding: '4px',
          background: 'transparent',
          minWidth: 'fit-content',
          border: 'none',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      >
        {config.icons.map((icon) => (
          <OverlayIcon
            key={icon.id}
            config={icon}
            compactMode={config.compactMode}
            timerColor={config.timerColor || '#2196F3'}
            timerRunningColor={config.timerRunningColor || '#4CAF50'}
            onConfigClick={async () => {
              // Não fazer nada - overlay não é interativo
            }}
            onStartTimerReady={(startFn) => {
              overlayLogger.debug(`Timer ready for icon: ${icon.id}`);
              console.log(`[TIMER] Timer ready for icon: ${icon.id}, duration: ${icon.timerDuration}s`);
              timerRefs.current[icon.id] = startFn;
              const totalReady = Object.keys(timerRefs.current).length;
              overlayLogger.info(`Timer function registered for icon: ${icon.id}. Total: ${totalReady}/${config.icons.length}`);
              
              // Re-registrar shortcuts quando todos os timers estiverem prontos
              if (totalReady === config.icons.length) {
                console.log(`[TIMER] All ${totalReady} timers ready, shortcuts should be registered`);
                overlayLogger.info(`All timers ready, shortcuts should be active`);
              }
            }}
            onResetTimerReady={(resetFn) => {
              resetTimerRefs.current[icon.id] = resetFn;
              overlayLogger.debug(`Reset function registered for icon: ${icon.id}`);
            }}
          />
        ))}
      </div>
    </MantineProvider>
  );
}

export default OverlayWindow;


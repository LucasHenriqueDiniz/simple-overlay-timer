import React, { useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { IconConfig } from '../types/config';
import { useTimer } from '../hooks/useTimer';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { timerLogger } from '../utils/logger';

interface OverlayIconProps {
  config: IconConfig;
  onConfigClick?: () => void;
  onTimerComplete?: () => void;
  onStartTimerReady?: (startFn: () => void) => void;
  onResetTimerReady?: (resetFn: () => void) => void;
  compactMode?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  timerColor?: string;
  timerRunningColor?: string;
}

export function OverlayIcon({ 
  config,
  onConfigClick: _onConfigClick,
  onTimerComplete, 
  onStartTimerReady,
  onResetTimerReady,
  compactMode = false,
  strokeColor: _strokeColor,
  strokeWidth: _strokeWidth = 0,
  timerColor = '#2196F3',
  timerRunningColor = '#4CAF50'
}: OverlayIconProps) {
  const timer = useTimer(config.timerDuration);
  const completedRef = useRef(false);
  const wasRunningRef = useRef(false);

  useEffect(() => {
    if (timer.running && !wasRunningRef.current) {
      wasRunningRef.current = true;
      completedRef.current = false;
      timerLogger.debug(`[TIMER] Timer started for icon: ${config.id}`);
    }
  }, [timer.running, config.id]);

  useEffect(() => {
    if (timer.remaining === 0 && !timer.running && wasRunningRef.current && !completedRef.current) {
      completedRef.current = true;
      wasRunningRef.current = false; // Reset para permitir próximo ciclo
      timerLogger.info(`[TIMER] ✓✓✓ Timer completed for icon: ${config.id} (${config.iconName || 'Custom'}), remaining=${timer.remaining}, running=${timer.running}`);
      console.log(`[TIMER] ✓✓✓ Timer completed for icon: ${config.id}, notificationType=${config.notificationType}`);
      
      const handleNotifications = async () => {
        // Notificação
        if (config.notificationType === 'notification' || config.notificationType === 'both') {
          timerLogger.info(`[NOTIFICATION] ========== Attempting to send notification for icon: ${config.id} ==========`);
          console.log(`[NOTIFICATION] ========== Attempting to send notification for icon: ${config.id} ==========`);
          try {
            let permissionGranted = await isPermissionGranted();
            timerLogger.info(`[NOTIFICATION] Current permission status: ${permissionGranted}`);
            console.log(`[NOTIFICATION] Current permission status: ${permissionGranted}`);
            
            if (!permissionGranted) {
              timerLogger.info('[NOTIFICATION] Requesting notification permission...');
              console.log('[NOTIFICATION] Requesting notification permission...');
              try {
                const permission = await requestPermission();
                permissionGranted = permission === 'granted';
                timerLogger.info(`[NOTIFICATION] Permission request result: ${permission}`);
                console.log(`[NOTIFICATION] Permission request result: ${permission}`);
              } catch (permError) {
                timerLogger.error(`[NOTIFICATION] Error requesting permission:`, permError);
                console.error('[NOTIFICATION] Error requesting permission:', permError);
              }
            }
            
            if (permissionGranted) {
              timerLogger.info(`[NOTIFICATION] Sending notification...`);
              console.log(`[NOTIFICATION] Sending notification...`);
              try {
                await sendNotification({
                  title: 'Timer Completed',
                  body: config.name 
                    ? `Timer "${config.name}" completed!`
                    : `Timer icon ${config.iconName || 'Custom'} completed!`
                });
                timerLogger.info(`[NOTIFICATION] ✓✓✓ Notification sent successfully for icon: ${config.id}`);
                console.log(`[NOTIFICATION] ✓✓✓ Notification sent successfully for icon: ${config.id}`);
              } catch (sendError) {
                timerLogger.error(`[NOTIFICATION] ✗✗✗ Error sending notification:`, sendError);
                console.error('[NOTIFICATION] ✗✗✗ Error sending notification:', sendError);
                if (sendError instanceof Error) {
                  console.error('[NOTIFICATION] Error message:', sendError.message);
                  console.error('[NOTIFICATION] Error stack:', sendError.stack);
                }
                throw sendError; // Re-throw para ser capturado pelo catch externo
              }
            } else {
              timerLogger.warn('[NOTIFICATION] ✗✗✗ Permission not granted, cannot send notification');
              console.warn('[NOTIFICATION] ✗✗✗ Permission not granted, cannot send notification');
              console.warn('[NOTIFICATION] TIP: Check Windows notification settings in Settings > System > Notifications');
            }
          } catch (error) {
            timerLogger.error(`[NOTIFICATION] ✗✗✗ Failed to send notification for icon: ${config.id}:`, error);
            console.error('[NOTIFICATION] ✗✗✗ Failed to send notification:', error);
            if (error instanceof Error) {
              console.error('[NOTIFICATION] Error message:', error.message);
              console.error('[NOTIFICATION] Error stack:', error.stack);
            }
          }
        }
        
        // Som
        if (config.notificationType === 'sound' || config.notificationType === 'both') {
          timerLogger.info(`[SOUND] ========== Attempting to play alarm sound for icon: ${config.id} ==========`);
          console.log(`[SOUND] ========== Attempting to play alarm sound for icon: ${config.id} ==========`);
          // No Tauri v2, arquivos em resources podem ser acessados via asset://
          // Tentar múltiplos caminhos possíveis
          const audioPaths = [
            'asset://sfx/alarm.mp3',  // Production (resources)
            '/sfx/alarm.mp3',  // Dev mode (public)
            'sfx/alarm.mp3',
            './sfx/alarm.mp3',
            '../sfx/alarm.mp3',
            'public/sfx/alarm.mp3',
            '/public/sfx/alarm.mp3'
          ];
          
          let audioPlayed = false;
          for (const path of audioPaths) {
            try {
              timerLogger.debug(`[SOUND] Trying path: ${path}`);
              console.log(`[SOUND] Trying path: ${path}`);
              const audio = new Audio(path);
              audio.volume = 0.7;
              
              // Adicionar event listeners para debug
              audio.addEventListener('loadstart', () => {
                timerLogger.debug(`[SOUND] Audio loadstart for path: ${path}`);
                console.log(`[SOUND] Audio loadstart for path: ${path}`);
              });
              audio.addEventListener('canplay', () => {
                timerLogger.debug(`[SOUND] Audio canplay for path: ${path}`);
                console.log(`[SOUND] Audio canplay for path: ${path}`);
              });
              audio.addEventListener('error', () => {
                // Erro é esperado quando tentamos múltiplos caminhos - apenas logar como debug
                timerLogger.debug(`[SOUND] Audio error for path: ${path} (this is normal when trying multiple paths)`);
                console.debug(`[SOUND] Audio error for path: ${path} (this is normal when trying multiple paths)`);
              });
              audio.addEventListener('loadeddata', () => {
                console.log(`[SOUND] Audio loadeddata for path: ${path}`);
              });
              audio.addEventListener('play', () => {
                console.log(`[SOUND] ✓✓✓ Audio started playing for path: ${path}`);
              });
              
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                await playPromise
                  .then(() => {
                    timerLogger.info(`[SOUND] ✓✓✓ Alarm sound playing for icon: ${config.id} from path: ${path}`);
                    console.log(`[SOUND] ✓✓✓ Alarm sound playing for icon: ${config.id} from path: ${path}`);
                    audioPlayed = true;
                  })
                  .catch((error) => {
                    // Erro é esperado quando tentamos múltiplos caminhos - apenas logar como debug
                    timerLogger.debug(`[SOUND] ✗ Failed to play from ${path} (trying next path...):`, error);
                    console.debug(`[SOUND] ✗ Failed to play from ${path} (trying next path...):`, error);
                  });
                if (audioPlayed) break;
              }
            } catch (err) {
              // Erro é esperado quando tentamos múltiplos caminhos - apenas logar como debug
              timerLogger.debug(`[SOUND] ✗ Failed to create audio from ${path} (trying next path...):`, err);
              console.debug(`[SOUND] ✗ Failed to create audio from ${path} (trying next path...):`, err);
            }
          }
          
          if (!audioPlayed) {
            timerLogger.warn('[SOUND] Could not play alarm sound from any path. Trying to use beep as fallback.');
            console.warn('[SOUND] Could not play alarm sound from any path. Trying to use beep as fallback.');
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              oscillator.frequency.value = 800;
              oscillator.type = 'sine';
              
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
              
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.5);
              timerLogger.info('[SOUND] ✓✓✓ Beep fallback played successfully');
              console.log('[SOUND] ✓✓✓ Beep fallback played successfully');
            } catch (beepError) {
              timerLogger.error('[SOUND] ✗✗✗ Failed to play beep fallback:', beepError);
              console.error('[SOUND] ✗✗✗ Failed to play beep fallback:', beepError);
            }
          }
        }
      };
      
      handleNotifications();
      onTimerComplete?.();
    }
    
    if (timer.running) {
      completedRef.current = false;
    }
  }, [timer.remaining, timer.running, timer.startTime, config.notificationType, config.iconName, config.id, onTimerComplete]);

  // Expose start function to parent - usar useCallback para garantir referência estável
  useEffect(() => {
    if (onStartTimerReady) {
      timerLogger.debug(`Exposing start function for icon: ${config.id}`);
      console.log(`[TIMER] Exposing start function for icon: ${config.id}, duration: ${config.timerDuration}s, keybind: ${config.keybind}`);
      // Passar uma função wrapper que sempre chama o timer.start atual
      const startWrapper = () => {
        console.log(`[TIMER] Start wrapper called for icon: ${config.id} (keybind: ${config.keybind})`);
        timer.start();
      };
      onStartTimerReady(startWrapper);
    }
    if (onResetTimerReady) {
      const resetWrapper = () => {
        console.log(`[TIMER] Reset wrapper called for icon: ${config.id}`);
        timer.reset();
      };
      onResetTimerReady(resetWrapper);
    }
  }, [config.id, config.keybind, config.timerDuration, onStartTimerReady, onResetTimerReady, timer.start, timer.reset]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timer.duration > 0 ? (timer.remaining / timer.duration) : 0;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (progress * circumference);

  const IconComponent = config.iconName && (Icons as any)[config.iconName]
    ? (Icons as any)[config.iconName]
    : Icons.Timer;

  if (compactMode) {
    return (
      <div
        onContextMenu={(e) => e.preventDefault()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          padding: '8px',
          cursor: 'default',
          userSelect: 'none',
          border: 'none',
          outline: 'none',
          pointerEvents: 'none',
          backgroundColor: 'transparent'
        }}
      >
        {config.iconName && (Icons as any)[config.iconName] ? (
          React.createElement((Icons as any)[config.iconName], { size: 32, color: timer.running ? timerRunningColor : timerColor })
        ) : (
          <div style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.4))' }}>
            <IconComponent size={32} color={timer.running ? timerRunningColor : timerColor} />
          </div>
        )}
        <span
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: timer.running ? timerRunningColor : timerColor,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.5)'
          }}
        >
          {formatTime(timer.remaining)}
        </span>
      </div>
    );
  }

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: '80px',
        height: '80px',
        position: 'relative',
        cursor: 'default',
        userSelect: 'none',
        border: 'none',
        borderRadius: '8px',
        outline: 'none',
        pointerEvents: 'none',
        boxSizing: 'border-box'
      }}
    >
      <svg 
        width="80" 
        height="80" 
        style={{ 
          transform: 'rotate(-90deg)',
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))'
        }}
      >
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="3"
        />
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke={timer.running ? timerRunningColor : timerColor}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <IconComponent size={24} color={timer.running ? timerRunningColor : timerColor} />
        <span
          style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: timer.running ? timerRunningColor : timerColor
          }}
        >
          {formatTime(timer.remaining)}
        </span>
      </div>
    </div>
  );
}

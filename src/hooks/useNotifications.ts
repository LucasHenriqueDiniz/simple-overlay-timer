import { useCallback } from 'react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { timerLogger } from '../utils/logger';

export interface NotificationOptions {
  title: string;
  body: string;
  playSound?: boolean;
  sendNotification?: boolean;
  soundPath?: string;
}

const DEFAULT_SOUND_PATHS = ['asset://sfx/alarm.mp3', '/sfx/alarm.mp3', 'sfx/alarm.mp3'];

async function ensurePermission() {
  let granted = await isPermissionGranted();
  if (!granted) {
    try {
      const permission = await requestPermission();
      granted = permission === 'granted';
    } catch (error) {
      timerLogger.error('[NOTIFICATIONS] Failed to request permission', error);
    }
  }
  return granted;
}

async function playSoundWithFallback(paths: string[]) {
  for (const path of paths) {
    try {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.currentTime = 0;
      await audio.play();
      timerLogger.info(`[SOUND] Sound playing from ${path}`);
      return true;
    } catch (error) {
      timerLogger.debug(`[SOUND] Failed to play ${path}:`, error);
    }
  }

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
    timerLogger.info('[SOUND] Beep fallback played');
    return true;
  } catch (error) {
    timerLogger.error('[SOUND] Failed during beep fallback', error);
    return false;
  }
}

export function useNotifications() {
  const sendNotificationWithSound = useCallback(async (options: NotificationOptions) => {
    const { title, body, playSound = false, sendNotification: shouldSendNotification = true, soundPath } = options;

    try {
      if (shouldSendNotification) {
        const permissionGranted = await ensurePermission();
        if (permissionGranted) {
          await sendNotification({ title, body });
          timerLogger.info(`[NOTIFICATIONS] Native notification sent: ${title}`);
        } else {
          timerLogger.warn('[NOTIFICATIONS] Permission not granted. Skipping native notification.');
        }
      }

      if (playSound) {
        const audioPaths = soundPath
          ? [soundPath, `asset://sfx/${soundPath}`, `/sfx/${soundPath}`, `sfx/${soundPath}`]
          : DEFAULT_SOUND_PATHS;
        await playSoundWithFallback(audioPaths);
      }
    } catch (error) {
      timerLogger.error('[NOTIFICATIONS] Failed to deliver notification/sound', error);
    }
  }, []);

  return {
    sendNotification: sendNotificationWithSound
  };
}


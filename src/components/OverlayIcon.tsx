import React, { useEffect, useMemo, useRef } from 'react';
import * as Icons from 'lucide-react';
import { IconConfig } from '../types/config';
import { useTimer } from '../hooks/useTimer';
import { useNotifications } from '../hooks/useNotifications';
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
  const { sendNotification: sendNotificationWithSound } = useNotifications();

  const timerCallbacks = useMemo(
    () => ({
      onTimerComplete: ({ repeatCount }: { repeatCount: number }) => {
        if (config.notificationType === 'none') {
          onTimerComplete?.();
          return;
        }

        const playSound = config.notificationType === 'sound' || config.notificationType === 'both';
        const sendNative = config.notificationType === 'notification' || config.notificationType === 'both';
        const body =
          config.completionNotificationText ||
          (config.name ? `Timer "${config.name}" completed!` : `Timer icon ${config.iconName || 'Custom'} completed!`);

        sendNotificationWithSound({
          title: 'Timer Completed',
          body,
          playSound,
          sendNotification: sendNative,
          soundPath: config.soundPath
        });

        timerLogger.info(`[TIMER] Completion notified for icon ${config.id} (repeat ${repeatCount})`);
        onTimerComplete?.();
      }
    }),
    [
      config.completionNotificationText,
      config.id,
      config.iconName,
      config.name,
      config.notificationType,
      config.soundPath,
      onTimerComplete,
      sendNotificationWithSound
    ]
  );

  const timer = useTimer(config.timerDuration, config.repeat, config.timerType || 'countdown', timerCallbacks);
  const prevIntervalStateRef = useRef<boolean>(timer.isInInterval || false);
  const intervalNotifiedRepeatsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const intervalNotificationEnabled = config.repeat?.intervalNotification !== false;
    if (!intervalNotificationEnabled || config.notificationType === 'none') {
      intervalNotifiedRepeatsRef.current.clear();
      prevIntervalStateRef.current = timer.isInInterval || false;
      return;
    }

    const repeatCount = timer.repeatCount || 0;
    const nowInInterval = Boolean(timer.isInInterval);
    const justEnteredInterval = !prevIntervalStateRef.current && nowInInterval;
    const justExitedInterval = prevIntervalStateRef.current && !nowInInterval && timer.running;

    if (justEnteredInterval) {
      intervalNotifiedRepeatsRef.current.delete(repeatCount);
    }

    if (justExitedInterval && !intervalNotifiedRepeatsRef.current.has(repeatCount)) {
      intervalNotifiedRepeatsRef.current.add(repeatCount);

      const playSound = config.notificationType === 'sound' || config.notificationType === 'both';
      const sendNative = config.notificationType === 'notification' || config.notificationType === 'both';
      const body =
        config.repeat?.intervalNotificationText ||
        (config.name
          ? `Timer "${config.name}" interval period completed`
          : `Timer icon ${config.iconName || 'Custom'} interval period completed`);

      sendNotificationWithSound({
        title: 'Timer Interval Completed',
        body,
        playSound,
        sendNotification: sendNative,
        soundPath: config.soundPath
      });

      timerLogger.info(`[TIMER] Interval notified for icon ${config.id} (repeat ${repeatCount})`);
    }

    prevIntervalStateRef.current = nowInInterval;
  }, [
    config.iconName,
    config.id,
    config.name,
    config.notificationType,
    config.repeat?.intervalNotification,
    config.repeat?.intervalNotificationText,
    config.soundPath,
    sendNotificationWithSound,
    timer.isInInterval,
    timer.repeatCount,
    timer.running
  ]);

  // Expose start function to parent - usar useCallback para garantir referência estável
  useEffect(() => {
    if (onStartTimerReady) {
      timerLogger.debug(`Exposing start function for icon: ${config.id}`);
      const startWrapper = () => {
        timer.start();
      };
      onStartTimerReady(startWrapper);
    }
    if (onResetTimerReady) {
      const resetWrapper = () => {
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

  const getDisplayColor = () => {
    if (timer.isInInterval && config.repeat?.intervalColor) {
      return config.repeat.intervalColor;
    }
    return timer.running ? timerRunningColor : timerColor;
  };

  const displayColor = getDisplayColor();

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
          React.createElement((Icons as any)[config.iconName], { size: 32, color: displayColor })
        ) : (
          <div style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.4))' }}>
            <IconComponent size={32} color={displayColor} />
          </div>
        )}
        <span
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: displayColor,
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
          stroke={displayColor}
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
        <IconComponent size={24} color={displayColor} />
        <span
          style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: displayColor
          }}
        >
          {formatTime(timer.remaining)}
        </span>
      </div>
    </div>
  );
}

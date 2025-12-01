export interface IconConfig {
  id: string;
  name?: string;
  iconName: string;
  keybind?: string;
  timerDuration: number;
  notificationType: 'none' | 'sound' | 'notification' | 'both';
  soundPath?: string;
  timerType?: 'countdown' | 'stopwatch';
  repeat?: {
    enabled: boolean;
    times?: number;
    interval?: number;
    intervalColor?: string;
    intervalNotification?: boolean;
    intervalNotificationText?: string;
  };
  completionNotificationText?: string;
}

export interface TimerPreset {
  id: string;
  name: string;
  duration: number;
  iconName: string;
  keybind: string;
  notificationType: 'none' | 'sound' | 'notification' | 'both';
}

export interface StopwatchConfig {
  id: string;
  name?: string;
  iconName: string;
  keybind: string;
  notificationType: 'none' | 'sound' | 'notification' | 'both';
}

export interface AppConfig {
  icons: IconConfig[];
  overlayPosition: { x: number; y: number };
  overlayCorner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' | 'left-center' | 'right-center' | 'center';
  overlayOrientation?: 'horizontal' | 'vertical';
  compactMode?: boolean;
  overlayMonitor?: number;
  overlayStrokeColor?: string;
  overlayStrokeWidth?: number;
  overlayStrokeEnabled?: boolean;
  timerColor?: string;
  timerRunningColor?: string;
  resetAllTimersKeybind?: string;
  timerPresets?: TimerPreset[];
  quickCreateTimerKeybind?: string;
  stopwatches?: StopwatchConfig[];
  showWelcomeModal?: boolean;
}

export const DEFAULT_RESET_ALL_TIMERS_KEYBIND = 'Ctrl+Alt+P';

export const DEFAULT_POMODORO_PRESETS: TimerPreset[] = [
  {
    id: 'preset-pomodoro-focus',
    name: 'Pomodoro Focus (25 min)',
    iconName: 'Alarm',
    keybind: 'Ctrl+Alt+1',
    duration: 25 * 60,
    notificationType: 'both'
  },
  {
    id: 'preset-pomodoro-break',
    name: 'Pomodoro Break (5 min)',
    iconName: 'Clock',
    keybind: 'Ctrl+Alt+2',
    duration: 5 * 60,
    notificationType: 'both'
  }
];

export function getDefaultConfig(): AppConfig {
  return {
    icons: [
      {
        id: 'icon-default',
        name: 'Quick Timer',
        iconName: 'Timer',
        keybind: 'Alt+F1',
        timerDuration: 90,
        notificationType: 'sound'
      }
    ],
    overlayPosition: { x: 100, y: 100 },
    overlayCorner: 'top-right',
    overlayMonitor: 0,
    overlayStrokeColor: '#FFFFFF',
    overlayStrokeWidth: 2,
    overlayStrokeEnabled: true,
    timerColor: '#2196F3',
    timerRunningColor: '#4CAF50',
    resetAllTimersKeybind: DEFAULT_RESET_ALL_TIMERS_KEYBIND,
    timerPresets: DEFAULT_POMODORO_PRESETS,
    showWelcomeModal: true
  };
}




export interface IconConfig {
  id: string;
  name?: string;
  iconName: string;
  keybind: string;
  timerDuration: number;
  notificationType: 'none' | 'sound' | 'notification' | 'both';
  soundPath?: string;
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
}

export function getDefaultConfig(): AppConfig {
  return {
    icons: [
      {
        id: 'icon-1',
        name: 'Timer 1',
        iconName: 'Timer',
        keybind: 'Alt+F1',
        timerDuration: 90,
        notificationType: 'notification'
      }
    ],
    overlayPosition: { x: 100, y: 100 },
    overlayCorner: 'top-right',
    overlayMonitor: 0,
    overlayStrokeColor: '#FFFFFF',
    overlayStrokeWidth: 2,
    overlayStrokeEnabled: true,
    timerColor: '#2196F3',
    timerRunningColor: '#4CAF50'
  };
}




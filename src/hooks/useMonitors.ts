import { useState, useEffect } from 'react';
import { availableMonitors, primaryMonitor } from '@tauri-apps/api/window';

export interface MonitorInfo {
  index: number;
  name: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  scaleFactor: number;
  isPrimary: boolean;
}

export function useMonitors() {
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMonitors = async () => {
      try {
        const allMonitorsList = await availableMonitors();
        const primaryMonitorObj = await primaryMonitor();
        
        const monitorInfos: MonitorInfo[] = allMonitorsList.map((monitor, index) => {
          // No Tauri v2, size, position e scaleFactor são propriedades, não métodos
          const size = monitor.size;
          const position = monitor.position;
          const scaleFactor = monitor.scaleFactor;
          const isPrimary = primaryMonitorObj?.name === monitor.name;
          
          // Limpar nome do monitor removendo \\.\ do início
          let cleanName = monitor.name || `Monitor ${index + 1}`;
          if (cleanName.startsWith('\\\\.\\')) {
            cleanName = cleanName.substring(4);
          }
          
          return {
            index,
            name: cleanName,
            size: { width: size.width, height: size.height },
            position: { x: position.x, y: position.y },
            scaleFactor,
            isPrimary
          };
        });
        
        setMonitors(monitorInfos);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load monitors:', error);
        setLoading(false);
      }
    };
    
    loadMonitors();
  }, []);

  return { monitors, loading };
}


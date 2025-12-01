import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { Minus, Square, X, Bug } from 'lucide-react';
import { useState, useEffect, type CSSProperties } from 'react';

type DragRegionStyle = CSSProperties & {
  WebkitAppRegion?: 'drag' | 'no-drag';
};

const headerStyle: DragRegionStyle = {
  height: '40px',
  background: '#f8f9fa',
  borderBottom: '1px solid #e9ecef',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 12px',
  userSelect: 'none',
  WebkitAppRegion: 'drag'
};

const controlsStyle: DragRegionStyle = {
  WebkitAppRegion: 'no-drag'
};

export function SettingsHeader() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      try {
        const window = getCurrentWindow();
        const maximized = await window.isMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error('Failed to check window state:', error);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = async () => {
    try {
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      const window = getCurrentWindow();
      if (isMaximized) {
        await window.unmaximize();
      } else {
        await window.maximize();
      }
      setIsMaximized(!isMaximized);
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  };

  const handleClose = async () => {
    try {
      const window = getCurrentWindow();
      await window.hide();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  const handleOpenOverlayDevTools = async () => {
    try {
      await invoke('open_overlay_devtools');
      console.log('Overlay DevTools opened');
    } catch (error) {
      console.error('Failed to open overlay DevTools:', error);
    }
  };

  return (
    <div
      data-tauri-drag-region
      style={headerStyle}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#212529' }}>
          Overlay Timer
        </div>
      </div>

      <Group gap={0} style={controlsStyle}>
        <Tooltip label="Open Overlay DevTools (F12)" position="bottom">
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={handleOpenOverlayDevTools}
            style={{
              borderRadius: 0,
              color: '#495057',
              '&:hover': { background: '#e3f2fd', color: '#2196F3' }
            }}
          >
            <Bug size={16} />
          </ActionIcon>
        </Tooltip>
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={handleMinimize}
          style={{
            borderRadius: 0,
            color: '#495057',
            '&:hover': { background: '#e9ecef' }
          }}
        >
          <Minus size={16} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={handleMaximize}
          style={{
            borderRadius: 0,
            color: '#495057',
            '&:hover': { background: '#e9ecef' }
          }}
        >
          <Square size={14} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={handleClose}
          style={{
            borderRadius: 0,
            color: '#495057',
            '&:hover': { background: '#dc3545', color: '#fff' }
          }}
        >
          <X size={16} />
        </ActionIcon>
      </Group>
    </div>
  );
}



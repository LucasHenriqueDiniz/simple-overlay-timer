import { Button, Group, Select, Stack, Text, Card, ActionIcon, TextInput } from '@mantine/core';
import { useState, useEffect, useRef } from 'react';
import { AppConfig } from '../types/config';
import { KeybindInput } from './KeybindInput';
import * as Icons from 'lucide-react';
import { OverlayPositionEditor } from './OverlayPositionEditor';

interface SettingsPanelProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  onAddIcon: () => void;
  onIconClick?: (iconId: string) => void;
}

export function SettingsPanel({ config, onConfigChange, onAddIcon, onIconClick }: SettingsPanelProps) {
  const [timerColor, setTimerColor] = useState(config.timerColor || '#2196F3');
  const [timerRunningColor, setTimerRunningColor] = useState(config.timerRunningColor || '#4CAF50');
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTimerColor(config.timerColor || '#2196F3');
    setTimerRunningColor(config.timerRunningColor || '#4CAF50');
  }, [config.timerColor, config.timerRunningColor]);

  const handleColorInput = (color: string, type: 'timer' | 'timerRunning') => {
    if (type === 'timer') {
      setTimerColor(color);
    } else {
      setTimerRunningColor(color);
    }
  };

  const handleColorChange = (color: string, type: 'timer' | 'timerRunning') => {
    if (colorDebounceRef.current) {
      clearTimeout(colorDebounceRef.current);
    }

    colorDebounceRef.current = setTimeout(() => {
      if (type === 'timer') {
        onConfigChange({ ...config, timerColor: color });
      } else {
        onConfigChange({ ...config, timerRunningColor: color });
      }
    }, 500);
  };

  const handleDeleteIcon = (iconId: string) => {
    const newIcons = config.icons.filter(icon => icon.id !== iconId);
    onConfigChange({ ...config, icons: newIcons });
  };

  return (
    <Stack gap="md">
      
      <OverlayPositionEditor
        config={config}
        onPositionChange={(x, y, corner) => {
          onConfigChange({
            ...config,
            overlayPosition: { x, y },
            overlayCorner: corner as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' | 'left-center' | 'right-center' | 'center' | undefined
          });
        }}
        onMonitorChange={(monitorIndex) => {
          onConfigChange({
            ...config,
            overlayMonitor: monitorIndex
          });
        }}
      />
      
      <Select
        label="Overlay Orientation"
        description="How icons will be arranged"
        value={config.overlayOrientation || 'horizontal'}
        onChange={(value) => onConfigChange({
          ...config,
          overlayOrientation: value as 'horizontal' | 'vertical'
        })}
        data={[
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'vertical', label: 'Vertical' }
        ]}
      />
      
      <Select
        label="Display Mode"
        description="How timers will be displayed"
        value={config.compactMode ? 'compact' : 'normal'}
        onChange={(value) => onConfigChange({
          ...config,
          compactMode: value === 'compact'
        })}
        data={[
          { value: 'normal', label: 'Normal (with circle)' },
          { value: 'compact', label: 'Compact (without circle)' }
        ]}
      />
      
      <Card withBorder p="md">
        <Text size="lg" fw={600} mb="md">Overlay Appearance</Text>
        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} mb="xs">Timer Color (Stopped)</Text>
            <Group gap="xs">
              <input
                type="color"
                value={timerColor}
                onInput={(e) => {
                  const color = (e.target as HTMLInputElement).value;
                  handleColorInput(color, 'timer');
                }}
                onChange={(e) => {
                  const color = e.target.value;
                  handleColorChange(color, 'timer');
                }}
                style={{
                  width: '60px',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
              <TextInput
                value={timerColor}
                onChange={(e) => {
                  const color = e.target.value;
                  handleColorInput(color, 'timer');
                  handleColorChange(color, 'timer');
                }}
                placeholder="#2196F3"
                style={{ flex: 1 }}
              />
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              Timer color when stopped (default: blue)
            </Text>
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">Timer Color (Running)</Text>
            <Group gap="xs">
              <input
                type="color"
                value={timerRunningColor}
                onInput={(e) => {
                  const color = (e.target as HTMLInputElement).value;
                  handleColorInput(color, 'timerRunning');
                }}
                onChange={(e) => {
                  const color = e.target.value;
                  handleColorChange(color, 'timerRunning');
                }}
                style={{
                  width: '60px',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
              <TextInput
                value={timerRunningColor}
                onChange={(e) => {
                  const color = e.target.value;
                  handleColorInput(color, 'timerRunning');
                  handleColorChange(color, 'timerRunning');
                }}
                placeholder="#4CAF50"
                style={{ flex: 1 }}
              />
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              Timer color when running (default: green)
            </Text>
          </div>
        </Stack>
      </Card>
      
      <div>
        <Text size="sm" fw={500} mb="xs">Configured Icons</Text>
        <Stack gap="xs">
          {config.icons.map((icon) => {
            const IconComponent = icon.iconName && (Icons as any)[icon.iconName]
              ? (Icons as any)[icon.iconName]
              : Icons.Timer;
            
            return (
              <Card
                key={icon.id}
                padding="sm"
                withBorder
                style={{ cursor: onIconClick ? 'pointer' : 'default' }}
              >
                <Group justify="space-between">
                  <Group 
                    gap="xs" 
                    style={{ flex: 1, cursor: onIconClick ? 'pointer' : 'default' }}
                    onClick={() => onIconClick?.(icon.id)}
                  >
                    <IconComponent size={24} />
                    <div>
                      <Text size="sm" fw={500}>{icon.name || icon.iconName || 'Timer'}</Text>
                      <Text size="xs" c="dimmed">Keybind: {icon.keybind} | Timer: {icon.timerDuration}s</Text>
                    </div>
                  </Group>
                  <Group gap="xs">
                    {onIconClick && (
                      <Button size="xs" variant="light" onClick={(e) => {
                        e.stopPropagation();
                        onIconClick(icon.id);
                      }}>
                        Edit
                      </Button>
                    )}
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteIcon(icon.id);
                      }}
                    >
                      <Icons.Trash2 size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>
            );
          })}
        </Stack>
      </div>
      
      <Button onClick={onAddIcon} fullWidth>
        Add New Icon
      </Button>

      <Card withBorder p="md">
        <Text size="lg" fw={600} mb="md">Global Shortcuts</Text>
        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} mb="xs">Reset All Timers</Text>
            <KeybindInput
              value={config.resetAllTimersKeybind || ''}
              onChange={(value) => {
                if (value) {
                  onConfigChange({ ...config, resetAllTimersKeybind: value });
                } else {
                  onConfigChange({ ...config, resetAllTimersKeybind: undefined });
                }
              }}
              onError={(error) => {
                if (error) {
                  console.warn('[SETTINGS] Keybind error:', error);
                }
              }}
            />
            <Text size="xs" c="dimmed" mt={4}>
              Keyboard shortcut to reset all running timers
            </Text>
          </div>
        </Stack>
      </Card>
    </Stack>
  );
}




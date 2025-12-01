import { Select, Stack, Text, Card, Group, TextInput } from '@mantine/core';
import { useState, useEffect, useRef } from 'react';
import { AppConfig } from '../types/config';

interface AppearanceTabProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

export function AppearanceTab({ config, onConfigChange }: AppearanceTabProps) {
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

  return (
    <Stack gap="md">
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
        <Text size="lg" fw={600} mb="md">Timer Colors</Text>
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
    </Stack>
  );
}



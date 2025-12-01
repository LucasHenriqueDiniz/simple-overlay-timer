import { useState } from 'react';
import { Stack, Text, Card, Button, Group, ActionIcon } from '@mantine/core';
import { AppConfig, TimerPreset } from '../types/config';
import { KeybindInput } from './KeybindInput';
import { TimerPresetModal } from './TimerPresetModal';
import * as Icons from 'lucide-react';

interface KeybindsTabProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

export function KeybindsTab({ config, onConfigChange }: KeybindsTabProps) {
  const [presetModalOpened, setPresetModalOpened] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<TimerPreset | null>(null);

  const allKeybinds = [
    ...(config.icons?.map(i => i.keybind?.trim()) || []),
    ...(config.timerPresets?.map(p => p.keybind?.trim()) || []),
    config.resetAllTimersKeybind?.trim(),
    config.quickCreateTimerKeybind?.trim()
  ].filter((key): key is string => Boolean(key));

  const handleSavePreset = (preset: TimerPreset) => {
    const presets = config.timerPresets || [];
    const existingIndex = presets.findIndex(p => p.id === preset.id);
    
    if (existingIndex >= 0) {
      const newPresets = [...presets];
      newPresets[existingIndex] = preset;
      onConfigChange({ ...config, timerPresets: newPresets });
    } else {
      onConfigChange({ ...config, timerPresets: [...presets, preset] });
    }
    setSelectedPreset(null);
  };

  const handleDeletePreset = (presetId: string) => {
    const presets = (config.timerPresets || []).filter(p => p.id !== presetId);
    onConfigChange({ ...config, timerPresets: presets });
  };

  return (
    <Stack gap="md">
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

          <div>
            <Text size="sm" fw={500} mb="xs">Quick Create Timer</Text>
            <KeybindInput
              value={config.quickCreateTimerKeybind || ''}
              onChange={(value) => {
                if (value) {
                  onConfigChange({ ...config, quickCreateTimerKeybind: value });
                } else {
                  onConfigChange({ ...config, quickCreateTimerKeybind: undefined });
                }
              }}
              onError={(error) => {
                if (error) {
                  console.warn('[SETTINGS] Keybind error:', error);
                }
              }}
            />
            <Text size="xs" c="dimmed" mt={4}>
              Keyboard shortcut to quickly create a timer with direct input
            </Text>
          </div>
        </Stack>
      </Card>

      <Card withBorder p="md">
        <Group justify="space-between" mb="md">
          <div>
            <Text size="lg" fw={600}>Timer Presets</Text>
            <Text size="xs" c="dimmed">
              Create presets to quickly start timers with predefined durations using keyboard shortcuts
            </Text>
          </div>
          <Button size="xs" onClick={() => {
            setSelectedPreset(null);
            setPresetModalOpened(true);
          }}>
            Add Preset
          </Button>
        </Group>
        <Stack gap="xs">
          {config.timerPresets && config.timerPresets.length > 0 ? (
            config.timerPresets.map((preset) => {
              const IconComponent = preset.iconName && (Icons as any)[preset.iconName]
                ? (Icons as any)[preset.iconName]
                : Icons.Timer;
              
              return (
                <Card key={preset.id} padding="sm" withBorder>
                  <Group justify="space-between">
                    <Group gap="xs" style={{ flex: 1 }}>
                      <IconComponent size={20} />
                      <div>
                        <Text size="sm" fw={500}>{preset.name}</Text>
                        <Text size="xs" c="dimmed">
                          {preset.keybind} | {preset.duration}s
                        </Text>
                      </div>
                    </Group>
                    <Group gap="xs">
                      <Button size="xs" variant="light" onClick={() => {
                        setSelectedPreset(preset);
                        setPresetModalOpened(true);
                      }}>
                        Edit
                      </Button>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => handleDeletePreset(preset.id)}
                      >
                        <Icons.Trash2 size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              );
            })
          ) : (
            <Text size="sm" c="dimmed" ta="center" py="md">
              No presets configured. Create presets to quickly start timers with predefined durations.
            </Text>
          )}
        </Stack>
      </Card>

      <TimerPresetModal
        opened={presetModalOpened}
        onClose={() => {
          setPresetModalOpened(false);
          setSelectedPreset(null);
        }}
        preset={selectedPreset}
        onSave={handleSavePreset}
        existingKeybinds={allKeybinds.filter(k => !selectedPreset || selectedPreset.keybind !== k)}
      />
    </Stack>
  );
}


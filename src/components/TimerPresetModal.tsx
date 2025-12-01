import { useState, useEffect } from 'react';
import { Modal, Button, Group, Text, Stack, TextInput, Select } from '@mantine/core';
import { TimerPreset } from '../types/config';
import { KeybindInput } from './KeybindInput';
import { DurationInput } from './DurationInput';
import * as Icons from 'lucide-react';

interface TimerPresetModalProps {
  opened: boolean;
  onClose: () => void;
  preset: TimerPreset | null;
  onSave: (preset: TimerPreset) => void;
  existingKeybinds: string[];
}

const LUCIDE_ICONS = [
  'Timer', 'Alarm', 'Clock', 'Bell', 'BellRing', 'Zap', 'Flame', 'Star',
  'Heart', 'Target', 'Flag', 'Check', 'X', 'Play', 'Pause', 'Stop',
  'Hourglass', 'Watch', 'Calendar', 'CalendarClock', 'TimerReset', 'TimerOff',
  'Bolt', 'Sword', 'Shield', 'Crosshair', 'Aim', 'Focus', 'Sparkles', 'Gem',
  'Crown', 'Trophy', 'Medal', 'Award', 'Badge', 'Circle', 'Square', 'Triangle',
  'Diamond', 'Hexagon', 'Octagon', 'Pentagon', 'Radio', 'RadioButton', 'Dot'
];

export function TimerPresetModal({ opened, onClose, preset, onSave, existingKeybinds }: TimerPresetModalProps) {
  const [name, setName] = useState<string>('');
  const [iconName, setIconName] = useState<string>('');
  const [keybind, setKeybind] = useState<string>('');
  const [duration, setDuration] = useState<number>(90);
  const [notificationType, setNotificationType] = useState<'none' | 'sound' | 'notification' | 'both'>('notification');
  const [keybindError, setKeybindError] = useState<string>('');

  useEffect(() => {
    if (preset) {
      setName(preset.name || '');
      setIconName(preset.iconName || '');
      setKeybind(preset.keybind);
      setDuration(preset.duration);
      setNotificationType(preset.notificationType);
      setKeybindError('');
    } else {
      setName('');
      setIconName('Timer');
      setKeybind('');
      setDuration(90);
      setNotificationType('notification');
      setKeybindError('');
    }
  }, [preset, opened]);

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }
    if (!keybind.trim()) {
      setKeybindError('Keybind is required');
      return;
    }
    if (existingKeybinds.includes(keybind) && (!preset || preset.keybind !== keybind)) {
      setKeybindError('This keybind is already in use');
      return;
    }

    const newPreset: TimerPreset = {
      id: preset?.id || `preset-${Date.now()}`,
      name: name.trim(),
      iconName: iconName || 'Timer',
      keybind: keybind.trim(),
      duration,
      notificationType
    };

    onSave(newPreset);
    onClose();
  };

  const SelectedIcon = iconName && (Icons as any)[iconName] ? (Icons as any)[iconName] : Icons.Timer;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={preset ? 'Edit Timer Preset' : 'Create Timer Preset'}
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Preset Name"
          placeholder="e.g., Pomodoro 25min"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div>
          <Text size="sm" fw={500} mb="xs">Icon</Text>
          <Select
            value={iconName}
            onChange={(value) => setIconName(value || 'Timer')}
            data={LUCIDE_ICONS.map(icon => ({ value: icon, label: icon }))}
            searchable
            leftSection={<SelectedIcon size={18} />}
          />
        </div>

        <div>
          <Text size="sm" fw={500} mb="xs">Keyboard Shortcut</Text>
          <KeybindInput
            value={keybind}
            onChange={(value) => {
              setKeybind(value);
              setKeybindError('');
            }}
            onError={(error) => {
              setKeybindError(error || '');
            }}
          />
          {keybindError && (
            <Text size="xs" c="red" mt={4}>{keybindError}</Text>
          )}
        </div>

        <DurationInput
          label="Duration"
          value={duration}
          onChange={setDuration}
        />

        <Select
          label="Notification Type"
          value={notificationType}
          onChange={(value) => setNotificationType(value as 'none' | 'sound' | 'notification' | 'both')}
          data={[
            { value: 'none', label: 'None' },
            { value: 'sound', label: 'Sound Only' },
            { value: 'notification', label: 'Notification Only' },
            { value: 'both', label: 'Sound + Notification' }
          ]}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || !keybind.trim()}>
            {preset ? 'Update' : 'Create'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}


import React, { useState, useEffect } from 'react';
import { Modal, NumberInput, Radio, Button, Group, Text, Stack, Divider, TextInput } from '@mantine/core';
import { IconConfig } from '../types/config';
import { KeybindInput } from './KeybindInput';
import * as Icons from 'lucide-react';

interface IconConfigModalProps {
  opened: boolean;
  onClose: () => void;
  config: IconConfig | null;
  onSave: (config: IconConfig) => void;
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

export function IconConfigModal({ opened, onClose, config, onSave, existingKeybinds }: IconConfigModalProps) {
  const [name, setName] = useState<string>('');
  const [iconName, setIconName] = useState<string>('');
  const [keybind, setKeybind] = useState<string>('');
  const [timerDuration, setTimerDuration] = useState<number>(90);
  const [notificationType, setNotificationType] = useState<'none' | 'sound' | 'notification' | 'both'>('notification');
  const [keybindError, setKeybindError] = useState<string>('');

  useEffect(() => {
    if (config) {
      setName(config.name || '');
      setIconName(config.iconName || '');
      setKeybind(config.keybind);
      setTimerDuration(config.timerDuration);
      setNotificationType(config.notificationType);
      setKeybindError('');
    } else {
      setName('');
      setIconName('Timer');
      setKeybind('');
      setTimerDuration(90);
      setNotificationType('notification');
      setKeybindError('');
    }
  }, [config, opened]);

  const handleSave = () => {
    if (!keybind) {
      setKeybindError('Keybind is required');
      return;
    }

    const parts = keybind.split('+');
    const hasModifier = parts.length > 1 && ['Alt', 'Ctrl', 'Shift', 'Meta'].some(mod => parts.includes(mod));
    if (!hasModifier) {
      setKeybindError('Keybind must include at least one modifier (Alt, Ctrl, Shift or Meta) to avoid interfering with other applications');
      return;
    }

    if (keybind !== config?.keybind && existingKeybinds.includes(keybind)) {
      setKeybindError('This keybind is already in use');
      return;
    }

    if (!iconName) {
      setKeybindError('Please select an icon');
      return;
    }

    const newConfig: IconConfig = {
      id: config?.id || `icon-${Date.now()}`,
      name: name.trim() || undefined,
      iconName,
      keybind,
      timerDuration,
      notificationType
    };

    onSave(newConfig);
    onClose();
  };

  const selectedIconComponent = iconName && (Icons as any)[iconName]
    ? React.createElement((Icons as any)[iconName], { size: 40 })
    : React.createElement(Icons.Timer, { size: 40 });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={config ? "Edit Timer" : "Create New Timer"}
      size="lg"
      centered
    >
      <Stack gap="md">
        <TextInput
          label="Timer Name"
          description="Name that will appear in the notification (optional)"
          placeholder="e.g. Flash, Teleport, Ultimate..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          {selectedIconComponent}
        </div>

        <div>
          <Text size="sm" fw={500} mb="xs">Choose Icon</Text>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(6, 1fr)', 
            gap: '8px',
            maxHeight: '180px',
            overflowY: 'auto',
            padding: '8px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
          {LUCIDE_ICONS.map((iconNameOption) => {
            const IconComp = (Icons as any)[iconNameOption] || Icons.Timer;
            const isSelected = iconName === iconNameOption;
            return (
              <button
                key={iconNameOption}
                onClick={() => {
                  setIconName(iconNameOption);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '6px',
                  border: isSelected ? '2px solid #2196F3' : '1px solid #dee2e6',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  minHeight: '50px',
                  justifyContent: 'center',
                  boxShadow: isSelected ? '0 2px 4px rgba(33, 150, 243, 0.2)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f1f3f5';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <IconComp size={20} color={isSelected ? '#2196F3' : '#495057'} />
                <Text size="xs" mt={2} style={{ textAlign: 'center', fontSize: '9px', color: '#6c757d' }}>{iconNameOption}</Text>
              </button>
            );
          })}
          </div>
        </div>

        <Divider />

        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} mb="xs">Keyboard Shortcut</Text>
            <KeybindInput
              value={keybind}
              onChange={(value) => {
                setKeybind(value);
                setKeybindError('');
              }}
              onError={setKeybindError}
            />
            {keybindError && (
              <Text size="xs" c="red" mt="xs">{keybindError}</Text>
            )}
            <Text size="xs" c="dimmed" mt={4}>
              Press keys with modifier (Alt, Ctrl, Shift or Meta)
            </Text>
          </div>

          <NumberInput
            label="Timer Duration (seconds)"
            description="Time in seconds that the timer will count"
            value={timerDuration}
            onChange={(value) => setTimerDuration(typeof value === 'number' ? value : 90)}
            min={1}
            max={3600}
            suffix=" sec"
          />

          <div>
            <Text size="sm" fw={500} mb="xs">Notification on Completion</Text>
            <Radio.Group
              value={notificationType}
              onChange={(value) => setNotificationType(value as any)}
            >
              <Stack gap="xs" mt="xs">
                <Radio value="none" label="None" />
                <Radio value="sound" label="Sound" />
                <Radio value="notification" label="System Notification" />
                <Radio value="both" label="Sound + Notification" />
              </Stack>
            </Radio.Group>
          </div>
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} size="md">Save Timer</Button>
        </Group>
      </Stack>
    </Modal>
  );
}


import React, { useState, useEffect } from 'react';
import { Modal, Radio, Button, Group, Text, Stack, Divider, TextInput, Switch, NumberInput, SegmentedControl } from '@mantine/core';
import { IconConfig } from '../types/config';
import { KeybindInput } from './KeybindInput';
import { DurationInput } from './DurationInput';
import * as Icons from 'lucide-react';

interface IconConfigModalProps {
  opened: boolean;
  onClose: () => void;
  config: IconConfig | null;
  onSave: (config: IconConfig) => void;
  existingKeybinds: string[];
}

const LUCIDE_ICONS = [
  // Core timer icons
  'Timer', 'Alarm', 'Clock', 'Watch', 'Hourglass', 'Calendar', 'CalendarClock', 'TimerReset', 'TimerOff',

  // Status / control
  'Play', 'Pause', 'Stop', 'Bell', 'BellRing', 'TriangleAlert', 'LifeBuoy', 'Terminal',

  // Gaming / action
  'Sword', 'Swords', 'Shield', 'Crosshair', 'Aim', 'Focus', 'Gamepad2', 'HandMetal', 'Flame', 'FlameKindling', 'Zap', 'Gem',

  // Productivity / office
  'Check', 'X', 'Target', 'Flag', 'Badge', 'Award', 'Medal', 'Trophy', 'Star', 'Sparkles', 'Puzzle', 'MapPin', 'Package',

  // Food / lifestyle
  'CookingPot', 'Utensils', 'Hamburger', 'Candy', 'Coffee', 'PartyPopper', 'Rocket',

  // Health / science
  'Pill', 'TestTubeDiagonal', 'Hospital', 'Sprout',

  // Animals / fun
  'Cat', 'Dog', 'Ghost', 'Skull',

  // Miscellaneous shapes / symbols
  'Circle', 'Square', 'Triangle', 'Diamond', 'Hexagon', 'Octagon', 'Pentagon', 'Radio', 'RadioButton', 'Dot',

  // Travel / buildings
  'House', 'Hotel', 'LifeBuoy', 'MapPin',

  // Other fun icons
  'Volleyball', 'Wand', 'Axe', 'Pickaxe', 'Cannabis'
];

export function IconConfigModal({ opened, onClose, config, onSave, existingKeybinds }: IconConfigModalProps) {
  const [name, setName] = useState<string>('');
  const [iconName, setIconName] = useState<string>('');
  const [keybind, setKeybind] = useState<string>('');
  const [timerDuration, setTimerDuration] = useState<number>(90);
  const [notificationType, setNotificationType] = useState<'none' | 'sound' | 'notification' | 'both'>('sound');
  const [timerType, setTimerType] = useState<'countdown' | 'stopwatch'>('countdown');
  const [repeatEnabled, setRepeatEnabled] = useState<boolean>(false);
  const [repeatTimes, setRepeatTimes] = useState<number>(1);
  const [repeatInterval, setRepeatInterval] = useState<number>(0);
  const [repeatIntervalColor, setRepeatIntervalColor] = useState<string>('#FF9800');
  const [repeatIntervalNotification, setRepeatIntervalNotification] = useState<boolean>(false);
  const [repeatIntervalNotificationText, setRepeatIntervalNotificationText] = useState<string>('');
  const [completionNotificationText, setCompletionNotificationText] = useState<string>('');
  const [keybindError, setKeybindError] = useState<string>('');

  const isCountdown = timerType === 'countdown';
  const showIntervalNotificationText =
    repeatIntervalNotification &&
    repeatInterval > 0 &&
    (notificationType === 'notification' || notificationType === 'both');

  useEffect(() => {
    if (config) {
      setName(config.name || '');
      setIconName(config.iconName || '');
      setKeybind(config.keybind || '');
      setTimerDuration(config.timerDuration);
      setNotificationType(config.notificationType);
      setTimerType(config.timerType || 'countdown');
      setRepeatEnabled(config.repeat?.enabled || false);
      setRepeatTimes(config.repeat?.times || 1);
      setRepeatInterval(config.repeat?.interval || 0);
      setRepeatIntervalColor(config.repeat?.intervalColor || '#FF9800');
      setRepeatIntervalNotification(config.repeat?.intervalNotification || false);
      setRepeatIntervalNotificationText(config.repeat?.intervalNotificationText || '');
      setCompletionNotificationText(config.completionNotificationText || '');
      setKeybindError('');
    } else {
      setName('');
      setIconName('Timer');
      setKeybind('');
      setTimerDuration(90);
      setNotificationType('notification');
      setTimerType('countdown');
      setRepeatEnabled(false);
      setRepeatTimes(1);
      setRepeatInterval(0);
      setRepeatIntervalColor('#FF9800');
      setRepeatIntervalNotification(false);
      setRepeatIntervalNotificationText('');
      setCompletionNotificationText('');
      setKeybindError('');
    }
  }, [config, opened]);

  const handleSave = () => {
    const trimmedKeybind = keybind.trim();
    if (trimmedKeybind) {
      const parts = trimmedKeybind.split('+');
      const hasModifier = parts.length > 1 && ['Alt', 'Ctrl', 'Shift', 'Meta'].some(mod => parts.includes(mod));

      if (!hasModifier) {
        setKeybindError('Shortcuts must include Alt, Ctrl, Shift or Meta to avoid conflicts');
        return;
      }

      const isSameAsCurrent = trimmedKeybind === (config?.keybind?.trim() ?? '');
      if (!isSameAsCurrent && existingKeybinds.includes(trimmedKeybind)) {
        setKeybindError('This keybind is already in use');
        return;
      }
    }

    setKeybindError('');

    if (!iconName) {
      setKeybindError('Please select an icon');
      return;
    }

    const newConfig: IconConfig = {
      id: config?.id || `icon-${Date.now()}`,
      name: name.trim() || undefined,
      iconName,
      keybind: trimmedKeybind || undefined,
      timerDuration,
      notificationType,
      timerType,
      repeat: repeatEnabled ? {
        enabled: true,
        times: repeatTimes,
        interval: repeatInterval,
        intervalColor: repeatInterval > 0 ? repeatIntervalColor : undefined,
        intervalNotification: repeatInterval > 0 ? repeatIntervalNotification : false,
        intervalNotificationText: repeatInterval > 0 && repeatIntervalNotificationText ? repeatIntervalNotificationText : undefined
      } : undefined,
      completionNotificationText: completionNotificationText || undefined
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
        <div>
          <Text size="sm" fw={500} mb="xs">Timer Type</Text>
          <SegmentedControl
            value={timerType}
            onChange={(value) => {
              setTimerType(value as 'countdown' | 'stopwatch');
              if (value === 'stopwatch') {
                setRepeatEnabled(false);
              }
            }}
            data={[
              { value: 'countdown', label: 'Countdown Timer' },
              { value: 'stopwatch', label: 'Stopwatch' }
            ]}
            fullWidth
          />
          <Text size="xs" c="dimmed" mt={4}>
            {timerType === 'countdown' 
              ? 'Timer counts down from a set duration' 
              : 'Stopwatch counts up from 0 (start/stop controls)'}
          </Text>
        </div>

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
            <Text size="sm" fw={500} mb="xs">Keyboard Shortcut (optional)</Text>
            <KeybindInput
              value={keybind}
              onChange={(value) => {
                setKeybind(value);
                setKeybindError('');
              }}
              onError={setKeybindError}
              existingKeybinds={existingKeybinds}
              currentTimerId={config?.id}
              allTimers={[]}
              optional
            />
            <Group gap="xs" mt="xs">
              <Button
                size="xs"
                variant="subtle"
                onClick={() => {
                  setKeybind('');
                  setKeybindError('');
                }}
                disabled={!keybind}
              >
                Clear shortcut
              </Button>
              {keybindError && (
                <Text size="xs" c="red">{keybindError}</Text>
              )}
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              {timerType === 'stopwatch' 
                ? 'Shortcuts let you tap to start/pause and hold to reset. Leave empty to control it from the UI or tray.'
                : 'Add Alt/Ctrl/Shift + key if you want a global shortcut. Leave empty to start this timer from the Settings or tray.'}
            </Text>
          </div>

          {isCountdown && (
            <DurationInput
              label="Timer Duration"
              value={timerDuration}
              onChange={setTimerDuration}
            />
          )}

          {isCountdown && (
            <div>
              <Switch
                label="Repeat Timer"
                description="Automatically restart timer when it completes"
                checked={repeatEnabled}
                onChange={(e) => setRepeatEnabled(e.currentTarget.checked)}
                mb={repeatEnabled ? 'md' : 0}
              />
              {repeatEnabled && (
                <Stack gap="md" mt="md" pl="md" style={{ borderLeft: '2px solid #e9ecef' }}>
                  <NumberInput
                    label="Repeat Times"
                    description="How many times to repeat (0 = infinite)"
                    value={repeatTimes}
                    onChange={(value) => setRepeatTimes(typeof value === 'number' ? value : 1)}
                    min={0}
                    max={1000}
                  />
                  <DurationInput
                    label="Interval Before Repeat"
                    value={repeatInterval}
                    onChange={setRepeatInterval}
                  />
                  {repeatInterval > 0 && (
                    <>
                      <div>
                        <Text size="sm" fw={500} mb="xs">Interval Color</Text>
                        <Group gap="xs">
                          <input
                            type="color"
                            value={repeatIntervalColor}
                            onChange={(e) => setRepeatIntervalColor(e.target.value)}
                            style={{
                              width: '60px',
                              height: '40px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          />
                          <TextInput
                            value={repeatIntervalColor}
                            onChange={(e) => setRepeatIntervalColor(e.target.value)}
                            placeholder="#FF9800"
                            style={{ flex: 1 }}
                          />
                        </Group>
                        <Text size="xs" c="dimmed" mt={4}>
                          Color displayed during the interval period
                        </Text>
                      </div>
                      <Switch
                        label="Notify During Interval"
                        description="Show notification when interval period ends"
                        checked={repeatIntervalNotification}
                        onChange={(e) => setRepeatIntervalNotification(e.currentTarget.checked)}
                      />
                      {showIntervalNotificationText && (
                        <TextInput
                          label="Interval Notification Text"
                          description="Custom text for interval completion notification (leave empty for default)"
                          placeholder="e.g. Interval completed, timer restarting..."
                          value={repeatIntervalNotificationText}
                          onChange={(e) => setRepeatIntervalNotificationText(e.target.value)}
                          mt="md"
                        />
                      )}
                    </>
                  )}
                </Stack>
              )}
            </div>
          )}

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
            {(notificationType === 'notification' || notificationType === 'both') && (
              <TextInput
                label="Completion Notification Text"
                description="Custom text for completion notification (leave empty for default)"
                placeholder="e.g. Timer completed!"
                value={completionNotificationText}
                onChange={(e) => setCompletionNotificationText(e.target.value)}
                mt="md"
              />
            )}
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


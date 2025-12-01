import { Modal, Stack, Text, List, Button, Group } from '@mantine/core';
import { IconConfig } from '../types/config';

interface WelcomeModalProps {
  opened: boolean;
  onClose: () => void;
  onCreateFirstTimer: () => void;
  existingTimers: IconConfig[];
}

export function WelcomeModal({ opened, onClose, onCreateFirstTimer, existingTimers }: WelcomeModalProps) {
  const hasTimers = existingTimers.length > 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title="Welcome to Overlay Timer"
      centered
      overlayProps={{ opacity: 0.55, blur: 3 }}
    >
      <Stack gap="md">
        <Text>
          Overlay Timer lives as a small always-on-top window so you can keep track of cooldowns, pomodoros, workouts, or any workflow
          without leaving your game or desktop. Here is a quick tour:
        </Text>

        <List spacing="xs" size="sm">
          <List.Item>
            <Text fw={600}>1. Create Timers or Stopwatches</Text>
            Use “Add Timer” or the Presets tab to attach global shortcuts to anything you need to track.
          </List.Item>
          <List.Item>
            <Text fw={600}>2. Global Shortcuts</Text>
            Every timer has its own shortcut. By default, <code>Ctrl+Alt+P</code> resets all running timers (change it in “Keybinds”).
          </List.Item>
          <List.Item>
            <Text fw={600}>3. Repeats & Intervals</Text>
            Countdown timers can automatically restart with optional intervals. Enable notifications to get a sound/toast for each cycle.
          </List.Item>
          <List.Item>
            <Text fw={600}>4. Stopwatch Mode</Text>
            Tap the shortcut to start/pause, hold it to reset — perfect for splits, laps, or repetitive drills.
          </List.Item>
          <List.Item>
            <Text fw={600}>5. Pomodoro Presets</Text>
            We ship two presets (25/5 min) under the Presets tab. Customize them or add your own hotkeys.
          </List.Item>
        </List>

        <Text size="sm" c="dimmed">
          You can reopen Settings any time from the system tray icon or via the “Quick Create Timer” shortcut you define.
        </Text>

        <Group justify="space-between" mt="md">
          <Button variant="light" onClick={onCreateFirstTimer}>
            {hasTimers ? 'Create another timer' : 'Create your first timer'}
          </Button>
          <Button onClick={onClose}>Start using Overlay Timer</Button>
        </Group>
      </Stack>
    </Modal>
  );
}


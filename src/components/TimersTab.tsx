import { Button, Group, Stack, Text, Card, ActionIcon } from '@mantine/core';
import { AppConfig } from '../types/config';
import * as Icons from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface TimersTabProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  onAddIcon: () => void;
  onIconClick?: (iconId: string) => void;
}

function formatDuration(totalSeconds: number) {
  if (!totalSeconds || totalSeconds <= 0) {
    return '0s';
  }

  const units: Array<{ label: string; value: number }> = [
    { label: 'd', value: 86400 },
    { label: 'h', value: 3600 },
    { label: 'm', value: 60 },
    { label: 's', value: 1 },
  ];

  const parts: string[] = [];
  let remaining = Math.floor(totalSeconds);

  for (const unit of units) {
    if (remaining >= unit.value) {
      const count = Math.floor(remaining / unit.value);
      remaining -= count * unit.value;
      parts.push(`${count}${unit.label}`);
    }
  }

  return parts.join(' ');
}

export function TimersTab({ config, onConfigChange, onAddIcon, onIconClick }: TimersTabProps) {
  const handleDeleteIcon = (iconId: string) => {
    const newIcons = config.icons.filter(icon => icon.id !== iconId);
    onConfigChange({ ...config, icons: newIcons });
  };

  const handleStartTimer = async (iconId: string) => {
    try {
      await invoke('start_timer', { timerId: iconId });
    } catch (error) {
      console.error('Failed to start timer', error);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Text size="sm" fw={500} mb="xs">Configured Timers</Text>
        <Stack gap="xs">
          {config.icons.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              No timers configured. Click "Add New Timer" to create one.
            </Text>
          ) : (
            config.icons.map((icon) => {
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
                        <Text size="xs" c="dimmed">
                          Shortcut: {icon.keybind ? icon.keybind : 'None'} | Duration: {formatDuration(icon.timerDuration)}
                        </Text>
                      </div>
                    </Group>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTimer(icon.id);
                        }}
                        title="Start timer"
                      >
                        <Icons.Play size={16} />
                      </ActionIcon>
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
            })
          )}
        </Stack>
      </div>
      
      <Button onClick={onAddIcon} fullWidth>
        Add New Timer
      </Button>
    </Stack>
  );
}



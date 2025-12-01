import { Tabs } from '@mantine/core';
import { AppConfig } from '../types/config';
import { TimersTab } from './TimersTab';
import { PositioningTab } from './PositioningTab';
import { KeybindsTab } from './KeybindsTab';
import { AppearanceTab } from './AppearanceTab';

interface SettingsTabsProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  onAddIcon: () => void;
  onIconClick?: (iconId: string) => void;
}

export function SettingsTabs({ config, onConfigChange, onAddIcon, onIconClick }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="timers">
      <Tabs.List>
        <Tabs.Tab value="timers">Timers</Tabs.Tab>
        <Tabs.Tab value="positioning">Positioning</Tabs.Tab>
        <Tabs.Tab value="keybinds">Keybinds</Tabs.Tab>
        <Tabs.Tab value="appearance">Appearance</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="timers" pt="md">
        <TimersTab
          config={config}
          onConfigChange={onConfigChange}
          onAddIcon={onAddIcon}
          onIconClick={onIconClick}
        />
      </Tabs.Panel>

      <Tabs.Panel value="positioning" pt="md">
        <PositioningTab
          config={config}
          onConfigChange={onConfigChange}
        />
      </Tabs.Panel>

      <Tabs.Panel value="keybinds" pt="md">
        <KeybindsTab
          config={config}
          onConfigChange={onConfigChange}
        />
      </Tabs.Panel>

      <Tabs.Panel value="appearance" pt="md">
        <AppearanceTab
          config={config}
          onConfigChange={onConfigChange}
        />
      </Tabs.Panel>
    </Tabs>
  );
}



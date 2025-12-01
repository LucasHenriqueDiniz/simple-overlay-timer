import { Stack } from '@mantine/core';
import { AppConfig } from '../types/config';
import { OverlayPositionEditor } from './OverlayPositionEditor';

interface PositioningTabProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

export function PositioningTab({ config, onConfigChange }: PositioningTabProps) {
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
    </Stack>
  );
}



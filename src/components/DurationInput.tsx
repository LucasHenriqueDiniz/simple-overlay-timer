import { NumberInput, Group, Select } from '@mantine/core';
import { useState, useEffect } from 'react';

interface DurationInputProps {
  value: number;
  onChange: (seconds: number) => void;
  label?: string;
}

export function DurationInput({ value, onChange, label = 'Duration' }: DurationInputProps) {
  const [unit, setUnit] = useState<'seconds' | 'minutes' | 'hours'>('seconds');
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    if (unit === 'seconds') {
      setDisplayValue(value);
    } else if (unit === 'minutes') {
      setDisplayValue(Math.round(value / 60 * 100) / 100);
    } else if (unit === 'hours') {
      setDisplayValue(Math.round(value / 3600 * 100) / 100);
    }
  }, [value, unit]);

  const handleValueChange = (newValue: number | string) => {
    const numValue = typeof newValue === 'string' ? parseFloat(newValue) || 0 : newValue;
    setDisplayValue(numValue);

    let seconds = 0;
    if (unit === 'seconds') {
      seconds = numValue;
    } else if (unit === 'minutes') {
      seconds = Math.round(numValue * 60);
    } else if (unit === 'hours') {
      seconds = Math.round(numValue * 3600);
    }

    onChange(seconds);
  };

  const handleUnitChange = (newUnit: string | null) => {
    if (!newUnit) return;
    
    const currentSeconds = value;
    let newDisplayValue = 0;

    if (newUnit === 'seconds') {
      newDisplayValue = currentSeconds;
    } else if (newUnit === 'minutes') {
      newDisplayValue = Math.round(currentSeconds / 60 * 100) / 100;
    } else if (newUnit === 'hours') {
      newDisplayValue = Math.round(currentSeconds / 3600 * 100) / 100;
    }

    setUnit(newUnit as 'seconds' | 'minutes' | 'hours');
    setDisplayValue(newDisplayValue);
  };

  return (
    <div>
      <Group gap="xs" align="flex-end">
        <NumberInput
          label={label}
          value={displayValue}
          onChange={handleValueChange}
          min={0}
          max={unit === 'hours' ? 24 : unit === 'minutes' ? 1440 : 86400}
          step={unit === 'hours' ? 0.5 : unit === 'minutes' ? 1 : 1}
          style={{ flex: 1 }}
        />
        <Select
          value={unit}
          onChange={handleUnitChange}
          data={[
            { value: 'seconds', label: 'Seconds' },
            { value: 'minutes', label: 'Minutes' },
            { value: 'hours', label: 'Hours' }
          ]}
          style={{ width: '120px' }}
        />
      </Group>
    </div>
  );
}


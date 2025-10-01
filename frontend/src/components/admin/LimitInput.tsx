import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Infinity } from 'lucide-react';

interface LimitInputProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  description?: string;
  min?: number;
  max?: number;
}

export function LimitInput({
  label,
  value,
  onChange,
  description,
  min = 0,
  max = 999999,
}: LimitInputProps) {
  const [isUnlimited, setIsUnlimited] = useState(value === null);
  const [numValue, setNumValue] = useState(value ?? 0);

  useEffect(() => {
    setIsUnlimited(value === null);
    setNumValue(value ?? 0);
  }, [value]);

  const handleUnlimitedChange = (checked: boolean) => {
    setIsUnlimited(checked);
    if (checked) {
      onChange(null);
    } else {
      onChange(numValue || min);
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      setNumValue(newValue);
      onChange(newValue);
    } else if (e.target.value === '') {
      setNumValue(0);
      onChange(min);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`limit-${label}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </Label>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            id={`limit-${label}`}
            type="number"
            value={isUnlimited ? '' : numValue}
            onChange={handleValueChange}
            disabled={isUnlimited}
            min={min}
            max={max}
            placeholder={isUnlimited ? 'Ilimitado' : `Mínimo: ${min}`}
            className={isUnlimited ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : ''}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id={`unlimited-${label}`}
            checked={isUnlimited}
            onCheckedChange={handleUnlimitedChange}
          />
          <Label
            htmlFor={`unlimited-${label}`}
            className="flex items-center gap-1.5 cursor-pointer text-sm font-normal text-gray-700 dark:text-gray-300 whitespace-nowrap"
          >
            <Infinity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            Ilimitado
          </Label>
        </div>
      </div>

      {description && (
        <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
      )}
    </div>
  );
}
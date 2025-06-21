import React, { useState } from 'react';
import { Button } from './button';
import { Label } from './label';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  presetColors?: string[];
}

const DEFAULT_PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  presetColors = DEFAULT_PRESET_COLORS,
}) => {
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);

  const handlePresetClick = (color: string) => {
    onChange(color);
  };

  const handleCustomColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="space-y-3">
      {label && <Label className="text-xs">{label}</Label>}

      {/* Current Color Display */}
      <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-md bg-white">
        <div
          className="w-6 h-6 rounded-md border border-gray-300 flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm font-mono text-gray-700">{value.toUpperCase()}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsCustomPickerOpen(!isCustomPickerOpen)}
          className="ml-auto h-6 px-2 text-xs"
        >
          {isCustomPickerOpen ? 'Hide' : 'Custom'}
        </Button>
      </div>

      {/* Custom Color Picker */}
      {isCustomPickerOpen && (
        <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
          <Label className="text-xs mb-2 block">Choose Custom Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value}
              onChange={handleCustomColorChange}
              className="w-12 h-8 rounded border border-gray-300 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const color = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(color)) {
                  onChange(color);
                }
              }}
              placeholder="#FF5733"
              className="flex-1 h-8 px-2 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
      )}

      {/* Preset Colors */}
      <div>
        <Label className="text-xs mb-2 block">Preset Colors</Label>
        <div className="grid grid-cols-8 gap-1.5">
          {presetColors.map((color) => (
            <Button
              key={color}
              type="button"
              onClick={() => handlePresetClick(color)}
              className={`w-8 h-8 p-0 rounded-md border-2 transition-all hover:scale-110 ${
                value.toLowerCase() === color.toLowerCase()
                  ? 'border-gray-800 ring-2 ring-gray-400'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

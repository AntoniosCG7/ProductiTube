import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FeatureToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const FeatureToggle = ({ label, checked, onChange }: FeatureToggleProps) => {
  const handleToggle = () => onChange(!checked);

  return (
    <div
      className="flex items-center justify-between bg-gray-200 hover:bg-gray-300 rounded-full py-4 px-5 transition-colors duration-200 cursor-pointer select-none border border-gray-300"
      onClick={handleToggle}
    >
      <Label
        htmlFor={`toggle-${label}`}
        className="text-lg font-medium text-gray-900 cursor-pointer flex-1 pointer-events-none"
      >
        {label}
      </Label>
      <Switch
        id={`toggle-${label}`}
        checked={checked}
        onCheckedChange={onChange}
        className="pointer-events-auto"
      />
    </div>
  );
};

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
      className="group relative flex items-center justify-between bg-gradient-to-r from-white to-gray-50/30 hover:from-gray-50 hover:to-gray-100/50 rounded-md py-3 px-4 transition-all duration-200 cursor-pointer select-none border border-gray-200/60 hover:border-gray-300/80 shadow-sm hover:shadow-md backdrop-blur-sm"
      onClick={handleToggle}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300 ${
          checked
            ? 'bg-gradient-to-b from-red-400 to-red-600 opacity-100'
            : 'bg-gray-200 opacity-0 group-hover:opacity-50'
        }`}
      />

      <Label
        htmlFor={`toggle-${label}`}
        className="text-sm font-medium text-gray-800 cursor-pointer flex-1 pointer-events-none pl-2 leading-relaxed"
      >
        {label}
      </Label>

      <div className="flex-shrink-0 ml-3">
        <Switch
          id={`toggle-${label}`}
          checked={checked}
          onCheckedChange={onChange}
          className="pointer-events-auto scale-90 data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-gray-300"
        />
      </div>

      {checked && (
        <div className="absolute inset-0 bg-red-50/20 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}
    </div>
  );
};

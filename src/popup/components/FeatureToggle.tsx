import { Switch, FormControlLabel } from '@mui/material';

interface FeatureToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const FeatureToggle = ({ label, checked, onChange }: FeatureToggleProps) => (
  <FormControlLabel
    control={
      <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} color="primary" />
    }
    label={label}
  />
);

import { Box, FormControlLabel, Switch } from '@mui/material';
import './styles/FeatureToggle.css';

interface FeatureToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const FeatureToggle = ({ label, checked, onChange }: FeatureToggleProps) => {
  const handleToggle = () => onChange(!checked);

  return (
    <Box className="feature-toggle" onClick={handleToggle}>
      <FormControlLabel
        className="form-control-label"
        control={<Switch checked={checked} />}
        label={label}
        checked={checked}
      />
    </Box>
  );
};

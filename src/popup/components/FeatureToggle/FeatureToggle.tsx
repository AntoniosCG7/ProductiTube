import { Box, FormControlLabel, Switch } from '@mui/material';
import './styles/FeatureToggle.css';

interface FeatureToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const FeatureToggle = ({ label, checked, onChange }: FeatureToggleProps) => (
  <Box className="feature-toggle" onClick={() => onChange(!checked)}>
    <FormControlLabel
      className='form-control-label' control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />}
      label={label}
    />
  </Box>
);

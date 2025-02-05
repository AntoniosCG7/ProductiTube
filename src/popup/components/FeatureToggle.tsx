import { Box, FormControlLabel, Switch } from '@mui/material';

interface FeatureToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const FeatureToggle = ({ label, checked, onChange }: FeatureToggleProps) => (
  <Box
    sx={{
      bgcolor: 'rgb(230, 230, 230)',
      borderRadius: 2,
      p: 1.3,
      transition: 'background-color 0.1s ease',
      '&:hover': {
        bgcolor: 'rgb(203, 205, 210)',
      },
    }}
  >
    <FormControlLabel
      control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />}
      label={label}
    />
  </Box>
);

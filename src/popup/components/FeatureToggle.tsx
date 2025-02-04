import { Switch, FormControlLabel, Typography, Box, Tooltip } from '@mui/material';

interface FeatureToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const FeatureToggle = ({ label, description, checked, onChange }: FeatureToggleProps) => (
  <Box
    sx={{
      bgcolor: 'rgb(243, 244, 246)',
      borderRadius: 2,
      p: 1.5,
      transition: 'background-color 0.3s ease',
      '&:hover': {
        bgcolor: 'rgb(229, 231, 235)',
      },
    }}
  >
    <Tooltip title={description} placement="left">
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            color="primary"
            sx={{
              '& .MuiSwitch-switchBase': {
                transition: 'all 0.3s ease',
              },
              '& .MuiSwitch-thumb': {
                transition: 'transform 0.3s ease',
              },
            }}
          />
        }
        label={
          <Typography variant="body2" sx={{ fontWeight: checked ? 500 : 400 }}>
            {label}
          </Typography>
        }
      />
    </Tooltip>
  </Box>
);

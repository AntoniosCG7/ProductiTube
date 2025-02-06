import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Settings as SettingsIcon, Help as HelpIcon } from '@mui/icons-material';
import { FooterProps } from '@/types/popup';
import './styles/Footer.css';

export const Footer: React.FC<FooterProps> = ({ activeControlsCount }) => (
  <Box className="footer-container">
    <Typography variant="body2" className="footer-text">
      {activeControlsCount} controls active
    </Typography>
    <Box sx={{ display: 'flex', gap: 1 }}>
      {[
        { icon: <SettingsIcon />, label: 'Settings' },
        { icon: <HelpIcon />, label: 'Help' },
      ].map(({ icon, label }) => (
        <Button key={label} startIcon={icon} size="small" color="inherit" className="footer-button">
          {label}
        </Button>
      ))}
    </Box>
  </Box>
);

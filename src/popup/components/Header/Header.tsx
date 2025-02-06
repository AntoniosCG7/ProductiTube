import React from 'react';
import { Box, Typography } from '@mui/material';
import './styles/Header.css';

export const Header: React.FC = () => (
  <Box className="header-container">
    <Typography variant="h5" className="header-title">
      ProductiTube
    </Typography>
    <Typography variant="body2" className="header-subtitle">
      Your YouTube, Your Rules
    </Typography>
  </Box>
);

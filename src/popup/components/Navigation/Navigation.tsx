import React from 'react';
import { Tabs, Tab } from '@mui/material';
import {
  Visibility as VisibilityIcon,
  AccessTime as AccessTimeIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { NavigationProps } from '@/types/popup';

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { value: 'controls', icon: <VisibilityIcon />, label: 'Controls' },
    { value: 'limits', icon: <AccessTimeIcon />, label: 'Limits' },
    { value: 'stats', icon: <BarChartIcon />, label: 'Stats' },
  ] as const;

  return (
    <Tabs value={activeTab} onChange={(_, newValue) => onTabChange(newValue)} centered>
      {tabs.map(({ value, icon, label }) => (
        <Tab key={value} value={value} icon={icon} label={label} />
      ))}
    </Tabs>
  );
};

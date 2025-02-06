import React from 'react';
import { Box, Divider, IconButton, Tooltip, Typography } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { ControlsTabProps } from '@/types/popup';
import { Settings } from '@/types';
import { FeatureToggle } from '../FeatureToggle/FeatureToggle';
import { featureCategories } from '../../constants/featureCategories';
import './styles/ControlsTab.css';

const CategorySection: React.FC<{
  category: (typeof featureCategories)[0];
  settings: Settings;
  updateSetting: ControlsTabProps['updateSetting'];
}> = ({ category, settings, updateSetting }) => (
  <Box className="category-container">
    <Box className="category-header">
      <Typography variant="subtitle1" className="category-title">
        {category.title}
      </Typography>
      <Tooltip title={category.description}>
        <IconButton size="small">
          <InfoIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
    <Box className="feature-toggle-container">
      {category.features.map((feature) => (
        <FeatureToggle
          key={feature.key}
          label={feature.label}
          checked={settings[feature.key]}
          onChange={(checked) => updateSetting(feature.key, checked)}
        />
      ))}
    </Box>
  </Box>
);

export const ControlsTab: React.FC<ControlsTabProps> = ({ settings, updateSetting }) => (
  <Box className="controls-tab">
    {featureCategories.map((category, index) => (
      <React.Fragment key={category.title}>
        <CategorySection category={category} settings={settings} updateSetting={updateSetting} />
        {index < featureCategories.length - 1 && <Divider className="divider" />}
      </React.Fragment>
    ))}
  </Box>
);

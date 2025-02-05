import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Typography,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import {
  Visibility as VisibilityIcon,
  AccessTime as AccessTimeIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { FeatureToggle } from './components/FeatureToggle';
import { useSettings } from './hooks/useSettings';
import { featureCategories } from './constants/featureCategories';
import { Settings } from '@/types';
import './styles/popup.css';

// Theme configuration
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#f52f30' },
    background: { default: '#fff', paper: '#fff' },
  },
});

// Type definitions
type TabId = 'controls' | 'limits' | 'stats';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

interface ControlsTabProps {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: boolean) => Promise<void>;
}

interface FooterProps {
  activeControlsCount: number;
}

// Utility functions
const updateContentScript = async (tabId: number, settings: Settings): Promise<void> => {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'SETTINGS_UPDATED',
      settings,
    });

    if (response) {
      console.log('Settings updated successfully:', response);
    } else {
      console.warn('No response from content script');
    }
  } catch (error) {
    console.error('Error updating settings:', error);
  }
};

// Component definitions
const Header: React.FC = () => (
  <Box className="header-container">
    <Typography variant="h5" className="header-title">
      ProductiTube
    </Typography>
    <Typography variant="body2" className="header-subtitle">
      Your YouTube, Your Rules
    </Typography>
  </Box>
);

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { value: 'controls', icon: <VisibilityIcon />, label: 'Controls' },
    { value: 'limits', icon: <AccessTimeIcon />, label: 'Limits' },
    { value: 'stats', icon: <BarChartIcon />, label: 'Stats' },
  ] as const;

  return (
    <Tabs value={activeTab} onChange={(_, newValue: TabId) => onTabChange(newValue)} centered>
      {tabs.map(({ value, icon, label }) => (
        <Tab key={value} value={value} icon={icon} label={label} />
      ))}
    </Tabs>
  );
};

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
        <IconButton size="small" className="info-icon">
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

const ControlsTab: React.FC<ControlsTabProps> = ({ settings, updateSetting }) => (
  <Box className="controls-tab">
    {featureCategories.map((category, index) => (
      <React.Fragment key={category.title}>
        <CategorySection category={category} settings={settings} updateSetting={updateSetting} />
        {index < featureCategories.length - 1 && <Divider className="divider" />}
      </React.Fragment>
    ))}
  </Box>
);

const Footer: React.FC<FooterProps> = ({ activeControlsCount }) => (
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

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabId>('controls');
  const [settings, setSettings] = useSettings();

  const updateSetting = React.useCallback(
    async (key: keyof Settings, value: boolean) => {
      const newSettings = { ...settings, [key]: value };
      await chrome.storage.sync.set(newSettings);
      setSettings(newSettings);

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url?.includes('youtube.com')) {
        await updateContentScript(tab.id, newSettings);
      }
    },
    [settings, setSettings]
  );

  const activeControlsCount = React.useMemo(
    () => Object.values(settings).filter(Boolean).length,
    [settings]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Paper className="popup-container">
        <Header />
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <Box sx={{ px: 3, flex: 1, overflowY: 'auto' }}>
          {activeTab === 'controls' && (
            <ControlsTab settings={settings} updateSetting={updateSetting} />
          )}
        </Box>
        <Footer activeControlsCount={activeControlsCount} />
      </Paper>
    </ThemeProvider>
  );
};

// Root rendering
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}

export default Popup;

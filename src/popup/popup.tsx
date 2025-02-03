import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline, Box, Typography, Paper } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { FeatureToggle } from './components/FeatureToggle';
import './styles/popup.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

interface Settings {
  cleanMode: boolean;
  hideComments: boolean;
  hideRelated: boolean;
  hideShorts: boolean;
}

const Popup = () => {
  const [settings, setSettings] = useState<Settings>({
    cleanMode: false,
    hideComments: false,
    hideRelated: false,
    hideShorts: false,
  });

  useEffect(() => {
    // Load settings when popup opens
    chrome.storage.sync.get().then((stored) => {
      setSettings(stored as Settings);
    });
  }, []);

  const updateSetting = async (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    await chrome.storage.sync.set(newSettings);
    setSettings(newSettings);

    // Notify content script of changes
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'SETTINGS_UPDATED', settings: newSettings });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Paper className="popup-container">
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            ProductiTube
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <FeatureToggle
              label="Clean Mode"
              checked={settings.cleanMode}
              onChange={(checked) => updateSetting('cleanMode', checked)}
            />
            <FeatureToggle
              label="Hide Comments"
              checked={settings.hideComments}
              onChange={(checked) => updateSetting('hideComments', checked)}
            />
            <FeatureToggle
              label="Hide Related Videos"
              checked={settings.hideRelated}
              onChange={(checked) => updateSetting('hideRelated', checked)}
            />
            <FeatureToggle
              label="Hide Shorts"
              checked={settings.hideShorts}
              onChange={(checked) => updateSetting('hideShorts', checked)}
            />
          </Box>
        </Box>
      </Paper>
    </ThemeProvider>
  );
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}

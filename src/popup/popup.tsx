import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline, Box, Paper, Alert } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { useSettings } from './hooks/useSettings';
import { updateContentScript, getActiveYouTubeTab } from './utils/settings';
import { Settings } from '@/types';
import { Header } from './components/Header/Header';
import { Navigation } from './components/Navigation/Navigation';
import { ControlsTab } from './components/ControlsTab/ControlsTab';
import { Footer } from './components/Footer/Footer';
import { TabId } from '@/types/popup';
import './styles/popup.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#f52f30' },
    background: { default: '#fff', paper: '#fff' },
  },
});

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabId>('controls');
  const [settings, updateSettings, error, isRateLimited] = useSettings();

  const updateSetting = React.useCallback(
    async (key: keyof Settings, value: boolean) => {
      try {
        await updateSettings({ [key]: value });

        const tab = await getActiveYouTubeTab();
        if (tab?.id) {
          const newSettings = { ...settings, [key]: value };
          await updateContentScript(tab.id, newSettings);
        }
      } catch (error) {
        console.error('Failed to update setting:', error);
      }
    },
    [settings, updateSettings]
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

        {error && (
          <Alert severity="warning" sx={{ mx: 3, mt: 2 }}>
            {error.message}
          </Alert>
        )}
        {isRateLimited && (
          <Alert severity="info" sx={{ mx: 3, mt: 2 }}>
            Saving changes... Please wait to avoid rate limits.
          </Alert>
        )}

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

ReactDOM.createRoot(document.getElementById('root')!).render(<Popup />);

export default Popup;

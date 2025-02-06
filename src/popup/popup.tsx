import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline, Box, Paper } from '@mui/material';
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
  const [settings, setSettings] = useSettings();
  const [isLoading, setIsLoading] = React.useState(false);

  const updateSetting = React.useCallback(
    async (key: keyof Settings, value: boolean) => {
      try {
        setIsLoading(true);
        const newSettings = { ...settings, [key]: value };
        await chrome.storage.sync.set(newSettings);
        setSettings(newSettings);

        const tab = await getActiveYouTubeTab();
        if (tab?.id) {
          await updateContentScript(tab.id, newSettings);
        }
      } catch (error) {
        console.error('Failed to update setting:', error);
      } finally {
        setIsLoading(false);
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
            <ControlsTab settings={settings} updateSetting={updateSetting} isLoading={isLoading} />
          )}
        </Box>
        <Footer activeControlsCount={activeControlsCount} />
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

export default Popup;

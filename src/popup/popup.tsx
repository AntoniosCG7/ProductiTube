import React from 'react';
import ReactDOM from 'react-dom/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings } from './hooks/useSettings';
import { useLimitsSettings } from './hooks/useLimitsSettings';
import { updateContentScript, getActiveYouTubeTab } from './utils/settings';
import { Settings } from '@/types';
import { Header } from './components/Header/Header';
import { Navigation } from './components/Navigation/Navigation';
import { ControlsTab } from './components/ControlsTab/ControlsTab';
import { LimitsTab } from './components/LimitsTab/LimitsTab';
import { StatsTab } from './components/StatsTab/StatsTab';
import { Footer } from './components/Footer/Footer';
import { TabId } from '@/types/popup';
import { AlertTriangle, Info } from 'lucide-react';
import './styles/popup.css';

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabId>('controls');
  const [settings, updateSettings, error, isRateLimited] = useSettings();
  const { limitsSettings, updateLimitsSettings, error: limitsError } = useLimitsSettings();

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

  const combinedError = error || limitsError;

  return (
    <div className="w-96 h-[600px] overflow-hidden overflow-x-hidden flex flex-col">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {combinedError && (
        <Alert variant="destructive" className="mx-3 mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{combinedError.message}</AlertDescription>
        </Alert>
      )}
      {isRateLimited && (
        <Alert className="mx-3 mt-2">
          <Info className="h-4 w-4" />
          <AlertDescription>Saving changes... Please wait to avoid rate limits.</AlertDescription>
        </Alert>
      )}

      <div className="px-4 flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
        {activeTab === 'controls' && (
          <ControlsTab settings={settings} updateSetting={updateSetting} />
        )}
        {activeTab === 'limits' && (
          <LimitsTab limitsSettings={limitsSettings} updateLimitsSettings={updateLimitsSettings} />
        )}
        {activeTab === 'stats' && <StatsTab limitsSettings={limitsSettings} />}
      </div>
      <Footer activeControlsCount={activeControlsCount} />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<Popup />);

export default Popup;

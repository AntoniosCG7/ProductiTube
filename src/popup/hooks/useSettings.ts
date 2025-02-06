import { useState, useEffect, useCallback } from 'react';
import { Settings } from '@/types';

const defaultSettings: Settings = {
  hideHomeFeed: false,
  hideVideoSidebar: false,
  hideRecommended: false,
  hideLiveChat: false,
  hidePlaylist: false,
  hideFundraiser: false,
  hideEndScreenFeed: false,
  hideEndScreenCards: false,
  hideShorts: false,
  hideComments: false,
  hideMixes: false,
  hideMerchOffers: false,
  hideVideoInfo: false,
  hideButtonsBar: false,
  hideChannel: false,
  hideDescription: false,
  hideTopHeader: false,
  hideNotifications: false,
  hideSearchResults: false,
  hideExplore: false,
  hideSubscriptions: false,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      const storedSettings = (await chrome.storage.sync.get()) as Partial<Settings>;
      setSettings((prev) => ({ ...prev, ...storedSettings }));
    };
    fetchSettings();
  }, []);

  const updateSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      const updatedSettings = { ...settings, ...newSettings };
      await chrome.storage.sync.set(updatedSettings);
      setSettings(updatedSettings);
    },
    [settings]
  );

  return [settings, updateSettings] as const;
};

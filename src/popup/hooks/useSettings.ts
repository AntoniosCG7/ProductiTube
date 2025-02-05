import { useState, useEffect } from 'react';
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
    chrome.storage.sync.get().then((stored) => {
      setSettings(stored as Settings);
    });
  }, []);

  return [settings, setSettings] as const;
};

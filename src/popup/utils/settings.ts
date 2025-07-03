import { Settings } from '@/types';

export const updateContentScript = async (tabId: number, settings: Settings): Promise<void> => {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'SETTINGS_UPDATED',
      settings,
    });

    if (!response) {
      return;
    }

  } catch (error) {
    console.error('Error updating settings:', error);
    throw new Error('Failed to update content script settings');
  }
};

export const getActiveYouTubeTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.includes('youtube.com')) {
    return null;
  }
  return tab;
};

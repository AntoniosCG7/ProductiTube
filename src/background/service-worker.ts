const SETTINGS_STORAGE_KEY = 'youtube_settings';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    [SETTINGS_STORAGE_KEY]: {
      hideHomeFeed: false,
      hideShorts: false,
      hideSubscriptions: false,
      hideExplore: false,
      hideMoreFromYoutube: false,
      disableAutoplay: false,
      hideEndScreenCards: false,
      hideEndScreenFeed: false,
      hideChannel: false,
      hideVideoInfo: false,
      hideDescription: false,
      hideButtonsBar: false,
      hideComments: false,
      hideTopHeader: false,
      hideNotifications: false,
      hideRecommended: false,
      hideLiveChat: false,
      hidePlaylist: false,
    },
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((_message, _sender, sendResponse) => {
  // Handle messages here
  sendResponse({ received: true });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('youtube.com')) {
    const storedData = await chrome.storage.sync.get(SETTINGS_STORAGE_KEY);
    const settings = storedData[SETTINGS_STORAGE_KEY] || {};

    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'SETTINGS_UPDATED',
        settings,
      });
    } catch {
      // Content script might not be ready yet, that's okay
    }
  }
});

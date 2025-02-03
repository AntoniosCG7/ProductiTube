chrome.runtime.onInstalled.addListener(() => {
  // Initialize default settings
  chrome.storage.sync.set({
    cleanMode: false,
    hideComments: false,
    hideRelated: false,
    hideShorts: false,
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
    const settings = await chrome.storage.sync.get();
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

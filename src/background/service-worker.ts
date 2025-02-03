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

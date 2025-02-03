import { initializeFeatures } from './features';

const initializeWithSettings = async () => {
  try {
    await initializeFeatures();
  } catch (error) {
    console.error('Error initializing features:', error);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWithSettings);
} else {
  initializeWithSettings();
}

// Listen for settings changes
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SETTINGS_UPDATED') {
    initializeWithSettings();
    sendResponse({ success: true });
  }
  return true;
});

// Watch for YouTube SPA navigation
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    initializeWithSettings();
  }
}).observe(document, { subtree: true, childList: true });

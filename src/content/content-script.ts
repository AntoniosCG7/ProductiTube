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
window.addEventListener('yt-navigate-finish', () => {
  initializeWithSettings();
});

// Fallback for URL changes
let lastUrl = location.href;
window.addEventListener('popstate', () => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    initializeWithSettings();
  }
});

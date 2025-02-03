import { initializeFeatures } from './features';

// Function to initialize with current settings
const initializeWithSettings = async () => {
  try {
    const settings = await chrome.storage.sync.get();
    console.log('Initializing with settings:', settings);
    await initializeFeatures();
  } catch (error) {
    console.error('Error initializing features:', error);
  }
};

// Initialize when the content script loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Content script loaded');
  initializeWithSettings();
});

// Listen for settings changes
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SETTINGS_UPDATED') {
    console.log('Settings updated:', message.settings);
    initializeWithSettings();
  }
});

// Listen for YouTube SPA navigation
const observer = new MutationObserver(() => {
  if (document.location.pathname !== lastPathname) {
    lastPathname = document.location.pathname;
    console.log('URL changed, reinitializing features');
    initializeWithSettings();
  }
});

let lastPathname = document.location.pathname;
observer.observe(document.querySelector('body')!, { childList: true, subtree: true });

// Also initialize on window load to catch any late-loading elements
window.addEventListener('load', () => {
  console.log('Window loaded, initializing features');
  initializeWithSettings();
}); 
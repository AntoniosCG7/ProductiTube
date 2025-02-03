import { initializeFeatures } from './features';

// Initialize when the content script loads
document.addEventListener('DOMContentLoaded', () => {
  initializeFeatures();
});

// Listen for YouTube SPA navigation
const observer = new MutationObserver(() => {
  if (document.location.pathname !== lastPathname) {
    lastPathname = document.location.pathname;
    initializeFeatures();
  }
});

let lastPathname = document.location.pathname;
observer.observe(document.querySelector('body')!, { childList: true, subtree: true }); 
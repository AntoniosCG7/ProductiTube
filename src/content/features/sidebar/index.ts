import { createFeatureHandler } from '../../utils/feature-utils';

export const initializeRecommendedVideos = createFeatureHandler(
  {
    selectors: [
      '#related',
      '#items.ytd-watch-next-secondary-results-renderer',
      'ytd-compact-video-renderer',
      '#secondary',
      '#secondary-inner',
    ],
    debounceMs: 150,
    observerOptions: {
      childList: true,
      subtree: true,
      attributes: true,
    },
  },
  (elements, enabled) => {
    elements.forEach((element) => {
      if (enabled) {
        element.style.cssText = 'display: none !important';
      } else {
        element.style.cssText = '';
      }
    });
  }
);

export const initializeLiveChat = createFeatureHandler(
  {
    selectors: ['ytd-live-chat-frame', '#chat:not([collapsed])', '#chat-container'],
    debounceMs: 100,
    observerOptions: {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['collapsed'],
    },
  },
  (elements, enabled) => {
    elements.forEach((element) => {
      if (enabled) {
        element.style.cssText = 'display: none !important';
      } else {
        element.style.cssText = '';
      }
    });
  }
);

export const initializePlaylist = createFeatureHandler(
  {
    selectors: [
      'ytd-playlist-panel-renderer',
      '#playlist-container',
      '#playlist-action-menu',
      'ytd-playlist-video-renderer',
      '.ytd-playlist-panel-renderer',
    ],
    debounceMs: 150,
    observerOptions: {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'is-playlist'],
    },
  },
  (elements, enabled) => {
    elements.forEach((element) => {
      if (enabled) {
        element.style.cssText = 'display: none !important';
      } else {
        element.style.cssText = '';
      }
    });
  }
);

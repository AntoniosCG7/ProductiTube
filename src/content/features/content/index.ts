import { createFeatureHandler } from '../../utils/feature-utils';

// Helper to check if we're on a video page
const isVideoPage = (): boolean => document.querySelector('ytd-watch-flexy') !== null;

// Helper to check if element is part of main video info
const isMainVideoInfo = (element: Element): boolean => {
  return !!element.closest('ytd-watch-metadata, ytd-watch-flexy > #primary');
};

export const initializeChannel = createFeatureHandler(
  {
    selectors: [
      '#owner',
      '#owner-container',
      'ytd-video-owner-renderer',
      '#upload-info',
      '#top-row ytd-channel-name',
    ],
    debounceMs: 150,
    observerOptions: {
      childList: true,
      subtree: true,
      attributes: true,
    },
  },
  (elements, enabled) => {
    if (!isVideoPage()) return;
    elements.forEach((element) => {
      if (enabled) {
        element.style.cssText = 'display: none !important';
      } else {
        element.style.cssText = '';
      }
    });
  }
);

export const initializeVideoInfo = createFeatureHandler(
  {
    selectors: [
      'ytd-watch-metadata #title',
      'ytd-watch-metadata #info',
      'ytd-watch-metadata #top-row',
      'ytd-watch-metadata #bottom-row',
      'ytd-watch-metadata .ytd-video-primary-info-renderer',
      'ytd-watch-metadata #description',
      'ytd-watch-metadata #description-inline-expander',
      'ytd-watch-metadata .ytd-video-secondary-info-renderer',
    ],
    debounceMs: 150,
    observerOptions: {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'is-expanded'],
    },
  },
  (elements, enabled) => {
    if (!isVideoPage()) return;
    elements.forEach((element) => {
      if (isMainVideoInfo(element) && enabled) {
        element.style.cssText = 'display: none !important';
      } else {
        element.style.cssText = '';
      }
    });
  }
);

export const initializeDescription = createFeatureHandler(
  {
    selectors: ['#description'],
    debounceMs: 150,
    observerOptions: {
      childList: true,
      subtree: true,
      attributes: true,
    },
  },
  (elements, enabled) => {
    if (!isVideoPage()) return;
    elements.forEach((element) => {
      if (enabled) {
        element.style.cssText = 'display: none !important';
      } else {
        element.style.cssText = '';
      }
    });
  }
);

export const initializeButtonsBar = createFeatureHandler(
  {
    selectors: [
      '#top-level-buttons-computed',
      '#subscribe-button',
      '#actions-inner',
      'ytd-watch-metadata #menu-container',
      'ytd-watch-metadata .ytd-menu-renderer',
      '#flexible-item-buttons',
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
      if (element.closest('ytd-watch-metadata') && enabled) {
        element.style.cssText = 'display: none !important;';
      } else {
        element.style.cssText = '';
      }
    });
  }
);

export const initializeComments = createFeatureHandler(
  {
    selectors: [
      '#comments',
      'ytd-comments',
      '#comment-section-renderer',
      '#sections > ytd-comments',
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-comments-section"]',
    ],
    debounceMs: 150,
    observerOptions: {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'visibility'],
    },
  },
  (elements, enabled) => {
    elements.forEach((element) => {
      if (enabled) {
        element.style.cssText = 'display: none !important; visibility: hidden !important;';
      } else {
        element.style.cssText = '';
      }
    });
  }
);

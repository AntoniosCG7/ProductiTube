import { createFeatureHandler } from '../../utils/feature-utils';

export const initializeTopHeader = createFeatureHandler(
  {
    selectors: ['ytd-masthead', '#masthead-container', '#container.ytd-masthead'],
    debounceMs: 100,
    observerOptions: {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['sticky'],
    },
  },
  (elements, enabled) => {
    elements.forEach((element) => {
      if (enabled) {
        element.style.display = 'none';
      } else {
        element.style.display = '';
      }
    });
  }
);

export const initializeNotifications = createFeatureHandler(
  {
    selectors: [
      'ytd-notification-topbar-button-renderer',
      '#notification-count',
      'ytd-notification-renderer',
    ],
    debounceMs: 100,
  },
  (elements, enabled) => {
    elements.forEach((element) => {
      if (enabled) {
        element.style.display = 'none';
      } else {
        element.style.display = '';
      }
    });
  }
);

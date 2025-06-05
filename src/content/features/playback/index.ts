/**
 * Feature handlers for YouTube playback controls
 * @module features/playback
 */

import { createFeatureHandler } from '../../utils/feature-utils';

/**
 * CSS selectors for targeting autoplay-related elements
 */
const AUTOPLAY_SELECTORS = [
  '.ytp-autonav-toggle-button',
  '.ytp-autonav-toggle-button-container',
] as const;

/**
 * Default observer options for autoplay and end screen features
 */
const PLAYBACK_OBSERVER_OPTIONS: MutationObserverInit = {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'aria-checked'],
};

/**
 * CSS for inactive button appearance
 */
const INACTIVE_BUTTON_CSS = `
  opacity: 0.5 !important;
  cursor: not-allowed !important;
  filter: grayscale(100%) !important;
`;

/**
 * Events to prevent on autoplay elements
 */
const PREVENT_EVENTS = ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'] as const;

/**
 * Interval for checking autoplay status (in milliseconds)
 */
const AUTOPLAY_CHECK_INTERVAL = 500;

type PreventListener = {
  type: string;
  listener: EventListener;
};

interface AutoplayElement extends HTMLElement {
  _preventAutoplayListeners?: PreventListener[];
  _preventParentListeners?: PreventListener[];
  _autoplayCheckInterval?: NodeJS.Timeout;
}

/**
 * Adds event prevention listeners to an element
 */
const addPreventListeners = (
  element: AutoplayElement,
  listenerKey: '_preventAutoplayListeners' | '_preventParentListeners'
) => {
  const preventInteraction = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const listeners = PREVENT_EVENTS.map((event) => ({
    type: event,
    listener: preventInteraction,
  }));

  listeners.forEach(({ type, listener }) => {
    element.addEventListener(type, listener, true);
  });

  element[listenerKey] = listeners;
};

/**
 * Removes event prevention listeners from an element
 */
const removePreventListeners = (
  element: AutoplayElement,
  listenerKey: '_preventAutoplayListeners' | '_preventParentListeners'
) => {
  const listeners = element[listenerKey];
  if (listeners) {
    listeners.forEach(({ type, listener }) => {
      element.removeEventListener(type, listener, true);
    });
    delete element[listenerKey];
  }
};

/**
 * Sets up autoplay button monitoring and disabling
 */
const setupAutoplayButton = (button: AutoplayElement, enabled: boolean) => {
  if (enabled) {
    // Disable autoplay if it's enabled
    if (button.getAttribute('aria-checked') === 'true') {
      button.click();
    }

    button.style.cssText = INACTIVE_BUTTON_CSS;
    addPreventListeners(button, '_preventAutoplayListeners');

    // Periodically check and disable autoplay
    const checkInterval = setInterval(() => {
      try {
        if (button.getAttribute('aria-checked') === 'true') {
          button.click();
        }
        if (button.style.cssText !== INACTIVE_BUTTON_CSS) {
          button.style.cssText = INACTIVE_BUTTON_CSS;
        }
      } catch (error) {
        console.debug('Autoplay check error:', error);
      }
    }, AUTOPLAY_CHECK_INTERVAL);

    button._autoplayCheckInterval = checkInterval;
  } else {
    button.style.cssText = '';
    removePreventListeners(button, '_preventAutoplayListeners');

    if (button._autoplayCheckInterval) {
      clearInterval(button._autoplayCheckInterval);
      delete button._autoplayCheckInterval;
    }
  }
};

/**
 * Feature handler for disabling YouTube autoplay functionality
 */
export const initializeAutoplay = createFeatureHandler(
  {
    selectors: AUTOPLAY_SELECTORS,
    debounceMs: 25,
    observerOptions: PLAYBACK_OBSERVER_OPTIONS,
  },
  (elements: Element[], enabled: boolean) => {
    try {
      elements.forEach((element: Element) => {
        const target = element as AutoplayElement;

        if (target.matches('.ytp-autonav-toggle-button')) {
          setupAutoplayButton(target, enabled);
        }

        // Handle container styling and interaction prevention
        if (enabled) {
          target.style.cssText = INACTIVE_BUTTON_CSS;
          addPreventListeners(target, '_preventParentListeners');
        } else {
          target.style.cssText = '';
          removePreventListeners(target, '_preventParentListeners');
        }
      });
    } catch (error) {
      console.error('Error in initializeAutoplay:', error);
    }
  }
);

/**
 * CSS selectors for targeting end screen cards
 */
const END_SCREEN_CARDS_SELECTORS = [
  '.ytp-ce-element.ytp-ce-video.ytp-ce-element-show',
  '.ytp-ce-element.ytp-ce-channel.ytp-ce-element-show',
  '.ytp-ce-element.ytp-ce-playlist.ytp-ce-element-show',
  '.ytp-ce-element.ytp-ce-link.ytp-ce-element-show',
  '.ytp-ce-element.ytp-ce-web.ytp-ce-element-show',
  '.ytp-ce-element:not(.ytp-ce-video)', // fallback
] as const;

/**
 * CSS selectors for targeting end screen feed elements
 */
const END_SCREEN_FEED_SELECTOR = '.ytp-endscreen-content';

/**
 * Feature handler for hiding end screen cards (channel, playlist)
 */
export const initializeEndScreenCards = createFeatureHandler(
  {
    selectors: END_SCREEN_CARDS_SELECTORS,
    debounceMs: 100,
    observerOptions: PLAYBACK_OBSERVER_OPTIONS,
  },
  (elements, enabled) => {
    try {
      elements.forEach((element) => {
        if (enabled) {
          element.style.setProperty('display', 'none', 'important');
        } else {
          element.style.removeProperty('display');
        }
      });
    } catch (error) {
      console.error('Error in initializeEndScreenCards:', error);
    }
  }
);

/**
 * Feature handler for hiding end screen video feed
 */
export const initializeEndScreenFeed = createFeatureHandler(
  {
    selectors: [END_SCREEN_FEED_SELECTOR],
    debounceMs: 100,
    observerOptions: PLAYBACK_OBSERVER_OPTIONS,
  },
  (elements, enabled) => {
    elements.forEach((el) => {
      if (enabled) {
        el.style.setProperty('display', 'none', 'important');
      } else {
        el.style.removeProperty('display');
      }
    });
  }
);

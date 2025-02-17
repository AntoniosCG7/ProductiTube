/**
 * Feature handlers for YouTube homepage
 * @module features/homepage
 */

import { createFeatureHandler } from '../../utils/feature-utils';

/**
 * CSS selectors for targeting YouTube homepage feed elements
 */
const HOME_FEED_SELECTORS = [
  '#chips-wrapper',
  'ytd-browse[page-subtype="home"] #contents',
] as const;

/**
 * CSS selectors for targeting YouTube Shorts-related elements
 */
const SHORTS_SELECTORS = [
  'ytd-rich-shelf-renderer',
  'ytd-reel-shelf-renderer',
  '#shorts-container',
  'ytd-guide-entry-renderer [title="Shorts"]',
] as const;

/**
 * CSS selectors for targeting subscription-related elements
 */
const SUBSCRIPTION_SELECTORS = [
  'ytd-guide-entry-renderer a[href="/feed/subscriptions"]',
  '#sections > ytd-guide-section-renderer:nth-child(2)',
  'ytd-browse[page-subtype="subscriptions"]',
] as const;

/**
 * CSS selectors for targeting explore/trending elements
 */
const EXPLORE_SELECTORS = [
  '#sections > ytd-guide-section-renderer:nth-child(3)',
  'ytd-browse[page-subtype="trending"]',
] as const;

/**
 * CSS selectors for targeting "More from YouTube" section
 */
const MORE_FROM_YOUTUBE_SELECTORS = [
  '#sections > ytd-guide-section-renderer:nth-child(4)',
] as const;

/**
 * Default observer options for all feature handlers
 */
const DEFAULT_OBSERVER_OPTIONS: MutationObserverInit = {
  childList: true,
  subtree: true,
};

/**
 * Handles visibility of elements by setting display style and data attribute
 * @param {HTMLElement} element - The element to modify
 * @param {boolean} enabled - Whether to hide the element
 */
const toggleElementVisibility = (element: HTMLElement, enabled: boolean) => {
  if (enabled) {
    element.dataset.hiddenByFeature = 'true';
    element.style.display = 'none';
  } else if (element.dataset.hiddenByFeature) {
    delete element.dataset.hiddenByFeature;
    element.style.removeProperty('display');
  }
};

/**
 * Feature handler for hiding the YouTube home feed
 */
export const initializeHideHomeFeed = createFeatureHandler(
  {
    selectors: HOME_FEED_SELECTORS,
    debounceMs: 100,
    observerOptions: DEFAULT_OBSERVER_OPTIONS,
  },
  (elements, enabled) => {
    try {
      elements.forEach((element) => toggleElementVisibility(element, enabled));
    } catch (error) {
      console.error('Error in initializeHideHomeFeed:', error);
    }
  }
);

/**
 * Feature handler for hiding YouTube Shorts content
 */
export const initializeShorts = createFeatureHandler(
  {
    selectors: SHORTS_SELECTORS,
    debounceMs: 100,
    observerOptions: DEFAULT_OBSERVER_OPTIONS,
  },
  (elements, enabled) => {
    try {
      elements.forEach((element) => toggleElementVisibility(element, enabled));
    } catch (error) {
      console.error('Error in initializeShorts:', error);
    }
  }
);

/**
 * Feature handler for hiding subscription-related content
 */
export const initializeSubscriptions = createFeatureHandler(
  {
    selectors: SUBSCRIPTION_SELECTORS,
    debounceMs: 100,
    observerOptions: DEFAULT_OBSERVER_OPTIONS,
  },
  (elements, enabled) => {
    try {
      elements.forEach((element) => toggleElementVisibility(element, enabled));
    } catch (error) {
      console.error('Error in initializeSubscriptions:', error);
    }
  }
);

/**
 * Feature handler for hiding explore/trending content
 */
export const initializeExplore = createFeatureHandler(
  {
    selectors: EXPLORE_SELECTORS,
    debounceMs: 100,
    observerOptions: DEFAULT_OBSERVER_OPTIONS,
  },
  (elements, enabled) => {
    try {
      elements.forEach((element) => toggleElementVisibility(element, enabled));
    } catch (error) {
      console.error('Error in initializeExplore:', error);
    }
  }
);

/**
 * Feature handler for hiding the "More from YouTube" section
 */
export const initializeMoreFromYouTube = createFeatureHandler(
  {
    selectors: MORE_FROM_YOUTUBE_SELECTORS,
    debounceMs: 100,
    observerOptions: DEFAULT_OBSERVER_OPTIONS,
  },
  (elements, enabled) => {
    try {
      elements.forEach((element) => toggleElementVisibility(element, enabled));
    } catch (error) {
      console.error('Error in initializeMoreFromYouTube:', error);
    }
  }
);

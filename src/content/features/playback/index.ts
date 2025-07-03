/**
 * Feature handlers for YouTube playback controls
 * @module features/playback
 */

import { enableFeature } from '../../utils/feature-utils';

/**
 * Initialize end screen cards hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeEndScreenCards = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-end-screen-cards');
};

/**
 * Initialize end screen feed hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeEndScreenFeed = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-end-screen-feed');
};

// ===============================
// AUTOPLAY CONTROL (Continuous monitoring approach)
// ===============================

let autoplayInterval: NodeJS.Timeout | null = null;

/**
 * Check and disable autoplay buttons if they're enabled
 */
const checkAndDisableAutoplay = () => {
  try {
    const autoplayButtons = document.querySelectorAll(
      '.ytp-autonav-toggle-button[aria-checked="true"]'
    );
    autoplayButtons.forEach((button) => {
      const element = button as HTMLElement;
      if (element && element.offsetParent) {
        element.click();
      }
    });

    const mobileAutoplayButtons = document.querySelectorAll(
      '.ytm-autonav-toggle-button-container[aria-pressed="true"]'
    );
    mobileAutoplayButtons.forEach((button) => {
      const element = button as HTMLElement;
      if (element && element.offsetParent) {
        element.click();
      }
    });
  } catch (error) {
    console.error('Error checking and disabling autoplay buttons:', error);
  }
};

/**
 * Initialize autoplay disabling with continuous monitoring
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove interval
 */
export const initializeAutoplay = (enabled: boolean): (() => void) | void => {
  if (!enabled) {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
    return;
  }

  autoplayInterval = setInterval(checkAndDisableAutoplay, 100);

  return () => {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  };
};

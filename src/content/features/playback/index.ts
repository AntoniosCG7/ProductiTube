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

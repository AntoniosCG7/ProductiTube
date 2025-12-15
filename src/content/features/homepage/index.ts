/**
 * Feature handlers for YouTube homepage
 * @module features/homepage
 */

import { enableFeature } from '../../utils/feature-utils';

/**
 * Initialize home feed hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeHideHomeFeed = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-home-feed');
};

/**
 * Initialize Shorts hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeShorts = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-shorts');
};

/**
 * Initialize subscriptions hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeSubscriptions = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-subscriptions');
};

/**
 * Initialize explore/trending hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeExplore = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-explore');
};

/**
 * Initialize "More from YouTube" hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeMoreFromYouTube = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-more-youtube');
};

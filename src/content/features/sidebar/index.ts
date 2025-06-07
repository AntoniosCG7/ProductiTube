/**
 * Feature handlers for YouTube sidebar controls
 * @module features/sidebar
 */

import { enableFeature } from '../../utils/feature-utils';

/**
 * Initialize recommended videos hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeRecommendedVideos = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-recommended-videos');
};

/**
 * Initialize live chat hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeLiveChat = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-live-chat');
};

/**
 * Initialize playlist hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializePlaylist = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-playlist');
};

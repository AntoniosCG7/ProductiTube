/**
 * Feature handlers for YouTube header controls
 * @module features/header
 */

import { enableFeature } from '../../utils/feature-utils';

/**
 * Initialize top header hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeTopHeader = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-top-header');
};

/**
 * Initialize notifications hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeNotifications = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-notifications');
};

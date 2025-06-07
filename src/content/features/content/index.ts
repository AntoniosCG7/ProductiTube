/**
 * Feature handlers for YouTube content controls
 * @module features/content
 */

import { enableFeature } from '../../utils/feature-utils';

/**
 * Initialize channel info hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeChannel = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-channel');
};

/**
 * Initialize video info hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeVideoInfo = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-video-info');
};

/**
 * Initialize description hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeDescription = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-description');
};

/**
 * Initialize buttons bar hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeButtonsBar = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-buttons-bar');
};

/**
 * Initialize comments hiding features
 * @param enabled - Whether the feature should be enabled
 * @returns Cleanup function to remove observers
 */
export const initializeComments = (enabled: boolean): (() => void) | void => {
  if (!enabled) return;
  return enableFeature('hide-comments');
};

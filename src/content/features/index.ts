import type { Settings } from '@/types';
import {
  initializeHideHomeFeed,
  initializeShorts,
  initializeSubscriptions,
  initializeExplore,
  initializeMoreFromYouTube,
} from './homepage';
import { initializeAutoplay, initializeEndScreenCards, initializeEndScreenFeed } from './playback';
import {
  initializeChannel,
  initializeVideoInfo,
  initializeDescription,
  initializeButtonsBar,
  initializeComments,
  initializeBlurThumbnails,
  initializeHideVideoPreview,
} from './content';
import { initializeTopHeader, initializeNotifications } from './header';
import { initializeRecommendedVideos, initializeLiveChat, initializePlaylist } from './sidebar';
import { initializeVideoLimits } from './limits';

type FeatureInitializer = (enabled: boolean) => (() => void) | void;

/**
 * Storage key for settings
 */
const SETTINGS_STORAGE_KEY = 'youtube_settings';
const LIMITS_STORAGE_KEY = 'youtube_limits_settings';

// Map of feature keys to their initialization functions
const featureInitializers: Partial<Record<keyof Settings, FeatureInitializer>> = {
  hideHomeFeed: initializeHideHomeFeed,
  hideRecommended: initializeRecommendedVideos,
  hideComments: initializeComments,
  hideShorts: initializeShorts,
  hideLiveChat: initializeLiveChat,
  hideVideoInfo: initializeVideoInfo,
  hideButtonsBar: initializeButtonsBar,
  hideDescription: initializeDescription,
  hideEndScreenCards: initializeEndScreenCards,
  hideEndScreenFeed: initializeEndScreenFeed,
  hideTopHeader: initializeTopHeader,
  hideNotifications: initializeNotifications,
  hideSubscriptions: initializeSubscriptions,
  hideExplore: initializeExplore,
  hideChannel: initializeChannel,
  hidePlaylist: initializePlaylist,
  hideMoreFromYoutube: initializeMoreFromYouTube,
  hideVideoPreview: initializeHideVideoPreview,
  disableAutoplay: initializeAutoplay,
  blurThumbnails: initializeBlurThumbnails,
} as const;

// Store cleanup functions
const cleanupFunctions = new Map<keyof Settings, () => void>();
let videoLimitsCleanup: (() => void) | undefined;
let videoLimitsInitialized = false;

// Utility to re-run features on navigation
function watchYouTubeNavigation(onNavigate: () => void) {
  const run = () => setTimeout(onNavigate, 500);

  window.addEventListener('yt-navigate-finish', run);

  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    run();
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    run();
  };

  window.addEventListener('popstate', run);
}

export const initializeFeatures = async () => {
  try {
    const settingsData = await chrome.storage.sync.get(SETTINGS_STORAGE_KEY);
    const settings = (settingsData[SETTINGS_STORAGE_KEY] || {}) as Partial<Settings>;

    Object.entries(featureInitializers).forEach(([key, initializer]) => {
      const settingKey = key as keyof Settings;
      const enabled = settings[settingKey] ?? false;

      cleanupFunctions.get(settingKey)?.();

      const cleanup = initializer(enabled);
      if (cleanup) {
        cleanupFunctions.set(settingKey, cleanup);
      }
    });

    // Only initialize video limits once - it has its own storage listener for updates
    if (!videoLimitsInitialized) {
      videoLimitsCleanup = initializeVideoLimits();
      videoLimitsInitialized = true;
    }

    // Reapply selected features on YouTube page navigation
    watchYouTubeNavigation(() => {
      const settingsKeysToReinitialize: (keyof Settings)[] = ['disableAutoplay'];

      settingsKeysToReinitialize.forEach((key) => {
        const enabled = settings[key] ?? false;

        const initializer = featureInitializers[key];

        if (initializer) {
          cleanupFunctions.get(key)?.();

          const cleanup = initializer(enabled);
          if (cleanup) {
            cleanupFunctions.set(key, cleanup);
          }
        }
      });
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes[SETTINGS_STORAGE_KEY]) {
        const newSettings = changes[SETTINGS_STORAGE_KEY].newValue || {};

        Object.entries(featureInitializers).forEach(([key, initializer]) => {
          const settingKey = key as keyof Settings;
          const newValue = newSettings[settingKey] ?? false;

          cleanupFunctions.get(settingKey)?.();

          const cleanup = initializer(newValue);
          if (cleanup) {
            cleanupFunctions.set(settingKey, cleanup);
          }
        });
      }

      // Only reinitialize limits feature when isLimitsEnabled changes, not on category edits
      if (changes[LIMITS_STORAGE_KEY]) {
        const oldLimitsSettings = changes[LIMITS_STORAGE_KEY].oldValue || {};
        const newLimitsSettings = changes[LIMITS_STORAGE_KEY].newValue || {};

        // Only reinitialize if the enabled state actually changed
        if (oldLimitsSettings.isLimitsEnabled !== newLimitsSettings.isLimitsEnabled) {
          if (videoLimitsCleanup) {
            videoLimitsCleanup();
          }
          videoLimitsCleanup = initializeVideoLimits();
        }
      }
    });
  } catch (error) {
    console.error('❌ [ProductiTube] Failed to initialize features:', error);
  }
};

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
} from './content';
import { initializeTopHeader, initializeNotifications } from './header';
import { initializeRecommendedVideos, initializeLiveChat, initializePlaylist } from './sidebar';

type FeatureInitializer = (enabled: boolean) => (() => void) | void;

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
  disableAutoplay: initializeAutoplay,
} as const;

// Store cleanup functions
const cleanupFunctions = new Map<keyof Settings, () => void>();

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
    // Get initial settings
    const settings = (await chrome.storage.sync.get()) as Partial<Settings>;
    console.debug('Initializing features with settings:', settings);

    // Initialize features and store cleanup functions
    Object.entries(featureInitializers).forEach(([key, initializer]) => {
      const settingKey = key as keyof Settings;
      const enabled = settings[settingKey] ?? false;

      // Clean up previous instance if it exists
      cleanupFunctions.get(settingKey)?.();

      // Initialize feature and store cleanup function if returned
      const cleanup = initializer(enabled);
      if (cleanup) {
        cleanupFunctions.set(settingKey, cleanup);
      }
    });

    // Reapply selected features on YouTube page navigation
    watchYouTubeNavigation(() => {
      const settingsKeysToReinitialize: (keyof Settings)[] = ['disableAutoplay'];

      settingsKeysToReinitialize.forEach((key) => {
        const enabled = settings[key] ?? false;

        const initializer = featureInitializers[key];

        if (initializer) {
          cleanupFunctions.get(key)?.(); // Clean up old observer

          const cleanup = initializer(enabled);
          if (cleanup) {
            cleanupFunctions.set(key, cleanup);
          }
        }
      });
    });

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes) => {
      Object.entries(changes).forEach(([key, { newValue }]) => {
        const settingKey = key as keyof Settings;

        const initializer = featureInitializers[settingKey];

        if (initializer) {
          // Clean up previous instance
          cleanupFunctions.get(settingKey)?.();

          // Initialize with new value and store cleanup function
          const cleanup = initializer(newValue);
          if (cleanup) {
            cleanupFunctions.set(settingKey, cleanup);
          }
        }
      });
    });
  } catch (error) {
    console.error('Failed to initialize features:', error);
  }
};

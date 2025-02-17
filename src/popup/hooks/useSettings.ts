import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings } from '@/types';

/**
 * Default settings configuration for the extension
 * All features are disabled by default following the principle of least privilege
 */
const defaultSettings: Settings = {
  hideHomeFeed: false,
  hideShorts: false,
  hideSubscriptions: false,
  hideExplore: false,
  hideMoreFromYoutube: false,
  disableAutoplay: false,
  hideEndScreenCards: false,
  hideEndScreenFeed: false,
  hideChannel: false,
  hideVideoInfo: false,
  hideDescription: false,
  hideButtonsBar: false,
  hideComments: false,
  hideTopHeader: false,
  hideNotifications: false,
  hideRecommended: false,
  hideLiveChat: false,
  hidePlaylist: false,
};

/**
 * Storage key for settings in chrome.storage.sync
 */
const SETTINGS_STORAGE_KEY = 'youtube_settings';

/**
 * Debounce delay for saving settings (in milliseconds)
 */
const SAVE_DEBOUNCE_DELAY = 500;

/**
 * Custom hook for managing extension settings with chrome.storage.sync
 * Provides debounced updates and error handling
 *
 * @returns {[Settings, (newSettings: Partial<Settings>) => Promise<void>]}
 * Tuple containing current settings and update function
 *
 * @example
 * const [settings, updateSettings] = useSettings();
 *
 * // Update a single setting
 * updateSettings({ hideHomeFeed: true });
 *
 * // Update multiple settings
 * updateSettings({
 *   hideShorts: true,
 *   hideComments: true
 * });
 */
export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [error, setError] = useState<Error | null>(null);
  const updateTimeoutRef = useRef<number>();
  const pendingUpdatesRef = useRef<Partial<Settings>>({});
  const isMountedRef = useRef(true);

  /**
   * Fetches settings from chrome.storage.sync
   */
  const fetchSettings = useCallback(async () => {
    try {
      const storedSettings = await chrome.storage.sync.get(SETTINGS_STORAGE_KEY);
      if (isMountedRef.current) {
        setSettings((prev) => ({
          ...prev,
          ...(storedSettings[SETTINGS_STORAGE_KEY] || {}),
        }));
        setError(null);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch settings'));
    }
  }, []);

  // Initialize settings on mount
  useEffect(() => {
    isMountedRef.current = true;
    fetchSettings();

    // Listen for settings changes from other contexts
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[SETTINGS_STORAGE_KEY] && isMountedRef.current) {
        setSettings((prev) => ({
          ...prev,
          ...changes[SETTINGS_STORAGE_KEY].newValue,
        }));
      }
    };

    chrome.storage.sync.onChanged.addListener(handleStorageChange);

    return () => {
      isMountedRef.current = false;
      chrome.storage.sync.onChanged.removeListener(handleStorageChange);
    };
  }, [fetchSettings]);

  /**
   * Updates settings with debouncing and error handling
   */
  const updateSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      // Update local state immediately
      setSettings((prev) => ({ ...prev, ...newSettings }));

      // Accumulate updates
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...newSettings,
      };

      // Clear existing timeout
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }

      // Debounce storage updates
      updateTimeoutRef.current = window.setTimeout(async () => {
        try {
          await chrome.storage.sync.set({
            [SETTINGS_STORAGE_KEY]: {
              ...settings,
              ...pendingUpdatesRef.current,
            },
          });
          pendingUpdatesRef.current = {};
          setError(null);
        } catch (error) {
          console.error('Failed to update settings:', error);
          setError(error instanceof Error ? error : new Error('Failed to update settings'));
          // Revert local state on error
          fetchSettings();
        }
      }, SAVE_DEBOUNCE_DELAY);
    },
    [settings, fetchSettings]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return [settings, updateSettings, error] as const;
};

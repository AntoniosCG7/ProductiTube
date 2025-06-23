import { useState, useEffect, useCallback, useRef } from 'react';
import { LimitsSettings } from '@/types';

const defaultLimitsSettings: LimitsSettings = {
  isLimitsEnabled: false,
  categories: {
    'video-count': [],
    'time-category': [],
  },
};

const LIMITS_STORAGE_KEY = 'youtube_limits_settings';
const USAGE_STORAGE_KEY = 'youtube_usage_data';

interface UsageData {
  [date: string]: {
    [categoryId: string]: number;
  };
}

/**
 * Get today's date string for usage tracking
 */
const getTodayString = (): string => {
  return new Date().toDateString();
};

/**
 * Hook for managing video limits settings with Chrome storage
 */
export const useLimitsSettings = () => {
  const [limitsSettings, setLimitsSettings] = useState<LimitsSettings>(defaultLimitsSettings);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateTimeoutRef = useRef<number>();
  const pendingUpdatesRef = useRef<Partial<LimitsSettings>>({});
  const isMountedRef = useRef(true);

  const fetchLimitsSettings = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load both limits settings and usage data
      const [storedSettings, usageData] = await Promise.all([
        chrome.storage.sync.get(LIMITS_STORAGE_KEY),
        chrome.storage.local.get(USAGE_STORAGE_KEY),
      ]);

      const settings = storedSettings[LIMITS_STORAGE_KEY] || {};
      const usage: UsageData = usageData[USAGE_STORAGE_KEY] || {};
      const today = getTodayString();

      if (isMountedRef.current) {
        // Merge usage data with settings to show current counts
        const mergedSettings = {
          ...defaultLimitsSettings,
          ...settings,
        };

        // Update categories with current usage data
        if (mergedSettings.categories) {
          ['video-count', 'time-category'].forEach((mode) => {
            if (mergedSettings.categories[mode as keyof typeof mergedSettings.categories]) {
              mergedSettings.categories[mode as keyof typeof mergedSettings.categories] =
                mergedSettings.categories[mode as keyof typeof mergedSettings.categories].map(
                  (category: any) => ({
                    ...category,
                    videosWatchedToday: usage[today]?.[category.id] || 0,
                    timeWatchedToday: category.timeWatchedToday || 0,
                  })
                );
            }
          });
        }

        setLimitsSettings(mergedSettings);
        setError(null);
      }
    } catch (error) {
      console.error('Failed to fetch limits settings:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch limits settings'));
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const updateLimitsSettings = useCallback(async (updates: Partial<LimitsSettings>) => {
    try {
      // Clear any pending timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Merge with pending updates
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

      // Update local state immediately for responsive UI
      setLimitsSettings((prev) => ({ ...prev, ...updates }));

      // Debounce actual storage updates
      updateTimeoutRef.current = window.setTimeout(async () => {
        try {
          const finalUpdates = pendingUpdatesRef.current;
          pendingUpdatesRef.current = {};

          const currentSettings = await chrome.storage.sync.get(LIMITS_STORAGE_KEY);
          const newSettings = {
            ...currentSettings[LIMITS_STORAGE_KEY],
            ...finalUpdates,
          };

          await chrome.storage.sync.set({ [LIMITS_STORAGE_KEY]: newSettings });
          console.debug('Limits settings updated:', newSettings);

          // Send message to content script about the update
          try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id && tabs[0].url?.includes('youtube.com')) {
              await chrome.tabs.sendMessage(tabs[0].id, {
                type: 'LIMITS_UPDATED',
                settings: newSettings,
              });
            }
          } catch (tabError) {
            console.debug('Could not send message to content script:', tabError);
          }

          setError(null);
        } catch (storageError) {
          console.error('Failed to update limits settings:', storageError);
          setError(
            storageError instanceof Error
              ? storageError
              : new Error('Failed to update limits settings')
          );
        }
      }, 300);
    } catch (error) {
      console.error('Failed to update limits settings:', error);
      setError(error instanceof Error ? error : new Error('Failed to update limits settings'));
    }
  }, []);

  const resetAllUsage = useCallback(async () => {
    try {
      await chrome.storage.local.remove(USAGE_STORAGE_KEY);
      await fetchLimitsSettings();
      console.debug('All usage data reset');
    } catch (error) {
      console.error('Failed to reset usage data:', error);
      setError(error instanceof Error ? error : new Error('Failed to reset usage data'));
    }
  }, [fetchLimitsSettings]);

  useEffect(() => {
    fetchLimitsSettings();

    // Listen for storage changes
    const handleStorageChanges = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[LIMITS_STORAGE_KEY] || changes[USAGE_STORAGE_KEY]) {
        fetchLimitsSettings();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChanges);

    return () => {
      isMountedRef.current = false;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      chrome.storage.onChanged.removeListener(handleStorageChanges);
    };
  }, [fetchLimitsSettings]);

  return {
    limitsSettings,
    updateLimitsSettings,
    resetAllUsage,
    error,
    isLoading,
  };
};

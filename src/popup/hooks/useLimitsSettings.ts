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
    [normalizedCategoryName: string]: {
      videoCount: number;
      timeWatched: number;
    };
  };
}

/**
 * Get today's date string for usage tracking
 */
const getTodayString = (): string => {
  return new Date().toDateString();
};

/**
 * Normalize category name for consistent storage key lookup
 */
const normalizeCategoryName = (name: string): string => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
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

      const [storedSettings, usageDataResult] = await Promise.all([
        chrome.storage.sync.get(LIMITS_STORAGE_KEY),
        chrome.storage.local.get(USAGE_STORAGE_KEY),
      ]);

      const settings = storedSettings[LIMITS_STORAGE_KEY] || {};
      const usage: UsageData = usageDataResult[USAGE_STORAGE_KEY] || {};
      const today = getTodayString();

      if (isMountedRef.current) {
        const mergedSettings = {
          ...defaultLimitsSettings,
          ...settings,
        };

        if (mergedSettings.categories) {
          ['video-count', 'time-category'].forEach((mode) => {
            if (mergedSettings.categories[mode as keyof typeof mergedSettings.categories]) {
              mergedSettings.categories[mode as keyof typeof mergedSettings.categories] =
                mergedSettings.categories[mode as keyof typeof mergedSettings.categories].map(
                  (category: any) => {
                    const storageKey = normalizeCategoryName(category.name);
                    return {
                      ...category,
                      videosWatchedToday: usage[today]?.[storageKey]?.videoCount || 0,
                      timeWatchedToday: usage[today]?.[storageKey]?.timeWatched || 0,
                    };
                  }
                );
            }
          });
        }

        const totalTimeWatched = usage[today]?.['total-time-limit']?.timeWatched || 0;

        mergedSettings.totalTimeWatchedToday = totalTimeWatched;

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
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

      setLimitsSettings((prev) => ({ ...prev, ...updates }));

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

          try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id && tabs[0].url?.includes('youtube.com')) {
              await chrome.tabs.sendMessage(tabs[0].id, {
                type: 'LIMITS_UPDATED',
                settings: newSettings,
              });
            }
          } catch (tabError) {
            console.error('Could not send message to content script:', tabError);
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
    } catch (error) {
      console.error('Failed to reset usage data:', error);
      setError(error instanceof Error ? error : new Error('Failed to reset usage data'));
    }
  }, [fetchLimitsSettings]);

  useEffect(() => {
    fetchLimitsSettings();

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

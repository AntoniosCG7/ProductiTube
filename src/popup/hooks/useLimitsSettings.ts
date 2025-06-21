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
      const storedSettings = await chrome.storage.sync.get(LIMITS_STORAGE_KEY);
      if (isMountedRef.current) {
        setLimitsSettings((prev) => ({
          ...prev,
          ...(storedSettings[LIMITS_STORAGE_KEY] || {}),
        }));
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

  const performStorageWrite = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current || Object.keys(pendingUpdatesRef.current).length === 0) {
      return;
    }

    try {
      const finalSettings = {
        ...limitsSettings,
        ...pendingUpdatesRef.current,
      };

      await chrome.storage.sync.set({
        [LIMITS_STORAGE_KEY]: finalSettings,
      });

      pendingUpdatesRef.current = {};
      setError(null);

      console.debug('[ProductiTube] Limits settings saved successfully');
    } catch (error) {
      console.error('Failed to save limits settings:', error);

      if (error instanceof Error && error.message.includes('QUOTA_BYTES_PER_ITEM')) {
        setError(new Error('Limits data too large.'));
      } else if (
        error instanceof Error &&
        error.message.includes('MAX_WRITE_OPERATIONS_PER_MINUTE')
      ) {
        setError(new Error('Too many changes. Please wait a moment before making more changes.'));
      } else {
        setError(error instanceof Error ? error : new Error('Failed to save limits settings'));
        fetchLimitsSettings();
      }
    }
  }, [limitsSettings, fetchLimitsSettings]);

  const updateLimitsSettings = useCallback(
    async (newSettings: Partial<LimitsSettings>) => {
      setLimitsSettings((prev) => ({ ...prev, ...newSettings }));

      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...newSettings,
      };

      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = window.setTimeout(performStorageWrite, 300);
    },
    [performStorageWrite]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchLimitsSettings();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[LIMITS_STORAGE_KEY] && isMountedRef.current) {
        setLimitsSettings((prev) => ({
          ...prev,
          ...changes[LIMITS_STORAGE_KEY].newValue,
        }));
      }
    };

    chrome.storage.sync.onChanged.addListener(handleStorageChange);

    return () => {
      isMountedRef.current = false;
      chrome.storage.sync.onChanged.removeListener(handleStorageChange);

      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [fetchLimitsSettings]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return [limitsSettings, updateLimitsSettings, error, isLoading] as const;
};

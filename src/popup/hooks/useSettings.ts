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
  blurThumbnails: false,
};

/**
 * Storage key for settings in chrome.storage.sync
 */
const SETTINGS_STORAGE_KEY = 'youtube_settings';

/**
 * Rate limiting configuration for Chrome storage
 */
const RATE_LIMIT_CONFIG = {
  maxWritesPerMinute: 100,
  maxWritesPerHour: 1500,
  baseDebounceMs: 16,
  aggressiveDebounceMs: 1000,
  maxDebounceMs: 3000,
};

/**
 * Minimal storage operation tracker optimized for performance
 */
class StorageRateTracker {
  private operationCount = 0;
  private lastOperationTime = 0;
  private heavyUsageMode = false;
  private writeOperations: number[] = [];

  recordWrite(): void {
    const now = Date.now();
    this.operationCount++;
    this.lastOperationTime = now;

    if (!this.heavyUsageMode && this.operationCount >= 15) {
      this.heavyUsageMode = true;
      this.writeOperations = [now];
    }

    if (this.heavyUsageMode) {
      this.writeOperations.push(now);

      if (this.writeOperations.length > 200) {
        const cutoff = now - 60 * 60 * 1000;
        this.writeOperations = this.writeOperations.filter((time) => time > cutoff);
      }
    }
  }

  isRateLimited(): { limited: boolean; waitMs?: number } {
    if (!this.heavyUsageMode) return { limited: false };

    const now = Date.now();
    const cutoff = now - 60 * 1000;
    const recentWrites = this.writeOperations.filter((time) => time > cutoff).length;

    return recentWrites >= 80 ? { limited: true, waitMs: 60 * 1000 } : { limited: false };
  }

  getOptimalDebounceMs(): number {
    if (!this.heavyUsageMode) {
      return RATE_LIMIT_CONFIG.baseDebounceMs;
    }

    const now = Date.now();
    const cutoff = now - 60 * 1000;
    const recentWrites = this.writeOperations.filter((time) => time > cutoff).length;

    if (recentWrites >= 60) return RATE_LIMIT_CONFIG.maxDebounceMs;
    if (recentWrites >= 40) return RATE_LIMIT_CONFIG.aggressiveDebounceMs;
    return RATE_LIMIT_CONFIG.baseDebounceMs;
  }

  resetIfIdle(): void {
    const now = Date.now();
    if (this.heavyUsageMode && now - this.lastOperationTime > 300000) {
      this.heavyUsageMode = false;
      this.operationCount = 0;
      this.writeOperations = [];
    }
  }
}

const rateTracker = new StorageRateTracker();

/**
 * Enhanced settings hook with rate limiting and error recovery
 */
export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [error, setError] = useState<Error | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const updateTimeoutRef = useRef<number>();
  const pendingUpdatesRef = useRef<Partial<Settings>>({});
  const isMountedRef = useRef(true);
  const retryTimeoutRef = useRef<number>();

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

  /**
   * Performs the actual storage write with rate limiting
   */
  const performStorageWrite = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current || Object.keys(pendingUpdatesRef.current).length === 0) {
      return;
    }

    const rateLimitStatus = rateTracker.isRateLimited();
    if (rateLimitStatus.limited) {
      setIsRateLimited(true);

      retryTimeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          setIsRateLimited(false);
          performStorageWrite();
        }
      }, rateLimitStatus.waitMs);

      return;
    }

    try {
      setIsRateLimited(false);

      const finalSettings = {
        ...settings,
        ...pendingUpdatesRef.current,
      };

      await chrome.storage.sync.set({
        [SETTINGS_STORAGE_KEY]: finalSettings,
      });

      rateTracker.recordWrite();
      pendingUpdatesRef.current = {};
      setError(null);
    } catch (error) {
      console.error('Failed to save settings:', error);

      if (error instanceof Error && error.message.includes('QUOTA_BYTES_PER_ITEM')) {
        setError(new Error('Settings data too large. Please contact support.'));
      } else if (
        error instanceof Error &&
        error.message.includes('MAX_WRITE_OPERATIONS_PER_MINUTE')
      ) {
        setError(new Error('Too many changes. Please wait a moment before making more changes.'));
        setIsRateLimited(true);

        retryTimeoutRef.current = window.setTimeout(() => {
          if (isMountedRef.current) {
            setIsRateLimited(false);
            performStorageWrite();
          }
        }, 60000);
      } else {
        setError(error instanceof Error ? error : new Error('Failed to save settings'));

        fetchSettings();
      }
    }
  }, [settings, fetchSettings]);

  /**
   * Updates settings with intelligent debouncing and rate limiting
   */
  const updateSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));

      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...newSettings,
      };

      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }

      rateTracker.resetIfIdle();

      if (!rateTracker['heavyUsageMode']) {
        updateTimeoutRef.current = window.setTimeout(
          performStorageWrite,
          RATE_LIMIT_CONFIG.baseDebounceMs
        );
        return;
      }

      const debounceMs = rateTracker.getOptimalDebounceMs();
      updateTimeoutRef.current = window.setTimeout(performStorageWrite, debounceMs);
    },
    [performStorageWrite]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchSettings();

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

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return [settings, updateSettings, error, isRateLimited] as const;
};

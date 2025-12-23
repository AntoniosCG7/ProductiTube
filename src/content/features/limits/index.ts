import type { LimitsSettings, VideoCategory } from '@/types';

// ==================== CONSTANTS ====================

// Storage Keys
const LIMITS_STORAGE_KEY = 'youtube_limits_settings';
const USAGE_STORAGE_KEY = 'youtube_usage_data';

// Time and Tracking Constants
const TIME_TRACKING_INTERVAL_MS = 10000;
const MIN_TRACKING_TIME_MINUTES = 0.17;
const DEFAULT_TIME_LIMIT_MINUTES = 60;
const USAGE_DATA_RETENTION_DAYS = 7;
const TOTAL_TIME_CATEGORY_ID = 'total-time-limit';

// Timeout and Delay Constants
const VIDEO_WAIT_TIMEOUT_MS = 500;
const INITIAL_VIDEO_WAIT_MS = 1000;
const NAVIGATION_DELAY_MS = 1500;
const QUICK_TIMEOUT_MS = 100;
const FAILSAFE_TIMEOUT_MS = 10000;
const COUNTDOWN_UPDATE_INTERVAL_MS = 1000;

// Time Calculation Constants
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const TOTAL_DAY_MS =
  HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

// DOM Element IDs
const MODAL_ID = 'productitube-category-modal';
const COUNTDOWN_TIME_ID = 'productitube-countdown-time';
const PROGRESS_FILL_ID = 'productitube-progress-fill';
const CONTINUE_BUTTON_ID = 'productitube-continue-btn';
const HOME_BUTTON_ID = 'productitube-home-btn';
const LIMIT_OK_BUTTON_ID = 'productitube-limit-ok';
const SCROLLBAR_OVERRIDE_ID = 'productitube-scrollbar-override';

// CSS Class Names
const MODAL_OVERLAY_CLASS = 'productitube-modal-overlay';
const CATEGORY_OPTION_CLASS = 'productitube-category-option';
const CATEGORY_SELECTED_CLASS = 'selected';
const LIMIT_MESSAGE_CLASS = 'productitube-limit-message';
const LIMIT_BLOCKING_MESSAGE_CLASS = 'productitube-limit-blocking-message';

// URL and Navigation Constants
const YOUTUBE_HOME_URL = '/';

// Feature Labels
const FEATURE_LABELS = {
  TIME_LIMIT_REACHED: 'Time Limit Reached',
  DAILY_LIMIT_REACHED: 'Daily Time Limit Reached',
  CATEGORIZE_VIDEO: 'Categorize this video',
  ENJOY_VIDEO: 'Enjoy this video!',
  LIMITS_RESET: 'Limits reset in',
  GO_HOME: 'Go to Home Feed',
  CONTINUE: 'Continue',
  START_WATCHING: 'Start Watching',
  PROCESSING: 'Processing...',
} as const;

// ==================== INTERFACES ====================
/**
 * Usage data keyed by date and normalized category name
 */
interface UsageData {
  [date: string]: {
    [normalizedCategoryName: string]: {
      videoCount: number;
      timeWatched: number;
    };
  };
}

interface VideoLimitsState {
  // Core state
  isActive: boolean;
  settings: LimitsSettings | null;
  usageData: UsageData;

  // UI state
  modalElement: HTMLElement | null;
  videoElement: HTMLVideoElement | null;
  isProcessingVideo: boolean;
  currentVideoUrl: string | null;
  pendingTimeouts: number[];
  isModalVisible: boolean;

  // Category-based tracking
  selectedCategoryId: string | null;
  videoStartTime: number | null;
  timeTrackingInterval: number | null;
  wasVideoPaused: boolean;
  accumulatedTime: number;

  // Total time tracking
  totalTimeStartTime: number | null;
  totalTimeTrackingInterval: number | null;
  totalTimeWasVideoPaused: boolean;
  totalTimeAccumulated: number;
}

// ==================== STATE INITIALIZATION ====================
const state: VideoLimitsState = {
  // Core state
  isActive: false,
  settings: null,
  usageData: {},

  // UI state
  modalElement: null,
  videoElement: null,
  isProcessingVideo: false,
  currentVideoUrl: null,
  pendingTimeouts: [],
  isModalVisible: false,

  // Category-based tracking
  selectedCategoryId: null,
  videoStartTime: null,
  timeTrackingInterval: null,
  wasVideoPaused: false,
  accumulatedTime: 0,

  // Total time tracking
  totalTimeStartTime: null,
  totalTimeTrackingInterval: null,
  totalTimeWasVideoPaused: false,
  totalTimeAccumulated: 0,
};

// ==================== UTILITY FUNCTIONS ====================
/**
 * Normalize category name for consistent storage key lookup
 */
const normalizeCategoryName = (name: string): string => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Get category name by ID, searching all modes
 */
const getCategoryNameById = (categoryId: string): string | null => {
  if (!state.settings) return null;

  const videoCountCategories = state.settings.categories['video-count'] || [];
  const timeCategoryCategories = state.settings.categories['time-category'] || [];

  const activeMode = state.settings.activeMode || 'time-category';
  const primaryCategories =
    activeMode === 'video-count' ? videoCountCategories : timeCategoryCategories;
  const secondaryCategories =
    activeMode === 'video-count' ? timeCategoryCategories : videoCountCategories;

  let category = primaryCategories.find((cat: VideoCategory) => cat.id === categoryId);
  if (!category) {
    category = secondaryCategories.find((cat: VideoCategory) => cat.id === categoryId);
  }

  return category ? category.name : null;
};

/**
 * Get normalized storage key for a category by ID
 */
const getCategoryStorageKey = (categoryId: string): string | null => {
  const name = getCategoryNameById(categoryId);
  return name ? normalizeCategoryName(name) : null;
};

/**
 * Get current video URL for comparison
 */
const getCurrentVideoUrl = (): string => {
  return window.location.href;
};

/**
 * Get today's date string for usage tracking
 */
const getTodayString = (): string => {
  return new Date().toDateString();
};

/**
 * Check if we're on a video watch page
 */
const isVideoWatchPage = (): boolean => {
  return window.location.pathname === '/watch' && window.location.search.includes('v=');
};

/**
 * Check if an ad is currently playing on YouTube
 * This checks for various ad indicators in the DOM
 */
const isAdPlaying = (): boolean => {
  const playerContainer = document.querySelector('.html5-video-player');
  if (playerContainer?.classList.contains('ad-showing')) {
    return true;
  }

  const adOverlay = document.querySelector('.ytp-ad-player-overlay');
  if (adOverlay) {
    return true;
  }

  const adModule = document.querySelector('.ytp-ad-module');
  if (adModule && adModule.children.length > 0) {
    const adText = document.querySelector('.ytp-ad-text');
    const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
    if (adText || skipButton) {
      return true;
    }
  }

  const adPreview = document.querySelector('.ytp-ad-preview-container');
  if (adPreview && window.getComputedStyle(adPreview).display !== 'none') {
    return true;
  }

  return false;
};

/**
 * Get time remaining until midnight (12 AM)
 */
const getTimeUntilMidnight = (): {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
} => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const totalMs = midnight.getTime() - now.getTime();
  const hours = Math.floor(totalMs / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, totalMs };
};

/**
 * Format time from minutes to human readable format (Xm Ys)
 */
const formatTime = (minutes: number): string => {
  const totalSeconds = Math.round(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    if (mins === 0 && secs === 0) {
      return `${hours}h`;
    } else if (secs === 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${hours}h ${mins}m ${secs}s`;
    }
  }

  if (mins === 0 && secs === 0) {
    return '0m';
  } else if (secs === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${secs}s`;
  } else {
    return `${mins}m ${secs}s`;
  }
};

// ==================== STATE MANAGEMENT ====================
/**
 * Clear all pending timeouts
 */
const clearPendingTimeouts = (): void => {
  state.pendingTimeouts.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  state.pendingTimeouts = [];
};

/**
 * Add a timeout to tracking
 */
const trackTimeout = (timeoutId: number): void => {
  state.pendingTimeouts.push(timeoutId);
};

/**
 * Reset processing state completely
 */
const resetProcessingState = (): void => {
  clearPendingTimeouts();
  if (state.timeTrackingInterval || state.selectedCategoryId) {
    stopTimeTracking();
  }
  if (state.totalTimeTrackingInterval) {
    stopTotalTimeTracking();
  }
  state.isProcessingVideo = false;
  state.isModalVisible = false;
  state.currentVideoUrl = null;
  state.accumulatedTime = 0;
};

// ==================== DATA MANAGEMENT ====================
/**
 * Load limits settings and usage data
 */
const loadData = async (): Promise<void> => {
  try {
    const [limitsData, usageData] = await Promise.all([
      chrome.storage.sync.get(LIMITS_STORAGE_KEY),
      chrome.storage.local.get(USAGE_STORAGE_KEY),
    ]);

    state.settings = limitsData[LIMITS_STORAGE_KEY] || null;
    state.usageData = usageData[USAGE_STORAGE_KEY] || {};

    await cleanupOldUsageData();
  } catch (error) {
    console.error('[ProductiTube Limits] Failed to load data:', error);
  }
};

/**
 * Save usage data to storage
 */
const saveUsageData = async (): Promise<void> => {
  try {
    await chrome.storage.local.set({ [USAGE_STORAGE_KEY]: state.usageData });
  } catch (error) {
    console.error('[ProductiTube Limits] Failed to save usage data:', error);
    throw error;
  }
};

/**
 * Clean up old usage data (keep only last 7 days)
 */
const cleanupOldUsageData = async (): Promise<void> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - USAGE_DATA_RETENTION_DAYS);

    const updatedUsageData: UsageData = {};

    for (const [dateStr, data] of Object.entries(state.usageData)) {
      const dataDate = new Date(dateStr);
      if (dataDate >= cutoffDate) {
        updatedUsageData[dateStr] = data;
      }
    }

    state.usageData = updatedUsageData;
    await saveUsageData();
  } catch (error) {
    console.error('[ProductiTube Limits] Failed to cleanup old usage data:', error);
  }
};

// ==================== USAGE TRACKING ====================
/**
 * Get videos watched today for a specific category
 */
const getVideosWatchedToday = (categoryId: string): number => {
  const storageKey = getCategoryStorageKey(categoryId);
  if (!storageKey) return 0;

  const today = getTodayString();
  return state.usageData[today]?.[storageKey]?.videoCount || 0;
};

/**
 * Get time watched today for a specific category (in minutes)
 */
const getTimeWatchedToday = (categoryId: string): number => {
  const storageKey = getCategoryStorageKey(categoryId);
  if (!storageKey) return 0;

  const today = getTodayString();
  return state.usageData[today]?.[storageKey]?.timeWatched || 0;
};

/**
 * Get total time watched today (for Mode 3: Total Time-Based Limit only)
 */
const getTotalTimeWatchedToday = (): number => {
  const today = getTodayString();
  return state.usageData[today]?.[TOTAL_TIME_CATEGORY_ID]?.timeWatched || 0;
};

/**
 * Refresh usage data from storage to ensure we have the latest values
 */
const refreshUsageData = async (): Promise<void> => {
  try {
    const usageData = await chrome.storage.local.get(USAGE_STORAGE_KEY);
    state.usageData = usageData[USAGE_STORAGE_KEY] || {};
  } catch (error) {
    console.error('[ProductiTube Limits] Failed to refresh usage data:', error);
  }
};

/**
 * Increment video count for a category
 */
const incrementVideoCount = async (categoryId: string): Promise<void> => {
  const storageKey = getCategoryStorageKey(categoryId);
  if (!storageKey) {
    console.error('[ProductiTube Limits] Cannot increment video count: category not found');
    return;
  }

  const today = getTodayString();

  if (!state.usageData[today]) {
    state.usageData[today] = {};
  }

  if (!state.usageData[today][storageKey]) {
    state.usageData[today][storageKey] = { videoCount: 0, timeWatched: 0 };
  }

  state.usageData[today][storageKey].videoCount += 1;
  await saveUsageData();
};

/**
 * Add time watched for a category (in minutes)
 */
const addTimeWatched = async (categoryId: string, minutes: number): Promise<void> => {
  const storageKey = getCategoryStorageKey(categoryId);
  if (!storageKey) {
    console.error('[ProductiTube Limits] Cannot add time watched: category not found');
    return;
  }

  const today = getTodayString();

  if (!state.usageData[today]) {
    state.usageData[today] = {};
  }

  if (!state.usageData[today][storageKey]) {
    state.usageData[today][storageKey] = { videoCount: 0, timeWatched: 0 };
  }

  state.usageData[today][storageKey].timeWatched += Math.round(minutes * 100) / 100;
  await saveUsageData();
};

/**
 * Add time to total daily usage
 */
const addTotalTimeWatched = async (minutes: number): Promise<void> => {
  const today = getTodayString();
  const totalCategoryId = TOTAL_TIME_CATEGORY_ID;

  if (!state.usageData[today]) {
    state.usageData[today] = {};
  }

  if (!state.usageData[today][totalCategoryId]) {
    state.usageData[today][totalCategoryId] = { videoCount: 0, timeWatched: 0 };
  }

  state.usageData[today][totalCategoryId].timeWatched += Math.round(minutes * 100) / 100;
  await saveUsageData();
};

/**
 * Reset total time usage data for today
 */
const resetTotalTimeUsage = async (): Promise<void> => {
  const today = getTodayString();

  if (state.usageData[today] && state.usageData[today][TOTAL_TIME_CATEGORY_ID]) {
    delete state.usageData[today][TOTAL_TIME_CATEGORY_ID];
    await saveUsageData();
  }
};

// ==================== CATEGORY-BASED TIME TRACKING ====================

/**
 * Start passive time tracking (no limit enforcement, used in video-count mode)
 */
const startTimeTrackingOnly = (categoryId: string): void => {
  if (state.timeTrackingInterval) {
    clearInterval(state.timeTrackingInterval);
  }

  state.selectedCategoryId = categoryId;
  state.videoStartTime = Date.now();
  state.wasVideoPaused = false;
  state.accumulatedTime = 0;

  state.timeTrackingInterval = window.setInterval(async () => {
    if (state.selectedCategoryId && state.videoStartTime) {
      const video = document.querySelector('video') as HTMLVideoElement;
      const isCurrentlyPaused = !video || video.paused;
      const isCurrentlyShowingAd = isAdPlaying();
      const shouldPauseTracking = isCurrentlyPaused || isCurrentlyShowingAd;

      if (state.wasVideoPaused && !shouldPauseTracking) {
        state.videoStartTime = Date.now();
        state.wasVideoPaused = false;
        return;
      }

      if (shouldPauseTracking) {
        if (!state.wasVideoPaused) {
          const elapsed =
            (Date.now() - state.videoStartTime) / (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE);
          if (elapsed >= MIN_TRACKING_TIME_MINUTES) {
            state.accumulatedTime += elapsed;
            await addTimeWatched(state.selectedCategoryId, elapsed);
          }
        }
        state.wasVideoPaused = true;
        return;
      }

      state.wasVideoPaused = false;
      const elapsed =
        (Date.now() - state.videoStartTime) / (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE);

      if (elapsed >= MIN_TRACKING_TIME_MINUTES) {
        state.accumulatedTime += elapsed;
        await addTimeWatched(state.selectedCategoryId, elapsed);
        state.videoStartTime = Date.now();
      }
    }
  }, TIME_TRACKING_INTERVAL_MS);
};

/**
 * Start time tracking for the current video (with limit enforcement)
 */
const startTimeTracking = (categoryId: string): void => {
  if (state.timeTrackingInterval) {
    clearInterval(state.timeTrackingInterval);
  }

  state.selectedCategoryId = categoryId;
  state.videoStartTime = Date.now();
  state.wasVideoPaused = false;
  state.accumulatedTime = 0;

  const setupPreciseLimit = () => {
    const currentTimeWatched = getTimeWatchedToday(categoryId);
    const activeMode = state.settings?.activeMode || 'time-category';
    const categories =
      activeMode === 'video-count' || activeMode === 'time-category'
        ? state.settings?.categories[activeMode] || []
        : [];
    const category = categories.find((cat: VideoCategory) => cat.id === categoryId);

    if (category) {
      const timeLimit = category.dailyTimeLimit || DEFAULT_TIME_LIMIT_MINUTES;
      const remainingTime = timeLimit - currentTimeWatched;

      if (remainingTime > 0) {
        const remainingMs = remainingTime * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

        const limitTimeoutId = window.setTimeout(async () => {
          if (!isVideoWatchPage() || state.selectedCategoryId !== categoryId) {
            return;
          }

          if (state.timeTrackingInterval) {
            clearInterval(state.timeTrackingInterval);
            state.timeTrackingInterval = null;
          }

          await addTimeWatched(categoryId, remainingTime);

          const video = document.querySelector('video') as HTMLVideoElement;
          if (video && !video.paused) {
            video.pause();
          }

          showLimitBlockingModal(category);

          state.selectedCategoryId = null;
          state.videoStartTime = null;
          state.wasVideoPaused = false;
          state.accumulatedTime = 0;
        }, remainingMs);

        trackTimeout(limitTimeoutId);
      } else {
        setTimeout(async () => {
          if (!isVideoWatchPage()) {
            return;
          }
          const video = document.querySelector('video') as HTMLVideoElement;
          if (video && !video.paused) {
            video.pause();
          }
          showLimitBlockingModal(category);
        }, QUICK_TIMEOUT_MS);
        return;
      }
    }
  };

  setupPreciseLimit();

  state.timeTrackingInterval = window.setInterval(async () => {
    if (state.selectedCategoryId && state.videoStartTime) {
      const video = document.querySelector('video') as HTMLVideoElement;
      const isCurrentlyPaused = !video || video.paused;
      const isCurrentlyShowingAd = isAdPlaying();

      const shouldPauseTracking = isCurrentlyPaused || isCurrentlyShowingAd;

      if (state.wasVideoPaused && !shouldPauseTracking) {
        state.videoStartTime = Date.now();
        state.wasVideoPaused = false;

        clearPendingTimeouts();
        setupPreciseLimit();
        return;
      }

      if (shouldPauseTracking) {
        if (!state.wasVideoPaused) {
          const elapsed =
            (Date.now() - state.videoStartTime) / (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE);
          if (elapsed >= MIN_TRACKING_TIME_MINUTES) {
            state.accumulatedTime += elapsed;
            await addTimeWatched(state.selectedCategoryId, elapsed);
          }
          clearPendingTimeouts();
        }
        state.wasVideoPaused = true;
        return;
      }

      state.wasVideoPaused = false;
      const elapsed =
        (Date.now() - state.videoStartTime) / (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE);

      if (elapsed >= MIN_TRACKING_TIME_MINUTES) {
        state.accumulatedTime += elapsed;
        await addTimeWatched(state.selectedCategoryId, elapsed);
        state.videoStartTime = Date.now();

        clearPendingTimeouts();
        setupPreciseLimit();
      }
    }
  }, TIME_TRACKING_INTERVAL_MS);
};

/**
 * Stop time tracking
 */
const stopTimeTracking = async (): Promise<void> => {
  clearPendingTimeouts();

  if (state.timeTrackingInterval) {
    clearInterval(state.timeTrackingInterval);
    state.timeTrackingInterval = null;
  }

  if (state.selectedCategoryId && state.videoStartTime && !state.wasVideoPaused) {
    const elapsed =
      (Date.now() - state.videoStartTime) / (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE);

    if (elapsed >= MIN_TRACKING_TIME_MINUTES) {
      state.accumulatedTime += elapsed;
      await addTimeWatched(state.selectedCategoryId, elapsed);
    }
  }

  state.selectedCategoryId = null;
  state.videoStartTime = null;
  state.wasVideoPaused = false;
  state.accumulatedTime = 0;
};

// ==================== TOTAL TIME TRACKING ====================

/**
 * Start passive total time tracking (no limit enforcement, used in category modes)
 */
const startTotalTimeTrackingOnly = (): void => {
  if (state.totalTimeTrackingInterval) {
    clearInterval(state.totalTimeTrackingInterval);
  }

  state.totalTimeStartTime = Date.now();
  state.totalTimeWasVideoPaused = false;
  state.totalTimeAccumulated = 0;

  state.totalTimeTrackingInterval = window.setInterval(async () => {
    if (state.totalTimeStartTime) {
      const video = document.querySelector('video') as HTMLVideoElement;
      const isCurrentlyPaused = !video || video.paused;
      const isCurrentlyShowingAd = isAdPlaying();
      const shouldPauseTracking = isCurrentlyPaused || isCurrentlyShowingAd;

      if (state.totalTimeWasVideoPaused && !shouldPauseTracking) {
        state.totalTimeStartTime = Date.now();
        state.totalTimeWasVideoPaused = false;
        return;
      }

      if (shouldPauseTracking) {
        if (!state.totalTimeWasVideoPaused) {
          const elapsed =
            (Date.now() - state.totalTimeStartTime) /
            (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE);
          if (elapsed >= MIN_TRACKING_TIME_MINUTES) {
            state.totalTimeAccumulated += elapsed;
            await addTotalTimeWatched(elapsed);
          }
        }
        state.totalTimeWasVideoPaused = true;
        return;
      }

      state.totalTimeWasVideoPaused = false;
      const elapsed =
        (Date.now() - state.totalTimeStartTime) / (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE);

      if (elapsed >= MIN_TRACKING_TIME_MINUTES) {
        state.totalTimeAccumulated += elapsed;
        await addTotalTimeWatched(elapsed);
        state.totalTimeStartTime = Date.now();
      }
    }
  }, TIME_TRACKING_INTERVAL_MS);
};

/**
 * Start total time tracking with limit enforcement (for time-total mode)
 */
const startTotalTimeTracking = (): void => {
  if (state.totalTimeTrackingInterval) {
    clearInterval(state.totalTimeTrackingInterval);
  }

  state.totalTimeStartTime = Date.now();
  state.totalTimeWasVideoPaused = false;
  state.totalTimeAccumulated = 0;

  const setupPreciseLimit = () => {
    const currentTimeWatched = getTotalTimeWatchedToday();
    const timeLimit = state.settings?.totalDailyTimeLimit || DEFAULT_TIME_LIMIT_MINUTES;
    const remainingTime = timeLimit - currentTimeWatched;

    if (remainingTime > 0) {
      const remainingMs = remainingTime * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

      const limitTimeoutId = window.setTimeout(async () => {
        if (!isVideoWatchPage() || !state.totalTimeStartTime) {
          return;
        }

        if (state.totalTimeTrackingInterval) {
          clearInterval(state.totalTimeTrackingInterval);
          state.totalTimeTrackingInterval = null;
        }

        await addTotalTimeWatched(remainingTime);

        const video = document.querySelector('video') as HTMLVideoElement;
        if (video && !video.paused) {
          video.pause();
        }

        showTotalTimeLimitReachedModal();

        state.totalTimeStartTime = null;
        state.totalTimeWasVideoPaused = false;
        state.totalTimeAccumulated = 0;
      }, remainingMs);

      trackTimeout(limitTimeoutId);
    } else {
      setTimeout(async () => {
        // Safeguard: Only show limit modal if still on video page
        if (!isVideoWatchPage()) {
          return;
        }
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video && !video.paused) {
          video.pause();
        }
        showTotalTimeLimitReachedModal();
      }, QUICK_TIMEOUT_MS);
      return;
    }
  };

  setupPreciseLimit();

  state.totalTimeTrackingInterval = window.setInterval(async () => {
    if (state.totalTimeStartTime) {
      const video = document.querySelector('video') as HTMLVideoElement;
      const isCurrentlyPaused = !video || video.paused;
      const isCurrentlyShowingAd = isAdPlaying();

      const shouldPauseTracking = isCurrentlyPaused || isCurrentlyShowingAd;

      if (state.totalTimeWasVideoPaused && !shouldPauseTracking) {
        state.totalTimeStartTime = Date.now();
        state.totalTimeWasVideoPaused = false;

        clearPendingTimeouts();
        setupPreciseLimit();
        return;
      }

      if (shouldPauseTracking) {
        if (!state.totalTimeWasVideoPaused) {
          const elapsed =
            (Date.now() - state.totalTimeStartTime) /
            (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE);
          if (elapsed >= MIN_TRACKING_TIME_MINUTES) {
            state.totalTimeAccumulated += elapsed;
            await addTotalTimeWatched(elapsed);
          }
          clearPendingTimeouts();
        }
        state.totalTimeWasVideoPaused = true;
        return;
      }

      state.totalTimeWasVideoPaused = false;
      const elapsed =
        (Date.now() - state.totalTimeStartTime) / (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE);

      if (elapsed >= MIN_TRACKING_TIME_MINUTES) {
        state.totalTimeAccumulated += elapsed;
        await addTotalTimeWatched(elapsed);
        state.totalTimeStartTime = Date.now();

        clearPendingTimeouts();
        setupPreciseLimit();
      }
    }
  }, TIME_TRACKING_INTERVAL_MS);
};

/**
 * Stop total time tracking
 */
const stopTotalTimeTracking = async (): Promise<void> => {
  clearPendingTimeouts();

  if (state.totalTimeTrackingInterval) {
    clearInterval(state.totalTimeTrackingInterval);
    state.totalTimeTrackingInterval = null;
  }

  if (state.totalTimeStartTime && !state.totalTimeWasVideoPaused) {
    const elapsed =
      (Date.now() - state.totalTimeStartTime) / (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE);

    if (elapsed >= MIN_TRACKING_TIME_MINUTES) {
      state.totalTimeAccumulated += elapsed;
      await addTotalTimeWatched(elapsed);
    }
  }

  state.totalTimeStartTime = null;
  state.totalTimeWasVideoPaused = false;
  state.totalTimeAccumulated = 0;
};

// ==================== MODAL FUNCTIONS ====================
/**
 * Create and show the category selection modal
 */
const createCategoryModal = (): HTMLElement => {
  removeModal();

  const modal = document.createElement('div');
  modal.id = MODAL_ID;
  modal.className = MODAL_OVERLAY_CLASS;

  const activeMode = state.settings?.activeMode || 'video-count';
  const categories =
    activeMode === 'video-count' || activeMode === 'time-category'
      ? state.settings?.categories[activeMode] || []
      : [];
  const activeCategories = categories.filter((cat: VideoCategory) => cat.isActive);

  const isTimeMode = activeMode === 'time-category';

  modal.innerHTML = `
    <div class="productitube-modal-content">
      <div class="productitube-modal-header">
        <div class="productitube-header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7z" fill="white"/>
          </svg>
        </div>
        <div class="productitube-header-text">
          <h3>Categorize this video</h3>
          <p>Select a category for this video, then click Continue to start watching.</p>
        </div>
      </div>
      
      <div class="productitube-modal-body">
        <div class="productitube-countdown-timer">
          <div class="productitube-countdown-container">
            <div class="productitube-countdown-icon-wrapper">
              <div class="productitube-countdown-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="m12 6 0 6 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <div class="productitube-countdown-pulse"></div>
              </div>
            </div>
            <div class="productitube-countdown-content">
              <div class="productitube-countdown-label">Limits reset in</div>
              <div class="productitube-countdown-display">
                <div id="productitube-countdown-time" class="productitube-countdown-time">
                  <span class="productitube-time-segment">
                    <span class="productitube-time-value">--</span>
                    <span class="productitube-time-unit">h</span>
                  </span>
                  <span class="productitube-time-separator">:</span>
                  <span class="productitube-time-segment">
                    <span class="productitube-time-value">--</span>
                    <span class="productitube-time-unit">m</span>
                  </span>
                  <span class="productitube-time-separator">:</span>
                  <span class="productitube-time-segment">
                    <span class="productitube-time-value">--</span>
                    <span class="productitube-time-unit">s</span>
                  </span>
                </div>
                <div class="productitube-countdown-progress">
                  <div class="productitube-progress-bar">
                    <div id="productitube-progress-fill" class="productitube-progress-fill"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="productitube-category-grid">
          ${activeCategories
            .map((category: VideoCategory) => {
              let usedValue, limitValue, isLimitReached, remaining, remainingText;

              if (isTimeMode) {
                usedValue = getTimeWatchedToday(category.id);
                limitValue = category.dailyTimeLimit || 60;
                isLimitReached = usedValue >= limitValue;
                remaining = limitValue - usedValue;
                remainingText = isLimitReached ? 'Time reached' : `${formatTime(remaining)} left`;
              } else {
                usedValue = getVideosWatchedToday(category.id);
                limitValue = category.dailyLimitCount;
                isLimitReached = usedValue >= limitValue;
                remaining = limitValue - usedValue;
                remainingText = isLimitReached ? 'Limit reached' : `${remaining} left`;
              }

              return `
              <button 
                class="productitube-category-option ${isLimitReached ? 'limit-reached' : ''}" 
                data-category-id="${category.id}"
                data-category-name="${category.name}"
                ${isLimitReached ? 'disabled' : ''}
              >
                <div class="productitube-category-color-wrapper">
                  <div class="productitube-category-color" style="background-color: ${category.color}"></div>
                </div>
                <div class="productitube-category-info">
                  <div class="productitube-category-name">${category.name}</div>
                  <div class="productitube-category-stats">
                    <span class="productitube-category-count">
                      ${isTimeMode ? `${formatTime(usedValue)}/${formatTime(limitValue)}` : `${usedValue}/${limitValue} videos`}
                    </span>
                    <span class="productitube-category-badge ${isLimitReached ? 'limit-reached' : 'remaining'}">
                      ${remainingText}
                    </span>
                  </div>
                </div>
                <div class="productitube-check-icon" style="display: none;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17l-5-5" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </button>
            `;
            })
            .join('')}
        </div>
        
        ${
          activeCategories.length === 0
            ? `
          <div class="productitube-no-categories">
            <div class="productitube-no-categories-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#9ca3af" stroke-width="2"/>
                <path d="m9 9 6 6" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="m15 9-6 6" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p><strong>No active categories found</strong></p>
            <p>Please set up categories in the extension popup.</p>
          </div>
        `
            : ''
        }
      </div>
      
      <div class="productitube-modal-footer">
       <button id="productitube-home-btn" class="productitube-btn-secondary">
          Go to Home Feed
        </button>
        <button id="productitube-continue-btn" class="productitube-btn-primary" disabled>
          Continue
        </button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes productitube-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes productitube-scale-in {
      from { 
        opacity: 0; 
        transform: scale(0.95) translateY(10px); 
      }
      to { 
        opacity: 1; 
        transform: scale(1) translateY(0); 
      }
    }

    @keyframes productitube-pulse {
      0%, 100% { 
        opacity: 0.4; 
        transform: scale(1); 
      }
      50% { 
        opacity: 0.8; 
        transform: scale(1.1); 
      }
    }

    @keyframes productitube-countdown-glow {
      0%, 100% { 
        box-shadow: 0 0 5px rgba(239, 68, 68, 0.3); 
      }
      50% { 
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.4); 
      }
    }

    @keyframes productitube-digit-flip {
      0% { transform: rotateX(0deg); }
      50% { transform: rotateX(-90deg); }
      100% { transform: rotateX(0deg); }
    }

    @keyframes productitube-progress-pulse {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }
    
    .productitube-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'YouTube Noto', Roboto, Arial, Helvetica, sans-serif;
      animation: productitube-fade-in 0.3s ease-out;
      padding: clamp(8px, 2vw, 24px);
      box-sizing: border-box;
    }
    
    .productitube-modal-content {
      background: white;
      border-radius: clamp(12px, 2vw, 16px);
      width: 100%;
      max-width: min(90vw, 600px);
      max-height: min(90vh, 700px);
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      animation: productitube-scale-in 0.3s ease-out;
      display: flex;
      flex-direction: column;
    }
    
    .productitube-modal-header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      padding: clamp(16px, 3vw, 24px);
      display: flex;
      align-items: center;
      gap: clamp(12px, 2vw, 16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }
    
    .productitube-header-icon {
      width: clamp(32px, 5vw, 40px);
      height: clamp(32px, 5vw, 40px);
      background: rgba(255, 255, 255, 0.2);
      border-radius: clamp(8px, 1.5vw, 12px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .productitube-header-text h3 {
      margin: 0 0 4px 0;
      font-size: clamp(16px, 3vw, 20px);
      font-weight: 600;
      color: white;
      line-height: 1.2;
    }
    
    .productitube-header-text p {
      margin: 0;
      font-size: clamp(12px, 2vw, 14px);
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.4;
    }
    
    .productitube-modal-body {
      padding: clamp(16px, 3vw, 24px);
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
    
    .productitube-countdown-timer {
      background: linear-gradient(135deg, #fef7f7 0%, #fef2f2 50%, #fef7f7 100%);
      border: 2px solid #fecaca;
      border-radius: clamp(12px, 2vw, 16px);
      padding: clamp(16px, 3vw, 20px);
      margin-bottom: clamp(20px, 3vw, 24px);
      position: relative;
      overflow: hidden;
      animation: productitube-countdown-glow 3s ease-in-out infinite;
    }

    .productitube-countdown-timer::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1), transparent);
      animation: productitube-shimmer 3s ease-in-out infinite;
    }

    @keyframes productitube-shimmer {
      0% { left: -100%; }
      50% { left: 100%; }
      100% { left: 100%; }
    }
    
    .productitube-countdown-container {
      display: flex;
      align-items: center;
      gap: clamp(16px, 3vw, 20px);
      position: relative;
      z-index: 1;
    }
    
    .productitube-countdown-icon-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .productitube-countdown-icon {
      width: clamp(40px, 6vw, 48px);
      height: clamp(40px, 6vw, 48px);
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      position: relative;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .productitube-countdown-pulse {
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border: 2px solid #ef4444;
      border-radius: 50%;
      animation: productitube-pulse 2s ease-in-out infinite;
    }
    
    .productitube-countdown-content {
      flex: 1;
      min-width: 0;
    }
    
    .productitube-countdown-label {
      font-size: clamp(11px, 1.8vw, 13px);
      color: #7f1d1d;
      font-weight: 600;
      margin-bottom: clamp(6px, 1vw, 8px);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .productitube-countdown-display {
      display: flex;
      flex-direction: column;
      gap: clamp(8px, 1.5vw, 10px);
    }

    .productitube-countdown-time {
      display: flex;
      align-items: center;
      gap: clamp(2px, 0.5vw, 4px);
      font-family: 'Courier New', 'Monaco', monospace;
    }

    .productitube-time-segment {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid #e2e8f0;
      border-radius: clamp(6px, 1vw, 8px);
      padding: clamp(4px, 0.8vw, 6px) clamp(6px, 1vw, 8px);
      min-width: clamp(32px, 5vw, 40px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }

    .productitube-time-segment::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .productitube-time-segment:hover::before {
      opacity: 1;
    }

    .productitube-time-value {
      font-size: clamp(16px, 3vw, 20px);
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
      animation: productitube-digit-flip 0.6s ease-in-out;
    }

    .productitube-time-unit {
      font-size: clamp(8px, 1.2vw, 10px);
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }

    .productitube-time-separator {
      font-size: clamp(14px, 2.5vw, 18px);
      color: #ef4444;
      font-weight: 700;
      animation: productitube-pulse 1s ease-in-out infinite;
      margin: 0 clamp(2px, 0.5vw, 4px);
    }

    .productitube-countdown-progress {
      width: 100%;
    }

    .productitube-progress-bar {
      width: 100%;
      height: clamp(4px, 0.8vw, 6px);
      background: rgba(239, 68, 68, 0.1);
      border-radius: clamp(2px, 0.4vw, 3px);
      overflow: hidden;
      position: relative;
    }

    .productitube-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%);
      border-radius: clamp(2px, 0.4vw, 3px);
      transition: width 1s ease-out;
      animation: productitube-progress-pulse 2s ease-in-out infinite;
      position: relative;
      overflow: hidden;
    }

    .productitube-progress-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: productitube-shimmer 2s ease-in-out infinite;
    }

    /* Red scrollbar styling for modal */
    .productitube-modal-overlay *::-webkit-scrollbar {
      width: 6px !important;
    }
    
    .productitube-modal-overlay *::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1) !important;
      border-radius: 10px !important;
    }
    
    .productitube-modal-overlay *::-webkit-scrollbar-thumb {
      background: red !important;
      border-radius: 10px !important;
    }
    
    .productitube-modal-overlay *::-webkit-scrollbar-thumb:hover {
      background: rgb(200, 30, 30) !important;
    }
    
    .productitube-category-grid {
      display: grid;
      gap: clamp(8px, 1.5vw, 12px);
      grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
    }
    
    @media (min-width: 640px) {
      .productitube-category-grid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }
    }
    
    @media (max-width: 480px) {
      .productitube-category-grid {
        grid-template-columns: 1fr;
      }
      
      .productitube-modal-content {
        max-width: 95vw;
        max-height: 95vh;
      }
      
      .productitube-modal-overlay {
        padding: 8px;
      }
    }
    
    .productitube-category-option {
      display: flex;
      align-items: center;
      gap: clamp(12px, 2vw, 16px);
      padding: clamp(12px, 2.5vw, 16px);
      border: 2px solid #e2e8f0;
      border-radius: clamp(8px, 1.5vw, 12px);
      background: white;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: left;
      width: 100%;
      position: relative;
      overflow: hidden;
      min-height: clamp(60px, 8vw, 72px);
    }
    
    .productitube-category-option::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .productitube-category-option:hover:not(:disabled)::before {
      opacity: 1;
    }
    
    .productitube-category-option:hover:not(:disabled) {
      border-color: #ef4444;
      transform: translateY(-1px);
      box-shadow: 0 8px 25px -8px rgba(239, 68, 68, 0.3);
    }
    
    .productitube-category-option:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: #f8fafc;
      border-color: #e2e8f0;
    }
    
    .productitube-category-option.limit-reached {
      border-color: #fca5a5;
      background: #fef2f2;
    }
    
    .productitube-category-option.selected {
      border-color: #ef4444;
      background: #fef2f2;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      transform: translateY(-1px);
    }
    
    .productitube-category-option.selected .productitube-check-icon {
      display: block !important;
    }
    
    .productitube-category-color-wrapper {
      position: relative;
    }
    
    .productitube-category-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 1), 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .productitube-category-info {
      flex: 1;
      min-width: 0;
    }
    
    .productitube-category-name {
      font-weight: 600;
      font-size: clamp(13px, 2.2vw, 15px);
      color: #1e293b;
      margin-bottom: 4px;
      line-height: 1.3;
    }
    
    .productitube-category-stats {
      display: flex;
      align-items: center;
      gap: clamp(6px, 1vw, 8px);
      flex-wrap: wrap;
    }
    
    .productitube-category-count {
      font-size: clamp(11px, 1.8vw, 13px);
      color: #64748b;
      font-weight: 500;
    }
    
    .productitube-category-badge {
      font-size: clamp(9px, 1.5vw, 11px);
      font-weight: 600;
      padding: clamp(2px, 0.5vw, 3px) clamp(6px, 1vw, 8px);
      border-radius: clamp(8px, 1.5vw, 12px);
      text-transform: uppercase;
      letter-spacing: 0.025em;
      white-space: nowrap;
    }
    
    .productitube-category-badge.remaining {
      background: #dcfce7;
      color: #166534;
    }
    
    .productitube-category-badge.limit-reached {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .productitube-check-icon {
      flex-shrink: 0;
    }
    
    .productitube-no-categories {
      text-align: center;
      padding: clamp(32px, 6vw, 48px) clamp(16px, 3vw, 24px);
      color: #64748b;
    }
    
    .productitube-no-categories-icon {
      margin-bottom: clamp(12px, 2vw, 16px);
    }
    
    .productitube-no-categories p {
      margin: 0 0 clamp(6px, 1vw, 8px) 0;
      font-size: clamp(12px, 2vw, 14px);
      line-height: 1.5;
    }
    
    .productitube-no-categories p:first-of-type {
      color: #374151;
      font-weight: 600;
    }
    
    .productitube-modal-footer {
      padding: clamp(16px, 2.5vw, 20px) clamp(16px, 3vw, 24px) clamp(20px, 3vw, 24px);
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: center;
      background: #fafafa;
      gap: 12px;
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .productitube-btn-secondary {
      padding: 12px 24px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      color: #475569;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .productitube-btn-secondary::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(71, 85, 105, 0.05) 0%, rgba(71, 85, 105, 0.02) 100%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .productitube-btn-secondary:hover::before {
      opacity: 1;
    }

    .productitube-btn-secondary:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .productitube-btn-secondary:active {
      transform: translateY(0);
    }

    .productitube-btn-primary {
      padding: clamp(10px, 1.8vw, 12px) clamp(24px, 4vw, 32px);
      border: none;
      border-radius: clamp(6px, 1vw, 8px);
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      font-size: clamp(12px, 2vw, 14px);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      position: relative;
      overflow: hidden;
      min-width: clamp(100px, 20vw, 140px);
      max-width: 100%;
    }
    
    .productitube-btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .productitube-btn-primary:hover:not(:disabled)::before {
      opacity: 1;
    }
    
    .productitube-btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
    }
    
    .productitube-btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }
    
    .productitube-btn-primary:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
    
    .productitube-btn-primary:disabled::before {
      display: none;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(modal);

  setTimeout(() => {
    const additionalScrollbarStyle = document.createElement('style');
    additionalScrollbarStyle.id = 'productitube-scrollbar-override';
    additionalScrollbarStyle.textContent = `
      .productitube-modal-overlay *::-webkit-scrollbar {
        width: 6px !important;
      }
      
      .productitube-modal-overlay *::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1) !important;
        border-radius: 10px !important;
      }
      
      .productitube-modal-overlay *::-webkit-scrollbar-thumb {
        background: red !important;
        border-radius: 10px !important;
      }
      
      .productitube-modal-overlay *::-webkit-scrollbar-thumb:hover {
        background: rgb(200, 30, 30) !important;
      }
    `;

    const existing = document.getElementById('productitube-scrollbar-override');
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(additionalScrollbarStyle);

    const modalBody = modal.querySelector('.productitube-modal-body') as HTMLElement;
    if (modalBody) {
      modalBody.style.setProperty('scrollbar-width', 'thin');
      modalBody.style.setProperty('scrollbar-color', 'red rgba(0, 0, 0, 0.1)');
    }
  }, 100);

  let selectedCategoryId: string | null = null;
  let countdownInterval: number | null = null;

  const updateCountdown = () => {
    const { hours, minutes, seconds, totalMs } = getTimeUntilMidnight();
    const countdownElement = modal.querySelector(`#${COUNTDOWN_TIME_ID}`);
    const progressFill = modal.querySelector(`#${PROGRESS_FILL_ID}`) as HTMLElement;

    if (countdownElement) {
      const timeSegments = countdownElement.querySelectorAll('.productitube-time-value');
      const newValues =
        hours > 0
          ? [
              hours.toString().padStart(2, '0'),
              minutes.toString().padStart(2, '0'),
              seconds.toString().padStart(2, '0'),
            ]
          : ['00', minutes.toString().padStart(2, '0'), seconds.toString().padStart(2, '0')];

      if (timeSegments && timeSegments.length > 0) {
        timeSegments.forEach((segment, index) => {
          const htmlSegment = segment as HTMLElement;
          if (segment && htmlSegment && segment.textContent !== newValues[index]) {
            htmlSegment.style.animation = 'none';
            htmlSegment.offsetHeight;
            htmlSegment.style.animation = 'productitube-digit-flip 0.6s ease-in-out';
            segment.textContent = newValues[index];
          }
        });
      }

      const hourSegment = countdownElement.querySelector(
        '.productitube-time-segment:first-child'
      ) as HTMLElement;
      const firstSeparator = countdownElement.querySelector(
        '.productitube-time-separator:first-of-type'
      ) as HTMLElement;

      if (hourSegment && firstSeparator) {
        if (hours === 0) {
          hourSegment.style.display = 'none';
          firstSeparator.style.display = 'none';
        } else {
          hourSegment.style.display = 'flex';
          firstSeparator.style.display = 'block';
        }
      }
    }

    if (progressFill) {
      const totalDayMs = TOTAL_DAY_MS;
      const elapsedMs = totalDayMs - totalMs;
      const progressPercent = (elapsedMs / totalDayMs) * 100;
      progressFill.style.width = `${Math.max(0, Math.min(100, progressPercent))}%`;
    }
  };

  updateCountdown();

  countdownInterval = window.setInterval(updateCountdown, COUNTDOWN_UPDATE_INTERVAL_MS);

  (modal as HTMLElement & { __countdownInterval?: number }).__countdownInterval = countdownInterval;

  const categoryButtons = modal.querySelectorAll('.productitube-category-option:not(:disabled)');
  categoryButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      const categoryId = (e.currentTarget as HTMLElement).dataset.categoryId;
      if (categoryId) {
        modal.querySelectorAll(`.${CATEGORY_OPTION_CLASS}`).forEach((btn) => {
          btn.classList.remove(CATEGORY_SELECTED_CLASS);
        });
        (e.currentTarget as HTMLElement).classList.add(CATEGORY_SELECTED_CLASS);
        selectedCategoryId = categoryId;

        const continueBtn = modal.querySelector(`#${CONTINUE_BUTTON_ID}`) as HTMLButtonElement;
        if (continueBtn) {
          continueBtn.disabled = false;
        }
      }
    });
  });

  const continueButton = modal.querySelector(`#${CONTINUE_BUTTON_ID}`) as HTMLButtonElement;
  continueButton?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedCategoryId) {
      return;
    }

    if (continueButton) {
      continueButton.disabled = true;
      continueButton.textContent = FEATURE_LABELS.PROCESSING;
    }

    const failsafeTimeout = setTimeout(() => {
      if (continueButton && continueButton.disabled) {
        continueButton.disabled = false;
        continueButton.textContent = 'Continue';
      }
    }, FAILSAFE_TIMEOUT_MS);

    try {
      await handleCategorySelection(selectedCategoryId);
      clearTimeout(failsafeTimeout);
    } catch (error) {
      console.error('[ProductiTube Limits] Error handling category selection:', error);
      clearTimeout(failsafeTimeout);

      if (continueButton) {
        continueButton.disabled = false;
        continueButton.textContent = 'Continue';
      }
    }
  });

  const homeButton = modal.querySelector(`#${HOME_BUTTON_ID}`);
  homeButton?.addEventListener('click', () => {
    window.location.href = YOUTUBE_HOME_URL;
  });

  return modal;
};

/**
 * Handle category selection
 */
const handleCategorySelection = async (categoryId: string): Promise<void> => {
  const modalExists = !!document.getElementById('productitube-category-modal');
  if (!modalExists) {
    return;
  }

  if (!state.isModalVisible && !state.isProcessingVideo) {
    return;
  }

  const activeMode = state.settings?.activeMode || 'video-count';

  const categories =
    activeMode === 'video-count' || activeMode === 'time-category'
      ? state.settings?.categories[activeMode] || []
      : [];
  const category = categories.find((cat: VideoCategory) => cat.id === categoryId);

  if (!category) {
    console.error('[ProductiTube Limits] Category not found:', categoryId);
    return;
  }

  state.isModalVisible = false;

  try {
    const isTimeMode = activeMode === 'time-category';

    // Track all metrics: video count, category time, and total time (only active mode enforces limits)
    if (isTimeMode) {
      await incrementVideoCount(categoryId);
      startTimeTracking(categoryId);
      startTotalTimeTrackingOnly();

      const timeWatched = getTimeWatchedToday(categoryId);
      const timeLimit = category.dailyTimeLimit || 60;
      const hasReachedLimit = timeWatched >= timeLimit;

      if (hasReachedLimit) {
        showLimitReachedMessage(category);
      } else {
        resumeVideo();
        removeModalOnly();
      }
    } else {
      await incrementVideoCount(categoryId);
      startTimeTrackingOnly(categoryId);
      startTotalTimeTrackingOnly();

      const newCount = getVideosWatchedToday(categoryId);
      const hasReachedLimit = newCount >= category.dailyLimitCount;

      if (hasReachedLimit) {
        showLimitReachedMessage(category);
      } else {
        resumeVideo();
        removeModalOnly();
      }
    }
  } catch (error) {
    console.error('[ProductiTube Limits] Error in category selection:', error);

    state.isModalVisible = true;
    throw error;
  }
};

/**
 * Show blocking modal when time limit is reached during video playback
 */
const showLimitBlockingModal = (category: VideoCategory): void => {
  removeModal();

  const message = document.createElement('div');
  message.className = LIMIT_BLOCKING_MESSAGE_CLASS;
  message.innerHTML = `
    <div class="productitube-limit-blocking-content">
      <div class="productitube-limit-icon warning">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2"/>
          <path d="m15 9-6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="m9 9 6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3>Time Limit Reached</h3>
      <div class="productitube-limit-text">
        <p>You've reached your daily time limit for the <strong>${category.name}</strong> category.</p>
        <p>Time to take a break and explore other activities!</p>
      </div>
      <div class="productitube-limit-actions">
        <button id="productitube-home-btn" class="productitube-btn-primary">Go to Home Feed</button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .productitube-limit-blocking-message {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
      font-family: 'YouTube Noto', Roboto, Arial, Helvetica, sans-serif;
      animation: productitube-fade-in 0.3s ease-out;
      padding: 16px;
    }
    
    .productitube-limit-blocking-content {
      background: white;
      border-radius: 20px;
      padding: 40px 32px 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      animation: productitube-scale-in 0.3s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .productitube-limit-icon.warning {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    }
    
    .productitube-limit-blocking-content h3 {
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 700;
      color: #dc2626;
      line-height: 1.2;
    }
    
    .productitube-limit-text {
      margin-bottom: 28px;
    }
    
    .productitube-limit-blocking-content p {
      margin: 0 0 12px 0;
      font-size: 15px;
      color: #64748b;
      line-height: 1.5;
    }
    
    .productitube-limit-blocking-content p:last-child {
      margin-bottom: 0;
    }
    
    .productitube-limit-blocking-content strong {
      color: #1e293b;
      font-weight: 600;
    }
    
    .productitube-limit-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    
    .productitube-btn-primary {
      padding: 12px 28px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    
    .productitube-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
    }
    
    .productitube-btn-primary:active {
      transform: translateY(0);
    }
    
    .productitube-btn-secondary {
      padding: 12px 24px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      color: #475569;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .productitube-btn-secondary:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .productitube-btn-secondary:active {
      transform: translateY(0);
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(message);

  const homeButton = message.querySelector('#productitube-home-btn');
  homeButton?.addEventListener('click', () => {
    window.location.href = '/';
  });
};

/**
 * Show limit reached message (when user reaches limit after selecting category)
 */
const showLimitReachedMessage = (category: VideoCategory): void => {
  removeModal();

  const activeMode = state.settings?.activeMode || 'video-count';
  const isTimeMode = activeMode === 'time-category';

  const message = document.createElement('div');
  message.className = LIMIT_MESSAGE_CLASS;
  message.innerHTML = `
    <div class="productitube-limit-content">
      <div class="productitube-limit-icon success">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="m9 11 3 3L22 4" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3>Enjoy this video!</h3>
      <div class="productitube-limit-text">
        <p>This video has been ${isTimeMode ? 'added to your watch time' : 'counted'} for your <strong>${category.name}</strong> category.</p>
        <p>You've now reached your daily ${isTimeMode ? 'time' : 'video'} limit for this category.</p>
      </div>
      <button id="productitube-limit-ok" class="productitube-btn-primary">Start Watching</button>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .productitube-limit-message {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      font-family: 'YouTube Noto', Roboto, Arial, Helvetica, sans-serif;
      animation: productitube-fade-in 0.3s ease-out;
      padding: 16px;
    }
    
    .productitube-limit-content {
      background: white;
      border-radius: 20px;
      padding: 40px 32px 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      animation: productitube-scale-in 0.3s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .productitube-limit-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .productitube-limit-icon.success {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    }
    
    .productitube-limit-content h3 {
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
    }
    
    .productitube-limit-text {
      margin-bottom: 28px;
    }
    
    .productitube-limit-content p {
      margin: 0 0 12px 0;
      font-size: 15px;
      color: #64748b;
      line-height: 1.5;
    }
    
    .productitube-limit-content p:last-child {
      margin-bottom: 0;
    }
    
    .productitube-limit-content strong {
      color: #1e293b;
      font-weight: 600;
    }
    
    .productitube-btn-primary {
      padding: 12px 28px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    
    .productitube-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
    }
    
    .productitube-btn-primary:active {
      transform: translateY(0);
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(message);

  const okButton = message.querySelector(`#${LIMIT_OK_BUTTON_ID}`);
  okButton?.addEventListener('click', () => {
    resumeVideo();
    if (message.parentNode) {
      message.parentNode.removeChild(message);
    }
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  });
};

/**
 * Show total time limit reached modal
 */
const showTotalTimeLimitReachedModal = (): void => {
  removeModal();

  const timeWatched = getTotalTimeWatchedToday();

  const message = document.createElement('div');
  message.className = LIMIT_BLOCKING_MESSAGE_CLASS;
  message.innerHTML = `
    <div class="productitube-limit-blocking-content">
      <div class="productitube-limit-icon warning">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2"/>
          <path d="m15 9-6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="m9 9 6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3>That's a wrap for today!</h3>
      <div class="productitube-limit-text">
        <p>You've watched <strong>${formatTime(timeWatched)}</strong> of YouTube today.</p>
        <p>Time to explore the world beyond the screen! 🌟</p>
      </div>
      <div class="productitube-limit-actions">
        <button id="productitube-home-btn" class="productitube-btn-primary">Go to Home Feed</button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .productitube-limit-blocking-message {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
      font-family: 'YouTube Noto', Roboto, Arial, Helvetica, sans-serif;
      animation: productitube-fade-in 0.3s ease-out;
      padding: 16px;
    }
    
    .productitube-limit-blocking-content {
      background: white;
      border-radius: 20px;
      padding: 40px 32px 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      animation: productitube-scale-in 0.3s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .productitube-limit-icon.warning {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    }
    
    .productitube-limit-blocking-content h3 {
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 700;
      color: #dc2626;
      line-height: 1.2;
    }
    
    .productitube-limit-text {
      margin-bottom: 28px;
    }
    
    .productitube-limit-blocking-content p {
      margin: 0 0 12px 0;
      font-size: 15px;
      color: #64748b;
      line-height: 1.5;
    }
    
    .productitube-limit-blocking-content p:last-child {
      margin-bottom: 0;
    }
    
    .productitube-limit-blocking-content strong {
      color: #1e293b;
      font-weight: 600;
    }
    
    .productitube-limit-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    
    .productitube-btn-primary {
      padding: 12px 28px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    
    .productitube-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
    }
    
    .productitube-btn-primary:active {
      transform: translateY(0);
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(message);

  const homeButton = message.querySelector('#productitube-home-btn');
  homeButton?.addEventListener('click', () => {
    window.location.href = '/';
  });
};

/**
 * Remove modal from DOM without stopping time tracking
 */
const removeModalOnly = (): void => {
  const existingModal = document.getElementById('productitube-category-modal');
  if (existingModal) {
    const intervalId = (existingModal as HTMLElement & { __countdownInterval?: number })
      .__countdownInterval;
    if (intervalId) {
      clearInterval(intervalId);
    }
  }

  if (state.modalElement && state.modalElement.parentNode) {
    state.modalElement.parentNode.removeChild(state.modalElement);
    state.modalElement = null;
  }

  if (existingModal && existingModal.parentNode) {
    existingModal.parentNode.removeChild(existingModal);
  }

  const existingStyles = document.querySelectorAll('style');
  existingStyles.forEach((style) => {
    if (
      style.textContent?.includes('productitube-modal-overlay') ||
      style.textContent?.includes('productitube-limit-message') ||
      style.textContent?.includes('productitube-limit-blocking-message')
    ) {
      style.remove();
    }
  });

  const existingBlockingModal = document.querySelector('.productitube-limit-blocking-message');
  if (existingBlockingModal && existingBlockingModal.parentNode) {
    existingBlockingModal.parentNode.removeChild(existingBlockingModal);
  }

  const scrollbarOverride = document.getElementById(SCROLLBAR_OVERRIDE_ID);
  if (scrollbarOverride) {
    scrollbarOverride.remove();
  }

  clearPendingTimeouts();
  state.isProcessingVideo = false;
  state.isModalVisible = false;
  state.currentVideoUrl = null;
};

/**
 * Remove modal from DOM
 */
const removeModal = (): void => {
  const existingModal = document.getElementById('productitube-category-modal');
  if (existingModal) {
    const intervalId = (existingModal as HTMLElement & { __countdownInterval?: number })
      .__countdownInterval;
    if (intervalId) {
      clearInterval(intervalId);
    }
  }

  if (state.modalElement && state.modalElement.parentNode) {
    state.modalElement.parentNode.removeChild(state.modalElement);
    state.modalElement = null;
  }

  if (existingModal && existingModal.parentNode) {
    existingModal.parentNode.removeChild(existingModal);
  }

  const existingStyles = document.querySelectorAll('style');
  existingStyles.forEach((style) => {
    if (
      style.textContent?.includes('productitube-modal-overlay') ||
      style.textContent?.includes('productitube-limit-message') ||
      style.textContent?.includes('productitube-limit-blocking-message')
    ) {
      style.remove();
    }
  });

  const existingBlockingModal = document.querySelector('.productitube-limit-blocking-message');
  if (existingBlockingModal && existingBlockingModal.parentNode) {
    existingBlockingModal.parentNode.removeChild(existingBlockingModal);
  }

  const scrollbarOverride = document.getElementById(SCROLLBAR_OVERRIDE_ID);
  if (scrollbarOverride) {
    scrollbarOverride.remove();
  }

  resetProcessingState();
};

// ==================== VIDEO CONTROL ====================
/**
 * Pause the current video
 */
const pauseVideo = (): void => {
  const video = document.querySelector('video') as HTMLVideoElement;
  if (video && !video.paused) {
    video.pause();
    state.videoElement = video;
  }
};

/**
 * Resume the current video
 */
const resumeVideo = (): void => {
  if (state.videoElement && state.videoElement.paused) {
    state.videoElement.play();
  }
  state.videoElement = null;
  state.isProcessingVideo = false;
};

// ==================== MAIN LOGIC ====================
/**
 * Handle video load event
 */
const handleVideoLoad = async (): Promise<void> => {
  const currentUrl = getCurrentVideoUrl();

  if (!isVideoWatchPage() || state.isProcessingVideo || state.currentVideoUrl === currentUrl) {
    return;
  }

  clearPendingTimeouts();

  state.isProcessingVideo = true;
  state.currentVideoUrl = currentUrl;

  try {
    await loadData();

    const activeMode = state.settings?.activeMode;

    if (!state.settings?.isLimitsEnabled) {
      resetProcessingState();
      return;
    }

    if (activeMode === 'time-total') {
      await refreshUsageData();

      const timeLimit = state.settings?.totalDailyTimeLimit || 60;
      const timeWatched = getTotalTimeWatchedToday();

      if (timeWatched >= timeLimit) {
        let modalShown = false;
        let blockedVideo: HTMLVideoElement | null = null;

        const playBlocker = () => {
          if (blockedVideo && !blockedVideo.paused) {
            blockedVideo.pause();
          }
        };

        const blockVideo = () => {
          const video = document.querySelector('video') as HTMLVideoElement;
          if (video) {
            if (video !== blockedVideo) {
              if (blockedVideo) {
                blockedVideo.removeEventListener('play', playBlocker);
              }
              blockedVideo = video;
              video.addEventListener('play', playBlocker);
            }
            if (!video.paused) {
              video.pause();
            }
            if (video.readyState >= 1 && !modalShown) {
              modalShown = true;
              video.removeEventListener('play', playBlocker);
              showTotalTimeLimitReachedModal();
              return true;
            }
          }
          return false;
        };

        if (!blockVideo()) {
          const waitForVideo = () => {
            if (!blockVideo()) {
              if (state.currentVideoUrl === currentUrl && state.isProcessingVideo) {
                const timeoutId = window.setTimeout(waitForVideo, VIDEO_WAIT_TIMEOUT_MS);
                trackTimeout(timeoutId);
              }
            }
          };

          const initialTimeoutId = window.setTimeout(waitForVideo, INITIAL_VIDEO_WAIT_MS);
          trackTimeout(initialTimeoutId);
        }
        return;
      }

      const waitForVideo = () => {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video && video.readyState >= 1) {
          startTotalTimeTracking();
          state.isProcessingVideo = false;
        } else {
          if (state.currentVideoUrl === currentUrl && state.isProcessingVideo) {
            const timeoutId = window.setTimeout(waitForVideo, VIDEO_WAIT_TIMEOUT_MS);
            trackTimeout(timeoutId);
          }
        }
      };

      const initialTimeoutId = window.setTimeout(waitForVideo, INITIAL_VIDEO_WAIT_MS);
      trackTimeout(initialTimeoutId);
      return;
    }

    if (activeMode !== 'video-count' && activeMode !== 'time-category') {
      resetProcessingState();
      return;
    }

    const categories = state.settings.categories[activeMode] || [];
    const activeCategories = categories.filter((cat: VideoCategory) => cat.isActive);

    if (activeCategories.length === 0) {
      resetProcessingState();
      return;
    }

    const waitForVideo = () => {
      if (state.isModalVisible || document.getElementById('productitube-category-modal')) {
        return;
      }

      const video = document.querySelector('video') as HTMLVideoElement;
      if (video && video.readyState >= 1) {
        pauseVideo();
        state.modalElement = createCategoryModal();
        state.isModalVisible = true;
      } else {
        if (state.currentVideoUrl === currentUrl && state.isProcessingVideo) {
          const timeoutId = window.setTimeout(waitForVideo, VIDEO_WAIT_TIMEOUT_MS);
          trackTimeout(timeoutId);
        }
      }
    };

    const initialTimeoutId = window.setTimeout(waitForVideo, INITIAL_VIDEO_WAIT_MS);
    trackTimeout(initialTimeoutId);
  } catch (error) {
    console.error('[ProductiTube Limits] Error in handleVideoLoad:', error);
    resetProcessingState();
  }
};

// ==================== INITIALIZATION ====================
/**
 * Initialize video limits feature
 */
export const initializeVideoLimits = (): (() => void) => {
  let videoObserver: MutationObserver | null = null;
  let navigationHandler: (() => void) | null = null;
  let messageListener:
    | ((
        message: { type: string; [key: string]: unknown },
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void
      ) => void)
    | null = null;
  let storageListener:
    | ((changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void)
    | null = null;

  const startWatching = () => {
    videoObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          const hasVideo = addedNodes.some(
            (node) => node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'VIDEO'
          );

          if (hasVideo) {
            handleVideoLoad();

            const video = document.querySelector('video') as HTMLVideoElement;
            if (video) {
              video.addEventListener('ended', async () => {
                if (state.selectedCategoryId) {
                  await stopTimeTracking();
                }
                if (state.totalTimeTrackingInterval) {
                  await stopTotalTimeTracking();
                }
              });

              window.addEventListener('beforeunload', async () => {
                if (state.selectedCategoryId) {
                  await stopTimeTracking();
                }
                if (state.totalTimeTrackingInterval) {
                  await stopTotalTimeTracking();
                }
              });
            }
          }
        }
      }
    });

    videoObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    navigationHandler = () => {
      if (state.selectedCategoryId) {
        stopTimeTracking();
      }
      if (state.totalTimeTrackingInterval) {
        stopTotalTimeTracking();
      }

      if (isVideoWatchPage()) {
        setTimeout(handleVideoLoad, NAVIGATION_DELAY_MS);
      }
    };

    window.addEventListener('yt-navigate-finish', navigationHandler);

    messageListener = async (message, sender, sendResponse) => {
      if (message.type === 'LIMITS_UPDATED') {
        await loadData();
        sendResponse({ success: true });
      } else if (message.type === 'RESET_TOTAL_TIME_USAGE') {
        await resetTotalTimeUsage();
        sendResponse({ success: true });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    storageListener = (changes, areaName) => {
      if (areaName === 'local' && changes[USAGE_STORAGE_KEY]) {
        const newUsageData = changes[USAGE_STORAGE_KEY].newValue;
        if (newUsageData) {
          state.usageData = newUsageData;
        }
      }
    };

    chrome.storage.onChanged.addListener(storageListener);

    if (isVideoWatchPage()) {
      handleVideoLoad();
    }
  };

  startWatching();
  state.isActive = true;

  return () => {
    if (videoObserver) {
      videoObserver.disconnect();
      videoObserver = null;
    }

    if (navigationHandler) {
      window.removeEventListener('yt-navigate-finish', navigationHandler);
      navigationHandler = null;
    }

    if (messageListener) {
      chrome.runtime.onMessage.removeListener(messageListener);
      messageListener = null;
    }

    if (storageListener) {
      chrome.storage.onChanged.removeListener(storageListener);
      storageListener = null;
    }

    removeModal();
    resetProcessingState();
    state.isActive = false;
  };
};

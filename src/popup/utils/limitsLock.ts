import type { LimitsSettings, VideoCategory } from '@/types';

export type LimitMode = 'video-count' | 'time-category' | 'time-total';

/**
 * Match the content script rounding logic for comparing time watched vs time limit.
 * This avoids float precision mismatches between popup and content enforcement.
 */
export const isTimeLimitReached = (
  timeWatchedMinutes: number,
  timeLimitMinutes: number
): boolean => {
  return Math.round(timeWatchedMinutes * 100) >= Math.round(timeLimitMinutes * 100);
};

/**
 * Checks whether ALL active categories have reached their limit for the given category-based mode.
 * Mirrors `areAllCategoryLimitsExhausted` in `src/content/features/limits/index.ts`.
 */
export const areAllCategoryLimitsExhausted = (
  categories: VideoCategory[],
  mode: 'video-count' | 'time-category'
): boolean => {
  const activeCategories = categories.filter((category) => category.isActive);
  if (activeCategories.length === 0) return false;

  const isTimeMode = mode === 'time-category';

  return activeCategories.every((category) => {
    if (isTimeMode) {
      const usedValue = category.timeWatchedToday || 0;
      const limitValue = category.dailyTimeLimit || 60;
      return isTimeLimitReached(usedValue, limitValue);
    }

    const usedValue = category.videosWatchedToday || 0;
    const limitValue = category.dailyLimitCount;
    return usedValue >= limitValue;
  });
};

/**
 * Returns true when the currently active mode has reached its effective limit(s) for today.
 * - category-based: all active categories are exhausted
 * - total-time: total time watched is at/above the configured total limit
 *
 * NOTE: This intentionally does NOT depend on `isLimitsEnabled`. If a user disables limits
 * after exhausting the active mode, we still block switching modes until midnight to prevent bypass.
 */
export const isActiveModeFullyExhausted = (
  limitsSettings: LimitsSettings,
  activeMode: LimitMode
): boolean => {
  if (activeMode === 'video-count' || activeMode === 'time-category') {
    const categoriesForMode = limitsSettings.categories?.[activeMode] || [];
    return areAllCategoryLimitsExhausted(categoriesForMode, activeMode);
  }

  const totalTimeWatched = limitsSettings.totalTimeWatchedToday || 0;
  const totalTimeLimit = limitsSettings.totalDailyTimeLimit || 60;
  return isTimeLimitReached(totalTimeWatched, totalTimeLimit);
};

/**
 * Human-readable time until midnight for user messaging (e.g. "3h 12m" or "18m").
 */
export const getTimeUntilMidnightLabel = (now: Date = new Date()): string => {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const totalMs = midnight.getTime() - now.getTime();

  const totalMinutes = Math.max(0, Math.floor(totalMs / (1000 * 60)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

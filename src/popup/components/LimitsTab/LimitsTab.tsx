'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ColorPicker } from '@/components/ui/color-picker';
import {
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Hourglass,
  Hash,
  Timer,
  Save,
  Star,
  Zap,
  Lock,
} from 'lucide-react';
import type { LimitsTabProps, VideoCategory, FavoriteCategory } from '@/types';

const PRESET_CATEGORIES = [
  { name: 'Education', color: '#10b981' },
  { name: 'Entertainment', color: '#f59e0b' },
  { name: 'Music', color: '#8b5cf6' },
  { name: 'News', color: '#ef4444' },
  { name: 'Gaming', color: '#06b6d4' },
  { name: 'Sports', color: '#f97316' },
];

type LimitMode = 'video-count' | 'time-category' | 'time-total';

export const LimitsTab: React.FC<LimitsTabProps> = ({ limitsSettings, updateLimitsSettings }) => {
  const [activeMode, setActiveMode] = useState<LimitMode>(
    limitsSettings.activeMode || 'video-count'
  );

  useEffect(() => {
    if (limitsSettings.activeMode) {
      setActiveMode(limitsSettings.activeMode);
    }
  }, [limitsSettings.activeMode]);

  useEffect(() => {
    if (limitsSettings.totalDailyTimeLimit !== undefined) {
      setTotalTimeLimit(limitsSettings.totalDailyTimeLimit);
      setIsTotalLimitSaved(true);
    }
  }, [limitsSettings.totalDailyTimeLimit]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VideoCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#10b981',
    dailyLimitCount: 5,
    dailyTimeLimit: 60,
  });
  const [totalTimeLimit, setTotalTimeLimit] = useState(limitsSettings.totalDailyTimeLimit || 60);
  const totalTimeWatched = limitsSettings.totalTimeWatchedToday || 0;
  const [isTotalLimitSaved, setIsTotalLimitSaved] = useState(!!limitsSettings.totalDailyTimeLimit);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    dailyLimitCount?: string;
    dailyTimeLimit?: string;
  }>({});
  const [modeConfirmation, setModeConfirmation] = useState<{
    mode: LimitMode;
    enabled: boolean;
    isOpen: boolean;
  } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    categoryId: string;
    categoryName: string;
    isOpen: boolean;
  } | null>(null);
  const [favoriteConfirmation, setFavoriteConfirmation] = useState<{
    category: VideoCategory;
    action: 'add' | 'remove';
    isOpen: boolean;
  } | null>(null);
  const [loadFavoritesConfirmation, setLoadFavoritesConfirmation] = useState<{
    isOpen: boolean;
    favoritesToAdd: FavoriteCategory[];
    existingCount: number;
  } | null>(null);
  const [selectedFavorites, setSelectedFavorites] = useState<string[]>([]);
  const [editingFavorite, setEditingFavorite] = useState<FavoriteCategory | null>(null);
  const [deleteFavoriteConfirmation, setDeleteFavoriteConfirmation] = useState<{
    favorite: FavoriteCategory;
    isOpen: boolean;
  } | null>(null);
  const [saveTimeLimitConfirmation, setSaveTimeLimitConfirmation] = useState<{
    newLimit: number;
    currentLimit: number;
    isOpen: boolean;
  } | null>(null);
  const [restoredCategoriesInfo, setRestoredCategoriesInfo] = useState<{
    categories: Array<{ name: string; originalLimit: number | string; newLimit: number | string }>;
  } | null>(null);

  const hasFavorites = (limitsSettings.favoriteCategories || []).length > 0;

  const handleLoadFavorites = () => {
    const favorites = limitsSettings.favoriteCategories || [];
    if (favorites.length === 0) return;

    const currentModeCategories = getCurrentModeCategories();
    const existingCategoryNames = currentModeCategories.map((cat: VideoCategory) =>
      cat.name.toLowerCase()
    );

    const favoritesToAdd = favorites.filter(
      (fav) => !existingCategoryNames.includes(fav.name.toLowerCase())
    );

    if (favoritesToAdd.length === 0) {
      return;
    }

    setLoadFavoritesConfirmation({
      isOpen: true,
      favoritesToAdd,
      existingCount: currentModeCategories.length,
    });
  };

  const handleLoadSelectedFavorites = () => {
    if (selectedFavorites.length === 0) return;

    const favorites = limitsSettings.favoriteCategories || [];
    const selectedFavoriteObjects = favorites.filter((fav) => selectedFavorites.includes(fav.id));

    const currentModeCategories = getCurrentModeCategories();
    const existingCategoryNames = currentModeCategories.map((cat: VideoCategory) =>
      cat.name.toLowerCase()
    );

    const favoritesToAdd = selectedFavoriteObjects.filter(
      (fav) => !existingCategoryNames.includes(fav.name.toLowerCase())
    );

    if (favoritesToAdd.length === 0) {
      return;
    }

    setLoadFavoritesConfirmation({
      isOpen: true,
      favoritesToAdd,
      existingCount: currentModeCategories.length,
    });
  };

  const handleSelectFavorite = (favoriteId: string) => {
    setSelectedFavorites((prev) =>
      prev.includes(favoriteId) ? prev.filter((id) => id !== favoriteId) : [...prev, favoriteId]
    );
  };

  const handleSelectAllFavorites = () => {
    const favorites = limitsSettings.favoriteCategories || [];
    setSelectedFavorites(favorites.map((fav) => fav.id));
  };

  const handleDeselectAllFavorites = () => {
    setSelectedFavorites([]);
  };

  const handleEditFavorite = (favorite: FavoriteCategory) => {
    setEditingFavorite(favorite);
    setNewCategory({
      name: favorite.name,
      color: favorite.color,
      dailyLimitCount: favorite.dailyLimitCount,
      dailyTimeLimit: favorite.dailyTimeLimit || 60,
    });
  };

  const handleUpdateFavorite = () => {
    if (!editingFavorite) return;

    if (!validateForm()) {
      return;
    }

    const existingFavorites = limitsSettings.favoriteCategories || [];
    const updatedFavorites = existingFavorites.map((fav) =>
      fav.id === editingFavorite.id
        ? {
            ...fav,
            name: newCategory.name.trim(),
            color: newCategory.color,
            dailyLimitCount: newCategory.dailyLimitCount,
            dailyTimeLimit: newCategory.dailyTimeLimit,
          }
        : fav
    );

    const currentModeCategories = getCurrentModeCategories();
    const updatedCategories = currentModeCategories.map((cat: VideoCategory) => {
      if (cat.name.toLowerCase() === editingFavorite.name.toLowerCase()) {
        if (isCategoryLocked(cat)) {
          if (activeMode === 'video-count') {
            const newLimit = newCategory.dailyLimitCount || 5;
            const currentLimit = cat.dailyLimitCount || 5;
            if (newLimit > currentLimit) {
              return cat;
            }
          } else if (activeMode === 'time-category') {
            const newLimit = newCategory.dailyTimeLimit || 60;
            const currentLimit = cat.dailyTimeLimit || 60;
            if (newLimit > currentLimit) {
              return cat;
            }
          }
        }
        return {
          ...cat,
          name: newCategory.name.trim(),
          color: newCategory.color,
          dailyLimitCount: newCategory.dailyLimitCount,
          dailyTimeLimit: newCategory.dailyTimeLimit,
        };
      }
      return cat;
    });

    updateLimitsSettings({
      favoriteCategories: updatedFavorites,
      categories: {
        ...limitsSettings.categories,
        [activeMode]: updatedCategories,
      },
    });

    setEditingFavorite(null);
    setNewCategory({
      name: '',
      color: '#10b981',
      dailyLimitCount: 5,
      dailyTimeLimit: 60,
    });
    clearValidationErrors();
  };

  const handleDeleteFavoriteClick = (favorite: FavoriteCategory) => {
    setDeleteFavoriteConfirmation({
      favorite,
      isOpen: true,
    });
  };

  const confirmDeleteFavorite = () => {
    if (!deleteFavoriteConfirmation) return;

    const existingFavorites = limitsSettings.favoriteCategories || [];
    const updatedFavorites = existingFavorites.filter(
      (fav) => fav.id !== deleteFavoriteConfirmation.favorite.id
    );

    updateLimitsSettings({
      favoriteCategories: updatedFavorites,
    });

    setSelectedFavorites((prev) =>
      prev.filter((id) => id !== deleteFavoriteConfirmation.favorite.id)
    );
    setDeleteFavoriteConfirmation(null);
  };

  const cancelDeleteFavorite = () => {
    setDeleteFavoriteConfirmation(null);
  };

  const handleSaveTimeLimit = () => {
    const currentLimit = limitsSettings.totalDailyTimeLimit || 60;
    if (totalTimeLimit !== currentLimit) {
      setSaveTimeLimitConfirmation({
        newLimit: totalTimeLimit,
        currentLimit: currentLimit,
        isOpen: true,
      });
    } else {
      setIsTotalLimitSaved(true);
    }
  };

  const confirmSaveTimeLimit = () => {
    if (!saveTimeLimitConfirmation) return;

    updateLimitsSettings({ totalDailyTimeLimit: saveTimeLimitConfirmation.newLimit });
    setIsTotalLimitSaved(true);
    setSaveTimeLimitConfirmation(null);
  };

  const cancelSaveTimeLimit = () => {
    setSaveTimeLimitConfirmation(null);
  };

  const handleFavoriteEditDialogOpenChange = (open: boolean) => {
    if (!open) {
      setEditingFavorite(null);
      clearValidationErrors();
    }
  };

  const confirmLoadFavorites = async () => {
    if (!loadFavoritesConfirmation) return;

    const currentModeCategories = getCurrentModeCategories();
    const { favoritesToAdd } = loadFavoritesConfirmation;

    const newCategories: VideoCategory[] = [];
    const restoredCategories: Array<{
      name: string;
      originalLimit: number | string;
      newLimit: number | string;
    }> = [];

    for (const fav of favoritesToAdd) {
      const usageData = await checkUsageDataForCategory(fav.name);
      let finalLimitCount = fav.dailyLimitCount;
      let finalTimeLimit = fav.dailyTimeLimit || 60;

      if (usageData && (usageData.videoCount > 0 || usageData.timeWatched > 0)) {
        if (activeMode === 'video-count') {
          let originalLimit: number | undefined;

          if (
            usageData.lockedLimit !== undefined &&
            usageData.lockedLimit !== null &&
            typeof usageData.lockedLimit === 'number' &&
            usageData.lockedLimit > 0
          ) {
            originalLimit = usageData.lockedLimit;
          } else {
            const allCategories = [
              ...(limitsSettings.categories['video-count'] || []),
              ...(limitsSettings.categories['time-category'] || []),
            ];
            const allFavorites = limitsSettings.favoriteCategories || [];

            const matchingCategory = allCategories.find(
              (cat) => cat.name.toLowerCase() === fav.name.toLowerCase()
            );

            const matchingFavorites = allFavorites.filter(
              (favItem) => favItem.name.toLowerCase() === fav.name.toLowerCase()
            );

            originalLimit = matchingCategory?.dailyLimitCount;

            for (const matchingFavorite of matchingFavorites) {
              if (matchingFavorite.id === fav.id) continue;
              if (!originalLimit || matchingFavorite.dailyLimitCount < originalLimit) {
                originalLimit = matchingFavorite.dailyLimitCount;
              }
            }
          }

          if (originalLimit !== undefined && fav.dailyLimitCount > originalLimit) {
            finalLimitCount = originalLimit;
            restoredCategories.push({
              name: fav.name,
              originalLimit: originalLimit,
              newLimit: fav.dailyLimitCount,
            });
          } else if (originalLimit === undefined) {
            const allCategories = [
              ...(limitsSettings.categories['video-count'] || []),
              ...(limitsSettings.categories['time-category'] || []),
            ];
            const matchingCategory = allCategories.find(
              (cat) => cat.name.toLowerCase() === fav.name.toLowerCase()
            );
            if (matchingCategory && fav.dailyLimitCount > matchingCategory.dailyLimitCount) {
              finalLimitCount = matchingCategory.dailyLimitCount;
              restoredCategories.push({
                name: fav.name,
                originalLimit: matchingCategory.dailyLimitCount,
                newLimit: fav.dailyLimitCount,
              });
            }
          }
        } else if (activeMode === 'time-category') {
          let originalLimit: number | undefined;

          if (usageData.lockedTimeLimit !== undefined) {
            originalLimit = usageData.lockedTimeLimit;
          } else {
            const allCategories = [
              ...(limitsSettings.categories['video-count'] || []),
              ...(limitsSettings.categories['time-category'] || []),
            ];
            const allFavorites = limitsSettings.favoriteCategories || [];
            const matchingCategory = allCategories.find(
              (cat) => cat.name.toLowerCase() === fav.name.toLowerCase()
            );
            const matchingFavorite = allFavorites.find(
              (favItem) =>
                favItem.name.toLowerCase() === fav.name.toLowerCase() && favItem.id !== fav.id
            );
            originalLimit = matchingCategory?.dailyTimeLimit || (matchingCategory ? 60 : undefined);
            const favoriteLimitToCompare =
              matchingFavorite?.dailyTimeLimit || (matchingFavorite ? 60 : undefined);
            if (
              favoriteLimitToCompare !== undefined &&
              (!originalLimit || favoriteLimitToCompare < originalLimit)
            ) {
              originalLimit = favoriteLimitToCompare;
            }
          }

          if (originalLimit !== undefined && finalTimeLimit > originalLimit) {
            finalTimeLimit = originalLimit;
            restoredCategories.push({
              name: fav.name,
              originalLimit: formatTime(originalLimit),
              newLimit: formatTime(fav.dailyTimeLimit || 60),
            });
          }
        }
      }

      newCategories.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: fav.name,
        color: fav.color,
        dailyLimitCount: finalLimitCount,
        dailyTimeLimit: finalTimeLimit,
        videosWatchedToday: usageData?.videoCount || 0,
        timeWatchedToday: usageData?.timeWatched || 0,
        isActive: true,
      });
    }

    updateLimitsSettings({
      categories: {
        ...limitsSettings.categories,
        [activeMode]: [...currentModeCategories, ...newCategories],
      },
    });

    if (restoredCategories.length > 0) {
      setRestoredCategoriesInfo({ categories: restoredCategories });
    }

    setLoadFavoritesConfirmation(null);
  };

  const cancelLoadFavorites = () => {
    setLoadFavoritesConfirmation(null);
  };

  const handleFavoriteClick = (category: VideoCategory) => {
    const existingFavorites = limitsSettings.favoriteCategories || [];
    const isFavorited = existingFavorites.some(
      (fav) => fav.name.toLowerCase() === category.name.toLowerCase()
    );

    setFavoriteConfirmation({
      category,
      action: isFavorited ? 'remove' : 'add',
      isOpen: true,
    });
  };

  const confirmFavoriteAction = () => {
    if (!favoriteConfirmation) return;

    const { category, action } = favoriteConfirmation;
    const existingFavorites = limitsSettings.favoriteCategories || [];

    if (action === 'remove') {
      const updatedFavorites = existingFavorites.filter(
        (fav) => fav.name.toLowerCase() !== category.name.toLowerCase()
      );
      updateLimitsSettings({
        favoriteCategories: updatedFavorites,
      });
    } else {
      const newFavorite: FavoriteCategory = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: category.name,
        color: category.color,
        dailyLimitCount: category.dailyLimitCount,
        dailyTimeLimit: category.dailyTimeLimit || 60,
        createdAt: Date.now(),
      };
      updateLimitsSettings({
        favoriteCategories: [...existingFavorites, newFavorite],
      });
    }

    setFavoriteConfirmation(null);
  };

  const cancelFavoriteAction = () => {
    setFavoriteConfirmation(null);
  };

  const isCategoryFavorited = (category: VideoCategory) => {
    const existingFavorites = limitsSettings.favoriteCategories || [];
    return existingFavorites.some((fav) => fav.name.toLowerCase() === category.name.toLowerCase());
  };

  const getCurrentModeCategories = (): VideoCategory[] => {
    if (activeMode === 'video-count' || activeMode === 'time-category') {
      return limitsSettings.categories[activeMode] || [];
    }
    return [];
  };

  const getProgressPercentage = (watched: number, limit: number) => {
    return Math.min((watched / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number, isExceeded?: boolean) => {
    if (isExceeded || percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 70) return 'bg-amber-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-lime-500';
    if (percentage >= 20) return 'bg-green-500';
    return 'bg-green-600';
  };

  const formatTime = (minutes: number) => {
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

  const isCategoryLocked = (category: VideoCategory): boolean => {
    const hasVideoUsage = (category.videosWatchedToday || 0) > 0;
    const hasTimeUsage = (category.timeWatchedToday || 0) > 0;
    return hasVideoUsage || hasTimeUsage;
  };

  const isLimitIncrease = (category: VideoCategory, newLimit: number, mode: LimitMode): boolean => {
    if (mode === 'video-count') {
      return newLimit > (category.dailyLimitCount || 5);
    } else if (mode === 'time-category') {
      return newLimit > (category.dailyTimeLimit || 60);
    }
    return false;
  };

  const getTimeUntilMidnight = (): string => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const totalMs = midnight.getTime() - now.getTime();
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const checkUsageDataForCategory = async (
    categoryName: string
  ): Promise<{
    videoCount: number;
    timeWatched: number;
    lockedLimit?: number; // For video-count mode
    lockedTimeLimit?: number; // For time-category mode
  } | null> => {
    try {
      const USAGE_STORAGE_KEY = 'youtube_usage_data';
      const today = new Date().toDateString();
      const normalizeCategoryName = (name: string): string => {
        return name.toLowerCase().trim().replace(/\s+/g, ' ');
      };

      const usageDataResult = await chrome.storage.local.get(USAGE_STORAGE_KEY);
      const usageData = usageDataResult[USAGE_STORAGE_KEY] || {};
      const storageKey = normalizeCategoryName(categoryName);

      const todayUsage = usageData[today]?.[storageKey];
      if (todayUsage) {
        return {
          videoCount: todayUsage.videoCount || 0,
          timeWatched: todayUsage.timeWatched || 0,
          lockedLimit: todayUsage.lockedLimit,
          lockedTimeLimit: todayUsage.lockedTimeLimit,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to check usage data:', error);
      return null;
    }
  };

  const validateForm = () => {
    const errors: { name?: string; dailyLimitCount?: string; dailyTimeLimit?: string } = {};

    if (!newCategory.name.trim()) {
      errors.name = 'Category name is required';
    } else if (newCategory.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    } else if (newCategory.name.trim().length > 30) {
      errors.name = 'Category name must be less than 30 characters';
    } else {
      // Check for duplicate category names (case-insensitive)
      const currentModeCategories = getCurrentModeCategories();
      const normalizedNewName = newCategory.name.trim().toLowerCase();
      const isDuplicate = currentModeCategories.some((cat: VideoCategory) => {
        // When editing, allow the same category to keep its name
        if (editingCategory && cat.id === editingCategory.id) {
          return false;
        }
        return cat.name.toLowerCase() === normalizedNewName;
      });

      if (isDuplicate) {
        errors.name = 'A category with this name already exists';
      }
    }

    if (editingCategory && isCategoryLocked(editingCategory)) {
      if (activeMode === 'video-count') {
        if (!newCategory.dailyLimitCount || newCategory.dailyLimitCount < 1) {
          errors.dailyLimitCount = 'Daily limit must be at least 1 video';
        } else if (newCategory.dailyLimitCount > 100) {
          errors.dailyLimitCount = 'Daily limit cannot exceed 100 videos';
        } else if (isLimitIncrease(editingCategory, newCategory.dailyLimitCount, activeMode)) {
          errors.dailyLimitCount = `Can't increase — category was used today. Resets at midnight.`;
        }
      }

      if (activeMode === 'time-category') {
        if (!newCategory.dailyTimeLimit || newCategory.dailyTimeLimit < 5) {
          errors.dailyTimeLimit = 'Time limit must be at least 5 minutes';
        } else if (newCategory.dailyTimeLimit > 480) {
          errors.dailyTimeLimit = 'Time limit cannot exceed 480 minutes (8 hours)';
        } else if (isLimitIncrease(editingCategory, newCategory.dailyTimeLimit, activeMode)) {
          errors.dailyTimeLimit = `Can't increase — category was used today. Resets at midnight.`;
        }
      }
    } else {
      if (activeMode === 'video-count') {
        if (!newCategory.dailyLimitCount || newCategory.dailyLimitCount < 1) {
          errors.dailyLimitCount = 'Daily limit must be at least 1 video';
        } else if (newCategory.dailyLimitCount > 100) {
          errors.dailyLimitCount = 'Daily limit cannot exceed 100 videos';
        }
      }

      if (activeMode === 'time-category') {
        if (!newCategory.dailyTimeLimit || newCategory.dailyTimeLimit < 5) {
          errors.dailyTimeLimit = 'Time limit must be at least 5 minutes';
        } else if (newCategory.dailyTimeLimit > 480) {
          errors.dailyTimeLimit = 'Time limit cannot exceed 480 minutes (8 hours)';
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearValidationErrors = () => {
    setValidationErrors({});
  };

  /**
   * Check if limits were already disabled today (for once-per-day restriction)
   */
  const wasDisabledToday = (): boolean => {
    if (!limitsSettings.lastDisabledAt) return false;
    const lastDisabled = new Date(limitsSettings.lastDisabledAt);
    const today = new Date();
    return lastDisabled.toDateString() === today.toDateString();
  };

  /**
   * Check if total-time mode was activated today
   */
  const isTotalTimeModeActivatedToday = (): boolean => {
    if (!limitsSettings.totalTimeModeActivatedAt) return false;
    const activatedAt = new Date(limitsSettings.totalTimeModeActivatedAt);
    const today = new Date();
    return activatedAt.toDateString() === today.toDateString();
  };

  const isTotalTimeLimitLocked = (): boolean => {
    if (!isTotalTimeModeActivatedToday()) return false;
    const currentWatchTime = limitsSettings.totalTimeWatchedToday || 0;
    const watchTimeAtActivation = limitsSettings.totalTimeWatchedAtActivation ?? 0;
    return currentWatchTime > watchTimeAtActivation;
  };

  const handleModeToggle = (mode: LimitMode, enabled: boolean) => {
    if (!enabled && wasDisabledToday()) {
      setModeConfirmation({
        mode,
        enabled,
        isOpen: true,
      });
      return;
    }

    setModeConfirmation({
      mode,
      enabled,
      isOpen: true,
    });
  };

  const confirmModeChange = () => {
    if (!modeConfirmation) return;

    const { mode, enabled } = modeConfirmation;

    if (!enabled && wasDisabledToday()) {
      setModeConfirmation(null);
      return;
    }

    if (enabled) {
      setActiveMode(mode);

      if (mode === 'time-total') {
        setIsTotalLimitSaved(!!limitsSettings.totalDailyTimeLimit);
      } else {
        setIsTotalLimitSaved(false);
      }

      if (mode === 'video-count' || mode === 'time-category') {
        updateLimitsSettings({
          activeMode: mode,
          isLimitsEnabled: true,
          categories: {
            ...limitsSettings.categories,
            [mode]: [],
          },
        });
      } else if (mode === 'time-total') {
        setTotalTimeLimit(limitsSettings.totalDailyTimeLimit || 60);
        const activatedAt = limitsSettings.totalTimeModeActivatedAt;
        const isActivatedToday =
          activatedAt && new Date(activatedAt).toDateString() === new Date().toDateString();
        const currentWatchTime = limitsSettings.totalTimeWatchedToday || 0;

        updateLimitsSettings({
          activeMode: mode,
          isLimitsEnabled: true,
          totalDailyTimeLimit: limitsSettings.totalDailyTimeLimit || 60,
          ...(isActivatedToday
            ? {}
            : {
                totalTimeModeActivatedAt: new Date().toISOString(),
                totalTimeWatchedAtActivation: currentWatchTime,
              }),
        });
      }
    } else {
      updateLimitsSettings({
        isLimitsEnabled: false,
        lastDisabledAt: new Date().toISOString(),
      });
    }

    setModeConfirmation(null);
  };

  const cancelModeChange = () => {
    setModeConfirmation(null);
  };

  const handleDeleteClick = (categoryId: string, categoryName: string) => {
    setDeleteConfirmation({
      categoryId,
      categoryName,
      isOpen: true,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    const currentModeCategories = getCurrentModeCategories();

    const categoryToDelete = currentModeCategories.find(
      (cat: VideoCategory) => cat.id === deleteConfirmation.categoryId
    );

    if (categoryToDelete && isCategoryLocked(categoryToDelete)) {
      try {
        const USAGE_STORAGE_KEY = 'youtube_usage_data';
        const today = new Date().toDateString();
        const normalizeName = (name: string): string =>
          name.toLowerCase().trim().replace(/\s+/g, ' ');
        const storageKey = normalizeName(categoryToDelete.name);

        const usageDataResult = await chrome.storage.local.get(USAGE_STORAGE_KEY);
        const usageData = usageDataResult[USAGE_STORAGE_KEY] || {};

        if (usageData[today]?.[storageKey]) {
          usageData[today][storageKey].lockedLimit = categoryToDelete.dailyLimitCount;
          usageData[today][storageKey].lockedTimeLimit = categoryToDelete.dailyTimeLimit || 60;
          await chrome.storage.local.set({ [USAGE_STORAGE_KEY]: usageData });
        }
      } catch (error) {
        console.error('Failed to store locked limits:', error);
      }
    }

    const updatedCategories = currentModeCategories.filter(
      (cat: VideoCategory) => cat.id !== deleteConfirmation.categoryId
    );
    updateLimitsSettings({
      categories: {
        ...limitsSettings.categories,
        [activeMode]: updatedCategories,
      },
    });
    setDeleteConfirmation(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleAddCategory = async () => {
    if (newCategory.name.trim() && !validateForm()) {
      return;
    }

    if (selectedPresets.length > 0 && newCategory.name.trim() === '') {
      const tempErrors: { dailyLimitCount?: string; dailyTimeLimit?: string } = {};

      if (activeMode === 'video-count') {
        if (!newCategory.dailyLimitCount || newCategory.dailyLimitCount < 1) {
          tempErrors.dailyLimitCount = 'Daily limit must be at least 1 video';
        } else if (newCategory.dailyLimitCount > 100) {
          tempErrors.dailyLimitCount = 'Daily limit cannot exceed 100 videos';
        }
      }

      if (activeMode === 'time-category') {
        if (!newCategory.dailyTimeLimit || newCategory.dailyTimeLimit < 5) {
          tempErrors.dailyTimeLimit = 'Time limit must be at least 5 minutes';
        } else if (newCategory.dailyTimeLimit > 480) {
          tempErrors.dailyTimeLimit = 'Time limit cannot exceed 480 minutes (8 hours)';
        }
      }

      if (Object.keys(tempErrors).length > 0) {
        setValidationErrors(tempErrors);
        return;
      }
    }

    if (!newCategory.name.trim() && selectedPresets.length === 0) {
      setValidationErrors({ name: 'Please enter a category name or select preset categories' });
      return;
    }

    const categoriesToAdd: VideoCategory[] = [];
    const restoredCategories: Array<{
      name: string;
      originalLimit: number | string;
      newLimit: number | string;
    }> = [];

    if (newCategory.name.trim()) {
      const usageData = await checkUsageDataForCategory(newCategory.name.trim());
      let finalLimitCount = newCategory.dailyLimitCount;
      let finalTimeLimit = newCategory.dailyTimeLimit;

      if (usageData && (usageData.videoCount > 0 || usageData.timeWatched > 0)) {
        if (activeMode === 'video-count') {
          let originalLimit: number | undefined;

          if (usageData.lockedLimit !== undefined) {
            originalLimit = usageData.lockedLimit;
          } else {
            const allCategories = [
              ...(limitsSettings.categories['video-count'] || []),
              ...(limitsSettings.categories['time-category'] || []),
            ];
            const allFavorites = limitsSettings.favoriteCategories || [];
            const matchingCategory = allCategories.find(
              (cat) => cat.name.toLowerCase() === newCategory.name.trim().toLowerCase()
            );
            const matchingFavorite = allFavorites.find(
              (fav) => fav.name.toLowerCase() === newCategory.name.trim().toLowerCase()
            );
            originalLimit = matchingCategory?.dailyLimitCount;
            if (
              matchingFavorite &&
              (!originalLimit || matchingFavorite.dailyLimitCount < originalLimit)
            ) {
              originalLimit = matchingFavorite.dailyLimitCount;
            }
          }

          if (originalLimit !== undefined && newCategory.dailyLimitCount > originalLimit) {
            finalLimitCount = originalLimit;
            restoredCategories.push({
              name: newCategory.name.trim(),
              originalLimit: originalLimit,
              newLimit: newCategory.dailyLimitCount,
            });
          }
        } else if (activeMode === 'time-category') {
          let originalLimit: number | undefined;

          if (usageData.lockedTimeLimit !== undefined) {
            originalLimit = usageData.lockedTimeLimit;
          } else {
            const allCategories = [
              ...(limitsSettings.categories['video-count'] || []),
              ...(limitsSettings.categories['time-category'] || []),
            ];
            const allFavorites = limitsSettings.favoriteCategories || [];
            const matchingCategory = allCategories.find(
              (cat) => cat.name.toLowerCase() === newCategory.name.trim().toLowerCase()
            );
            const matchingFavorite = allFavorites.find(
              (fav) => fav.name.toLowerCase() === newCategory.name.trim().toLowerCase()
            );
            originalLimit = matchingCategory?.dailyTimeLimit || (matchingCategory ? 60 : undefined);
            const favoriteLimitToCompare =
              matchingFavorite?.dailyTimeLimit || (matchingFavorite ? 60 : undefined);
            if (
              favoriteLimitToCompare !== undefined &&
              (!originalLimit || favoriteLimitToCompare < originalLimit)
            ) {
              originalLimit = favoriteLimitToCompare;
            }
          }

          if (originalLimit !== undefined && newCategory.dailyTimeLimit > originalLimit) {
            finalTimeLimit = originalLimit;
            restoredCategories.push({
              name: newCategory.name.trim(),
              originalLimit: formatTime(originalLimit),
              newLimit: formatTime(newCategory.dailyTimeLimit),
            });
          }
        }
      }

      const category: VideoCategory = {
        id: Date.now().toString(),
        name: newCategory.name.trim(),
        color: newCategory.color,
        dailyLimitCount: finalLimitCount,
        dailyTimeLimit: finalTimeLimit,
        videosWatchedToday: usageData?.videoCount || 0,
        timeWatchedToday: usageData?.timeWatched || 0,
        isActive: true,
      };
      categoriesToAdd.push(category);
    }

    for (const presetName of selectedPresets) {
      const preset = PRESET_CATEGORIES.find((p) => p.name === presetName);
      if (preset) {
        const usageData = await checkUsageDataForCategory(presetName);
        let finalLimitCount = newCategory.dailyLimitCount;
        let finalTimeLimit = newCategory.dailyTimeLimit;

        if (usageData && (usageData.videoCount > 0 || usageData.timeWatched > 0)) {
          if (activeMode === 'video-count') {
            let originalLimit: number | undefined;

            if (usageData.lockedLimit !== undefined) {
              originalLimit = usageData.lockedLimit;
            } else {
              const allCategories = [
                ...(limitsSettings.categories['video-count'] || []),
                ...(limitsSettings.categories['time-category'] || []),
              ];
              const allFavorites = limitsSettings.favoriteCategories || [];
              const matchingCategory = allCategories.find(
                (cat) => cat.name.toLowerCase() === presetName.toLowerCase()
              );
              const matchingFavorite = allFavorites.find(
                (fav) => fav.name.toLowerCase() === presetName.toLowerCase()
              );
              originalLimit = matchingCategory?.dailyLimitCount;
              if (
                matchingFavorite &&
                (!originalLimit || matchingFavorite.dailyLimitCount < originalLimit)
              ) {
                originalLimit = matchingFavorite.dailyLimitCount;
              }
            }

            if (originalLimit !== undefined && newCategory.dailyLimitCount > originalLimit) {
              finalLimitCount = originalLimit;
              restoredCategories.push({
                name: presetName,
                originalLimit: originalLimit,
                newLimit: newCategory.dailyLimitCount,
              });
            }
          } else if (activeMode === 'time-category') {
            let originalLimit: number | undefined;

            if (usageData.lockedTimeLimit !== undefined) {
              originalLimit = usageData.lockedTimeLimit;
            } else {
              const allCategories = [
                ...(limitsSettings.categories['video-count'] || []),
                ...(limitsSettings.categories['time-category'] || []),
              ];
              const allFavorites = limitsSettings.favoriteCategories || [];
              const matchingCategory = allCategories.find(
                (cat) => cat.name.toLowerCase() === presetName.toLowerCase()
              );
              const matchingFavorite = allFavorites.find(
                (fav) => fav.name.toLowerCase() === presetName.toLowerCase()
              );
              originalLimit =
                matchingCategory?.dailyTimeLimit || (matchingCategory ? 60 : undefined);
              const favoriteLimitToCompare =
                matchingFavorite?.dailyTimeLimit || (matchingFavorite ? 60 : undefined);
              if (
                favoriteLimitToCompare !== undefined &&
                (!originalLimit || favoriteLimitToCompare < originalLimit)
              ) {
                originalLimit = favoriteLimitToCompare;
              }
            }

            if (originalLimit !== undefined && newCategory.dailyTimeLimit > originalLimit) {
              finalTimeLimit = originalLimit;
              restoredCategories.push({
                name: presetName,
                originalLimit: formatTime(originalLimit),
                newLimit: formatTime(newCategory.dailyTimeLimit),
              });
            }
          }
        }

        const category: VideoCategory = {
          id: (Date.now() + Math.random()).toString(),
          name: preset.name,
          color: preset.color,
          dailyLimitCount: finalLimitCount,
          dailyTimeLimit: finalTimeLimit,
          videosWatchedToday: usageData?.videoCount || 0,
          timeWatchedToday: usageData?.timeWatched || 0,
          isActive: true,
        };
        categoriesToAdd.push(category);
      }
    }

    const currentModeCategories = getCurrentModeCategories();

    updateLimitsSettings({
      categories: {
        ...limitsSettings.categories,
        [activeMode]: [...currentModeCategories, ...categoriesToAdd],
      },
    });

    if (restoredCategories.length > 0) {
      setRestoredCategoriesInfo({ categories: restoredCategories });
    }

    setNewCategory({
      name: '',
      color: '#10b981',
      dailyLimitCount: 5,
      dailyTimeLimit: 60,
    });
    setSelectedPresets([]);
    clearValidationErrors();
    setIsAddDialogOpen(false);
  };

  const handleEditCategory = (category: VideoCategory) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      color: category.color,
      dailyLimitCount: category.dailyLimitCount,
      dailyTimeLimit: category.dailyTimeLimit || 60,
    });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;

    if (!validateForm()) {
      return;
    }

    const currentModeCategories = getCurrentModeCategories();
    const isLocked = isCategoryLocked(editingCategory);

    const updatedCategories = currentModeCategories.map((cat: VideoCategory) =>
      cat.id === editingCategory.id
        ? {
            ...cat,
            name: isLocked ? cat.name : newCategory.name.trim(),
            color: newCategory.color,
            dailyLimitCount: newCategory.dailyLimitCount,
            dailyTimeLimit: newCategory.dailyTimeLimit,
          }
        : cat
    );

    updateLimitsSettings({
      categories: {
        ...limitsSettings.categories,
        [activeMode]: updatedCategories,
      },
    });
    setEditingCategory(null);
    setNewCategory({
      name: '',
      color: '#10b981',
      dailyLimitCount: 5,
      dailyTimeLimit: 60,
    });
    clearValidationErrors();
  };

  const handleTogglePreset = (presetName: string) => {
    setSelectedPresets((prev) =>
      prev.includes(presetName) ? prev.filter((name) => name !== presetName) : [...prev, presetName]
    );
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      clearValidationErrors();
      setSelectedPresets([]);
    }
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    if (!open) {
      setEditingCategory(null);
      clearValidationErrors();
    }
  };

  const currentModeCategories = getCurrentModeCategories();
  const activeCategories = currentModeCategories.filter((cat: VideoCategory) => cat.isActive);

  const totalVideosWatched = activeCategories.reduce(
    (sum: number, cat: VideoCategory) => sum + cat.videosWatchedToday,
    0
  );
  const totalVideoLimit = activeCategories.reduce(
    (sum: number, cat: VideoCategory) => sum + cat.dailyLimitCount,
    0
  );

  const totalCategoryTimeWatched = activeCategories.reduce(
    (sum: number, cat: VideoCategory) => sum + (cat.timeWatchedToday || 0),
    0
  );
  const totalCategoryTimeLimit = activeCategories.reduce(
    (sum: number, cat: VideoCategory) => sum + (cat.dailyTimeLimit || 60),
    0
  );

  return (
    <div className="space-y-7 py-6">
      {/* Mode Selection Toggles */}
      <Card className="bg-white shadow-lg border-0 ring-1 ring-gray-200 gap-2 py-6">
        <CardHeader className="text-center">
          <div className="w-full">
            <CardTitle className="text-lg font-bold text-gray-800">Daily Video Limits</CardTitle>
            <p className="text-xs text-gray-600">Control your daily YouTube consumption.</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Video Count Mode */}
          <div className="flex items-center justify-between p-3 rounded-md border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-md">
                <Hash className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-800">
                  Video Count by Category
                </Label>
                <p className="text-xs text-gray-600">Set video quotas per category</p>
              </div>
            </div>
            <Switch
              checked={limitsSettings.isLimitsEnabled && activeMode === 'video-count'}
              onCheckedChange={(checked) => handleModeToggle('video-count', checked)}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          {/* Time Category Mode */}
          <div className="flex items-center justify-between p-3 rounded-md border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-md">
                <Hourglass className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-800">
                  Time Limit by Category
                </Label>
                <p className="text-xs text-gray-600">Set time limits per category</p>
              </div>
            </div>
            <Switch
              checked={limitsSettings.isLimitsEnabled && activeMode === 'time-category'}
              onCheckedChange={(checked) => handleModeToggle('time-category', checked)}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>

          {/* Total Time Mode */}
          <div className="flex items-center justify-between p-3 rounded-md border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-md">
                <Timer className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-800">
                  Total Time-Based Limit
                </Label>
                <p className="text-xs text-gray-600">Single global time limit</p>
              </div>
            </div>
            <Switch
              checked={limitsSettings.isLimitsEnabled && activeMode === 'time-total'}
              onCheckedChange={(checked) => handleModeToggle('time-total', checked)}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
        </CardContent>
      </Card>

      {limitsSettings.isLimitsEnabled && (
        <>
          {/* Favorites Section - Only show when favorites exist and in category-based modes */}
          {hasFavorites && (activeMode === 'video-count' || activeMode === 'time-category') && (
            <Card className="bg-white shadow-lg border-0 ring-1 ring-gray-200/60 transition-all duration-500 ease-out hover:shadow-xl hover:ring-gray-300/60 rounded-xl overflow-hidden p-0 gap-2">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100/50 px-6 py-6">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-white rounded-md shadow-sm border border-amber-100">
                      <Star className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-bold text-gray-900 leading-tight">
                        Favorites
                      </CardTitle>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {(limitsSettings.favoriteCategories || []).length} saved categories
                        {selectedFavorites.length > 0}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadFavorites}
                      className="h-8 px-3 text-xs bg-gradient-to-r from-amber-50 to-yellow-50 backdrop-blur-sm border-amber-200 hover:bg-gradient-to-r hover:from-amber-100 hover:to-yellow-100 hover:border-amber-300 hover:shadow-md transition-all duration-200 ml-3 flex-shrink-0"
                    >
                      <Zap className="w-3 h-3 mr-1.5" />
                      Load All
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="pt-3 px-4 pb-3 bg-gradient-to-b from-white to-amber-50/20">
                <div className="space-y-4">
                  {/* Selection Controls */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAllFavorites}
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        Select All
                      </Button>
                      <span className="text-gray-400">•</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeselectAllFavorites}
                        className="h-6 px-2 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                      >
                        Deselect All
                      </Button>
                    </div>
                    {selectedFavorites.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLoadSelectedFavorites}
                        className="h-6 px-2 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm border-blue-200 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                      >
                        <Zap className="w-3 h-3 mr-1.5" />
                        Load Selected ({selectedFavorites.length})
                      </Button>
                    )}
                  </div>

                  {/* Favorite Categories */}
                  <div className="space-y-2">
                    {(limitsSettings.favoriteCategories || []).map((favorite) => (
                      <div
                        key={favorite.id}
                        className={`flex items-center gap-2 bg-gradient-to-r from-white to-amber-50/50 border rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-all duration-200 ${
                          selectedFavorites.includes(favorite.id)
                            ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50'
                            : 'border-amber-200/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFavorites.includes(favorite.id)}
                          onChange={() => handleSelectFavorite(favorite.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                        />
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: favorite.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-700">{favorite.name}</span>
                          <span className="text-[10px] text-gray-500 ml-1">
                            ({favorite.dailyLimitCount} • {favorite.dailyTimeLimit || 60}m)
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditFavorite(favorite)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFavoriteClick(favorite)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mode 1: Video Count by Category */}
          {activeMode === 'video-count' && (
            <>
              {currentModeCategories.length > 0 && (
                <Card className="bg-white shadow-lg border-0 ring-1 ring-gray-200/60 transition-all duration-500 ease-out hover:shadow-xl hover:ring-gray-300/60 rounded-xl overflow-hidden p-0 gap-2">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100/50 px-5 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="p-1.5 bg-white rounded-md shadow-sm border border-green-100">
                        <Hash className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">Today&apos;s Usage</span>
                    </div>
                  </div>

                  <CardContent className="pt-3 pb-4 px-5 bg-gradient-to-b from-white to-gray-50/30">
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`text-xl font-bold ${totalVideosWatched >= totalVideoLimit ? 'text-red-600' : 'text-green-600'}`}>
                          {totalVideosWatched}
                        </span>
                        <span className="text-base text-gray-400 font-medium">/</span>
                        <span className="text-base text-gray-600 font-semibold">{totalVideoLimit}</span>
                        <span className="text-xs text-gray-500 ml-1">videos</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(getProgressPercentage(totalVideosWatched, totalVideoLimit), totalVideosWatched >= totalVideoLimit)}`}
                            style={{
                              width: `${Math.min(getProgressPercentage(totalVideosWatched, totalVideoLimit), 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-medium ${totalVideosWatched >= totalVideoLimit ? 'text-red-600' : 'text-gray-600'}`}>
                            {totalVideosWatched >= totalVideoLimit
                              ? 'Limit reached'
                              : `${totalVideoLimit - totalVideosWatched} remaining`}
                          </span>
                          <span className="text-gray-500 font-medium">
                            {Math.round(getProgressPercentage(totalVideosWatched, totalVideoLimit))}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-white shadow-lg border-0 ring-1 ring-gray-200/60 transition-all duration-500 ease-out hover:shadow-xl hover:ring-gray-300/60 rounded-xl overflow-hidden p-0 gap-2">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100/50 px-6 py-6">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-white rounded-md shadow-sm border border-green-100">
                        <Hash className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-bold text-gray-900 leading-tight">
                          Video Categories
                        </CardTitle>
                        <p className="text-xs text-gray-600 mt-0.5">Manage category limits</p>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 active:bg-red-700 h-8 px-3 text-xs text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 ease-in-out border-0"
                            >
                              <Plus className="w-3 h-3" />
                              Add
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="max-w-80 max-h-[80vh] overflow-y-auto rounded-none">
                            <DialogHeader>
                              <DialogTitle className="text-base">Add Category</DialogTitle>
                              <DialogDescription className="text-xs">
                                Create a new video category to limit your YouTube watching.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Info Banner - Rules for categories */}
                              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-medium text-blue-800 mb-1">
                                      How category limits work
                                    </p>
                                    <ul className="text-blue-700 space-y-0.5 list-disc pl-4">
                                      <li>Limits lock after you start watching</li>
                                      <li>Category names can&apos;t be changed after use</li>
                                      <li>You can always lower limits, never increase</li>
                                      <li>Everything resets at midnight</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <Label htmlFor="category-name" className="mb-1 text-xs">
                                Category Name
                              </Label>
                              <Input
                                id="category-name"
                                value={newCategory.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  setNewCategory({ ...newCategory, name: e.target.value });
                                  if (validationErrors.name) {
                                    setValidationErrors({ ...validationErrors, name: undefined });
                                  }
                                }}
                                placeholder="e.g., Education, Entertainment"
                                className={`focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8 ${
                                  validationErrors.name ? 'border-red-500 ring-1 ring-red-500' : ''
                                }`}
                              />
                              {validationErrors.name && (
                                <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
                              )}
                              <div>
                                <Label htmlFor="daily-limit" className="mb-1 text-xs">
                                  Daily Video Limit
                                </Label>
                                <Input
                                  id="daily-limit"
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={newCategory.dailyLimitCount}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setNewCategory({
                                      ...newCategory,
                                      dailyLimitCount: Number.parseInt(e.target.value) || 5,
                                    });
                                    if (validationErrors.dailyLimitCount) {
                                      setValidationErrors({
                                        ...validationErrors,
                                        dailyLimitCount: undefined,
                                      });
                                    }
                                  }}
                                  className={`focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8 ${
                                    validationErrors.dailyLimitCount
                                      ? 'border-red-500 ring-1 ring-red-500'
                                      : ''
                                  }`}
                                />
                                {validationErrors.dailyLimitCount ? (
                                  <p className="text-xs text-red-500 mt-1">
                                    {validationErrors.dailyLimitCount}
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-gray-500 mt-1">
                                    Maximum videos per day
                                  </p>
                                )}
                              </div>
                              <ColorPicker
                                label="Color"
                                value={newCategory.color}
                                onChange={(color: string) =>
                                  setNewCategory({ ...newCategory, color })
                                }
                              />
                              <div className="space-y-2">
                                <Label className="text-xs">Quick Add</Label>
                                <div className="flex flex-wrap gap-1">
                                  {PRESET_CATEGORIES.map((preset) => {
                                    const isSelected = selectedPresets.includes(preset.name);
                                    const isAlreadyAdded = currentModeCategories.some(
                                      (cat: VideoCategory) => cat.name === preset.name
                                    );

                                    return (
                                      <Button
                                        key={preset.name}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleTogglePreset(preset.name)}
                                        disabled={isAlreadyAdded}
                                        className={`h-6 px-2 text-xs transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                                          isSelected
                                            ? 'border-red-500 border-2 bg-red-50 text-red-700 shadow-md scale-105'
                                            : 'hover:border-red-300 hover:bg-red-25 hover:shadow-sm'
                                        } ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
                                      >
                                        <div
                                          className="w-2 h-2 rounded-full mr-1"
                                          style={{ backgroundColor: preset.color }}
                                        />
                                        {preset.name}
                                        {isAlreadyAdded && (
                                          <span className="ml-1 text-[10px]">✓</span>
                                        )}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleAddCategory}
                                  className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 h-8 text-xs text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 ease-in-out"
                                >
                                  {selectedPresets.length > 0 && newCategory.name.trim()
                                    ? `Add Category + ${selectedPresets.length} Preset${selectedPresets.length > 1 ? 's' : ''}`
                                    : selectedPresets.length > 0
                                      ? `Add ${selectedPresets.length} Preset${selectedPresets.length > 1 ? 's' : ''}`
                                      : 'Add Category'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleDialogOpenChange(false)}
                                  className="h-8 text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-2 pb-4 px-4 bg-gradient-to-b from-white to-gray-50/30">
                  {currentModeCategories.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-gradient-to-br from-gray-50/80 to-gray-100/60 rounded-xl border border-gray-200/50 backdrop-blur-sm">
                      <div className="p-3 bg-white/60 rounded-full w-fit mx-auto mb-3 shadow-sm">
                        <Hash className="w-10 h-10 opacity-60 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium mb-1 text-gray-700">No categories yet</p>
                      <p className="text-xs text-gray-500 mb-4">
                        Add categories to manage your video limits
                      </p>
                      {hasFavorites && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLoadFavorites}
                          className="h-8 px-3 text-xs bg-gradient-to-r from-amber-50 to-yellow-50 backdrop-blur-sm border-amber-200 hover:bg-gradient-to-r hover:from-amber-100 hover:to-yellow-100 hover:border-amber-300 hover:shadow-md transition-all duration-200 ml-3 flex-shrink-0"
                        >
                          <Zap className="w-3 h-3 mr-1.5" />
                          Load Your Favorites
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentModeCategories.map((category: VideoCategory) => {
                        const progressPercentage = getProgressPercentage(
                          category.videosWatchedToday,
                          category.dailyLimitCount
                        );
                        const isExceeded = category.videosWatchedToday >= category.dailyLimitCount;
                        const remainingVideos = Math.max(
                          0,
                          category.dailyLimitCount - category.videosWatchedToday
                        );

                        return (
                          <div
                            key={category.id}
                            className="bg-gradient-to-r from-white to-gray-50/50 border border-gray-200/60 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-gray-300/60 transition-all duration-300 backdrop-blur-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                <span className="text-sm font-medium">{category.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleFavoriteClick(category)}
                                  className="h-5 w-5 p-0 hover:bg-amber-50"
                                >
                                  <Star
                                    className={`w-3 h-3 transition-colors ${
                                      isCategoryFavorited(category)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-gray-400 hover:text-amber-400'
                                    }`}
                                  />
                                </Button>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCategory(category)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(category.id, category.name)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>
                                  {category.videosWatchedToday} / {category.dailyLimitCount} videos
                                </span>
                                <span
                                  className={
                                    isExceeded ? 'text-red-600 font-medium' : 'text-gray-600'
                                  }
                                >
                                  {isExceeded ? 'Reached' : `${remainingVideos} left`}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progressPercentage, isExceeded)}`}
                                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Mode 2: Time Limit by Category */}
          {activeMode === 'time-category' && (
            <>
              {currentModeCategories.length > 0 && (
                <Card className="bg-white shadow-lg border-0 ring-1 ring-gray-200/60 transition-all duration-500 ease-out hover:shadow-xl hover:ring-gray-300/60 rounded-xl overflow-hidden p-0 gap-2">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 px-5 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="p-1.5 bg-white rounded-md shadow-sm border border-blue-100">
                        <Hourglass className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">Today&apos;s Usage</span>
                    </div>
                  </div>
                  <CardContent className="pt-3 pb-4 px-5 bg-gradient-to-b from-white to-gray-50/30">
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`text-xl font-bold ${Math.round(totalCategoryTimeWatched * 100) >= Math.round(totalCategoryTimeLimit * 100) ? 'text-red-600' : 'text-blue-600'}`}>
                          {formatTime(totalCategoryTimeWatched)}
                        </span>
                        <span className="text-base text-gray-400 font-medium">/</span>
                        <span className="text-base text-gray-600 font-semibold">{formatTime(totalCategoryTimeLimit)}</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(getProgressPercentage(totalCategoryTimeWatched, totalCategoryTimeLimit), Math.round(totalCategoryTimeWatched * 100) >= Math.round(totalCategoryTimeLimit * 100))}`}
                            style={{
                              width: `${Math.min(getProgressPercentage(totalCategoryTimeWatched, totalCategoryTimeLimit), 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-medium ${Math.round(totalCategoryTimeWatched * 100) >= Math.round(totalCategoryTimeLimit * 100) ? 'text-red-600' : 'text-gray-600'}`}>
                            {Math.round(totalCategoryTimeWatched * 100) >= Math.round(totalCategoryTimeLimit * 100)
                              ? 'Limit reached'
                              : `${formatTime(totalCategoryTimeLimit - totalCategoryTimeWatched)} remaining`}
                          </span>
                          <span className="text-gray-500 font-medium">
                            {Math.round(getProgressPercentage(totalCategoryTimeWatched, totalCategoryTimeLimit))}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-white shadow-lg border-0 ring-1 ring-gray-200/60 transition-all duration-500 ease-out hover:shadow-xl hover:ring-gray-300/60 rounded-xl overflow-hidden p-0 gap-2">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 px-6 py-6">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-white rounded-md shadow-sm border border-blue-100">
                        <Hourglass className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-bold text-gray-900 leading-tight">
                          Time Categories
                        </CardTitle>
                        <p className="text-xs text-gray-600 mt-0.5">Set time limits per category</p>
                      </div>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 active:bg-red-700 h-8 px-3 text-xs text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 ease-in-out border-0"
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-80 max-h-[80vh] overflow-y-auto rounded-none">
                          <DialogHeader>
                            <DialogTitle className="text-base">Add New Time Category</DialogTitle>
                            <DialogDescription className="text-xs">
                              Create a new category with time-based limits for your YouTube
                              watching.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Info Banner - Rules for categories */}
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-medium text-blue-800 mb-1">
                                    How category limits work
                                  </p>
                                  <ul className="text-blue-700 space-y-0.5 list-disc pl-4">
                                    <li>Limits lock after you start watching</li>
                                    <li>Category names can&apos;t be changed after use</li>
                                    <li>You can always lower limits, never increase</li>
                                    <li>Everything resets at midnight</li>
                                  </ul>
                                </div>
                              </div>
                            </div>

                            <Label htmlFor="category-name" className="mb-1 text-xs">
                              Category Name
                            </Label>
                            <Input
                              id="category-name"
                              value={newCategory.name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setNewCategory({ ...newCategory, name: e.target.value });
                                if (validationErrors.name) {
                                  setValidationErrors({ ...validationErrors, name: undefined });
                                }
                              }}
                              placeholder="e.g., Education, Entertainment"
                              className={`focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8 ${
                                validationErrors.name ? 'border-red-500 ring-1 ring-red-500' : ''
                              }`}
                            />
                            {validationErrors.name && (
                              <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
                            )}
                            <div>
                              <Label htmlFor="daily-time-limit" className="mb-1 text-xs">
                                Daily Time Limit (minutes)
                              </Label>
                              <Input
                                id="daily-time-limit"
                                type="number"
                                min="5"
                                max="480"
                                value={newCategory.dailyTimeLimit}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  setNewCategory({
                                    ...newCategory,
                                    dailyTimeLimit: Number.parseInt(e.target.value) || 60,
                                  });
                                  if (validationErrors.dailyTimeLimit) {
                                    setValidationErrors({
                                      ...validationErrors,
                                      dailyTimeLimit: undefined,
                                    });
                                  }
                                }}
                                className={`focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8 ${
                                  validationErrors.dailyTimeLimit
                                    ? 'border-red-500 ring-1 ring-red-500'
                                    : ''
                                }`}
                              />
                              {validationErrors.dailyTimeLimit ? (
                                <p className="text-xs text-red-500 mt-1">
                                  {validationErrors.dailyTimeLimit}
                                </p>
                              ) : (
                                <p className="text-[10px] text-gray-500 mt-1">
                                  Maximum watch time per day (
                                  {formatTime(newCategory.dailyTimeLimit)})
                                </p>
                              )}
                            </div>
                            <ColorPicker
                              label="Color"
                              value={newCategory.color}
                              onChange={(color: string) =>
                                setNewCategory({ ...newCategory, color })
                              }
                            />
                            <div className="space-y-2">
                              <Label className="text-xs">Quick Add</Label>
                              <div className="flex flex-wrap gap-1">
                                {PRESET_CATEGORIES.map((preset) => {
                                  const isSelected = selectedPresets.includes(preset.name);
                                  const isAlreadyAdded = currentModeCategories.some(
                                    (cat: VideoCategory) => cat.name === preset.name
                                  );

                                  return (
                                    <Button
                                      key={preset.name}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleTogglePreset(preset.name)}
                                      disabled={isAlreadyAdded}
                                      className={`h-6 px-2 text-xs transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
                                        isSelected
                                          ? 'border-red-500 border-2 bg-red-50 text-red-700 shadow-md scale-105'
                                          : 'hover:border-red-300 hover:bg-red-25 hover:shadow-sm'
                                      } ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
                                    >
                                      <div
                                        className="w-2 h-2 rounded-full mr-1"
                                        style={{ backgroundColor: preset.color }}
                                      />
                                      {preset.name}
                                      {isAlreadyAdded && (
                                        <span className="ml-1 text-[10px]">✓</span>
                                      )}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleAddCategory}
                                className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 h-8 text-xs text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 ease-in-out"
                              >
                                {selectedPresets.length > 0 && newCategory.name.trim()
                                  ? `Add Category + ${selectedPresets.length} Preset${selectedPresets.length > 1 ? 's' : ''}`
                                  : selectedPresets.length > 0
                                    ? `Add ${selectedPresets.length} Preset${selectedPresets.length > 1 ? 's' : ''}`
                                    : 'Add Category'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleDialogOpenChange(false)}
                                className="h-8 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-2 pb-4 px-4 bg-gradient-to-b from-white to-gray-50/30">
                  {currentModeCategories.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-gradient-to-br from-gray-50/80 to-gray-100/60 rounded-xl border border-gray-200/50 backdrop-blur-sm">
                      <div className="p-3 bg-white/60 rounded-full w-fit mx-auto mb-3 shadow-sm">
                        <Hourglass className="w-10 h-10 opacity-60 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium mb-1 text-gray-700">
                        No time categories created yet
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Add categories to start managing your time limits
                      </p>
                      {hasFavorites && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLoadFavorites}
                          className="h-8 px-3 text-xs bg-gradient-to-r from-amber-50 to-yellow-50 backdrop-blur-sm border-amber-200 hover:bg-gradient-to-r hover:from-amber-100 hover:to-yellow-100 hover:border-amber-300 hover:shadow-md transition-all duration-200 ml-3 flex-shrink-0"
                        >
                          <Zap className="w-3 h-3 mr-1.5" />
                          Load Your Favorites
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentModeCategories.map((category: VideoCategory) => {
                        const timeWatched = category.timeWatchedToday || 0;
                        const timeLimit = category.dailyTimeLimit || 60;
                        const progressPercentage = getProgressPercentage(timeWatched, timeLimit);
                        const isExceeded =
                          Math.round(timeWatched * 100) >= Math.round(timeLimit * 100);
                        const remainingTime = Math.max(0, timeLimit - timeWatched);

                        return (
                          <div
                            key={category.id}
                            className="bg-gradient-to-r from-white to-gray-50/50 border border-gray-200/60 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-gray-300/60 transition-all duration-300 backdrop-blur-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                <span className="text-sm font-medium">{category.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleFavoriteClick(category)}
                                  className="h-5 w-5 p-0 hover:bg-amber-50"
                                >
                                  <Star
                                    className={`w-3 h-3 transition-colors ${
                                      isCategoryFavorited(category)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-gray-400 hover:text-amber-400'
                                    }`}
                                  />
                                </Button>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCategory(category)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(category.id, category.name)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>
                                  {formatTime(timeWatched)} / {formatTime(timeLimit)}
                                </span>
                                <span
                                  className={
                                    isExceeded ? 'text-red-600 font-medium' : 'text-gray-600'
                                  }
                                >
                                  {isExceeded
                                    ? 'Time reached'
                                    : `${formatTime(remainingTime)} remaining`}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${getProgressColor(progressPercentage, isExceeded)}`}
                                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Mode 3: Total Time-Based Limit */}
          {activeMode === 'time-total' && (
            <>
              {isTotalLimitSaved && (
                <Card className="bg-white shadow-lg border-0 ring-1 ring-gray-200/60 transition-all duration-500 ease-out hover:shadow-xl hover:ring-gray-300/60 rounded-xl overflow-hidden p-0 gap-2">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100/50 px-5 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="p-1.5 bg-white rounded-md shadow-sm border border-purple-100">
                        <Timer className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">Today&apos;s Usage</span>
                    </div>
                  </div>
                  <CardContent className="pt-3 pb-4 px-5 bg-gradient-to-b from-white to-gray-50/30">
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`text-xl font-bold ${totalTimeWatched >= (limitsSettings.totalDailyTimeLimit || 60) ? 'text-red-600' : 'text-purple-600'}`}>
                          {formatTime(totalTimeWatched)}
                        </span>
                        <span className="text-base text-gray-400 font-medium">/</span>
                        <span className="text-base text-gray-600 font-semibold">
                          {formatTime(limitsSettings.totalDailyTimeLimit || 60)}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(getProgressPercentage(totalTimeWatched, limitsSettings.totalDailyTimeLimit || 60), totalTimeWatched >= (limitsSettings.totalDailyTimeLimit || 60))}`}
                            style={{
                              width: `${Math.min(getProgressPercentage(totalTimeWatched, limitsSettings.totalDailyTimeLimit || 60), 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-medium ${totalTimeWatched >= (limitsSettings.totalDailyTimeLimit || 60) ? 'text-red-600' : 'text-gray-600'}`}>
                            {totalTimeWatched >= (limitsSettings.totalDailyTimeLimit || 60)
                              ? 'Limit reached'
                              : `${formatTime((limitsSettings.totalDailyTimeLimit || 60) - totalTimeWatched)} remaining`}
                          </span>
                          <span className="text-gray-500 font-medium">
                            {Math.round(getProgressPercentage(totalTimeWatched, limitsSettings.totalDailyTimeLimit || 60))}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-white shadow-lg border-0 ring-1 ring-gray-200/60 transition-all duration-500 ease-out hover:shadow-xl hover:ring-gray-300/60 rounded-xl overflow-hidden p-0 gap-2">
                <div
                  className={`bg-gradient-to-r ${isTotalTimeLimitLocked() ? 'from-amber-50 to-orange-50 border-b border-amber-100/50' : 'from-purple-50 to-indigo-50 border-b border-purple-100/50'} px-6 py-6`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2 bg-white rounded-md shadow-sm border ${isTotalTimeLimitLocked() ? 'border-amber-100' : 'border-purple-100'}`}
                      >
                        {isTotalTimeLimitLocked() ? (
                          <Lock className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Timer className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-gray-800 text-sm font-bold leading-tight">
                          Total Daily Time Limit
                        </CardTitle>
                        <p className="text-xs font-normal text-gray-600 mt-0.5">
                          Set your global time limit
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleSaveTimeLimit}
                      className={`h-8 px-3 text-xs bg-white border hover:bg-white hover:shadow-md transition-all duration-200 ml-3 flex-shrink-0 ${
                        isTotalTimeLimitLocked()
                          ? 'text-amber-600 border-amber-200 hover:border-amber-300'
                          : 'text-black-600 border-purple-200 hover:border-purple-300'
                      }`}
                    >
                      <Save className="w-4 h-4 mr-1.5" />
                      Save
                    </Button>
                  </div>
                </div>
                <CardContent className="space-y-4 pt-4 pb-6 px-6 bg-white">
                  <div>
                    <Label
                      htmlFor="total-time-limit"
                      className="mb-2 block text-sm flex items-center gap-2"
                    >
                      Daily Time Limit (minutes)
                    </Label>
                    <Input
                      id="total-time-limit"
                      type="number"
                      min="5"
                      max={
                        isTotalTimeLimitLocked() ? limitsSettings.totalDailyTimeLimit || 60 : 480
                      }
                      value={totalTimeLimit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newLimit = Number.parseInt(e.target.value) || 60;
                        const minLimit = 5;
                        if (isTotalTimeLimitLocked()) {
                          const currentSavedLimit = limitsSettings.totalDailyTimeLimit || 60;
                          setTotalTimeLimit(
                            Math.min(Math.max(newLimit, minLimit), currentSavedLimit)
                          );
                        } else {
                          setTotalTimeLimit(Math.max(newLimit, minLimit));
                        }
                      }}
                      className={`focus-visible:ring-[1.5px] text-sm h-8 ${
                        isTotalTimeLimitLocked()
                          ? 'focus-visible:ring-amber-500 focus-visible:border-amber-500 border-amber-200'
                          : 'focus-visible:ring-red-500 focus-visible:border-red-500'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Total YouTube watch time allowed per day ({formatTime(totalTimeLimit)})
                    </p>
                  </div>

                  {isTotalTimeLimitLocked() && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-amber-800">
                          <p className="font-medium mb-1">Limit locked for today</p>
                          <p className="text-amber-700">
                            Since you&apos;ve started watching, you can only decrease the limit to
                            prevent bypassing. The lock resets at midnight.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isTotalTimeModeActivatedToday() && !isTotalTimeLimitLocked() && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-800">
                          <p className="font-medium mb-1">Mode activated</p>
                          <p className="text-blue-700">
                            You can freely adjust the limit now. Once you start watching, increasing
                            the limit will be blocked until midnight.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Mode Confirmation Dialog */}
      <Dialog
        open={modeConfirmation?.isOpen || false}
        onOpenChange={(open) => !open && cancelModeChange()}
      >
        <DialogContent className="max-w-80 rounded-none gap-2">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base flex items-center gap-2 justify-center text-center">
              {!modeConfirmation?.enabled && wasDisabledToday() ? (
                <>
                  <Lock className="w-5 h-5 text-red-500" />
                  Disable Not Available
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  {modeConfirmation?.enabled
                    ? limitsSettings.isLimitsEnabled && activeMode !== modeConfirmation?.mode
                      ? 'Switch Limit Mode'
                      : 'Enable Limits'
                    : 'Disable Limits'}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {(() => {
                // Case 1: Blocked - already disabled today
                if (!modeConfirmation?.enabled && wasDisabledToday()) {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 text-left">
                      <p className="text-red-800 font-medium mb-3">
                        Limits were already disabled today.
                      </p>
                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="text-gray-700 font-medium mb-1">What you can do:</p>
                          <p className="text-gray-600 pl-2">
                            • Switch to another limit mode at any time
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-700 font-medium mb-1">What you can&apos;t do:</p>
                          <p className="text-gray-600 pl-2">
                            • Disable limits again until midnight
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Case 2: Disable (first time today)
                if (!modeConfirmation?.enabled) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-left">
                      <p className="text-amber-800 font-medium mb-2">
                        Are you sure you want to disable all limits?
                      </p>
                      <ul className="text-amber-700 text-xs space-y-1 list-disc pl-4 mb-2">
                        <li>Limits will remain disabled until you enable a mode again</li>
                        <li>Your usage data is preserved (not reset)</li>
                        <li>
                          <strong>You can only disable once per day</strong>
                        </li>
                      </ul>
                      <p className="text-amber-600 text-xs font-medium">
                        This action will unlock again at midnight.
                      </p>
                    </div>
                  );
                }

                // Case 3: Switch modes
                if (limitsSettings.isLimitsEnabled && activeMode !== modeConfirmation?.mode) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-left">
                      <p className="text-amber-800 font-medium mb-2">
                        Switch to{' '}
                        {modeConfirmation?.mode === 'video-count' && 'Video Count by Category'}
                        {modeConfirmation?.mode === 'time-category' && 'Time Limit by Category'}
                        {modeConfirmation?.mode === 'time-total' && 'Total Time-Based Limit'}?
                      </p>
                      <ul className="text-amber-700 text-xs space-y-1 list-disc pl-4">
                        <li>
                          <strong>Switching does not reset your usage</strong>
                        </li>
                        <li>Limits continue based on what you&apos;ve already watched today</li>
                        <li>All modes share the same underlying usage data</li>
                      </ul>
                    </div>
                  );
                }

                // Case 4: Enable (from disabled state)
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-left">
                    <p className="text-blue-800 font-medium mb-2">
                      Enable {modeConfirmation?.mode === 'video-count' && 'Video Count by Category'}
                      {modeConfirmation?.mode === 'time-category' && 'Time Limit by Category'}
                      {modeConfirmation?.mode === 'time-total' && 'Total Time-Based Limit'}?
                    </p>
                    <ul className="text-blue-700 text-xs space-y-1 list-disc pl-4 mb-2">
                      <li>Limits will be enforced immediately</li>
                      <li>Your existing usage from today still counts</li>
                      <li>Limits reset at midnight</li>
                    </ul>
                    <p className="text-blue-600 text-xs font-medium">
                      Heads-up: Disabling limits is allowed <strong>once per day</strong>. Switching
                      modes is always allowed.
                    </p>
                  </div>
                );
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            {!modeConfirmation?.enabled && wasDisabledToday() ? (
              <Button
                onClick={cancelModeChange}
                className="flex-1 bg-gray-500 hover:bg-gray-600 h-9 text-sm"
              >
                Got it
              </Button>
            ) : (
              <>
                <Button
                  onClick={confirmModeChange}
                  className={`flex-1 h-9 text-sm ${
                    modeConfirmation?.enabled
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {modeConfirmation?.enabled
                    ? limitsSettings.isLimitsEnabled && activeMode !== modeConfirmation?.mode
                      ? 'Switch Mode'
                      : 'Enable Limits'
                    : 'Disable Limits'}
                </Button>
                <Button variant="outline" onClick={cancelModeChange} className="h-9 text-sm">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-80 max-h-[80vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Category</DialogTitle>
            <DialogDescription className="text-xs">
              Modify the settings for this category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Warning Banner - Show when category is not locked yet */}
            {editingCategory && !isCategoryLocked(editingCategory) && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 mb-1">Limits lock after first use</p>
                    <p className="text-amber-700">
                      Once you start watching in this category today, you won&apos;t be able to
                      increase these limits until midnight. You can always decrease them or edit
                      other settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Locked Indicator - Show when category is locked */}
            {editingCategory && isCategoryLocked(editingCategory) && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-xs">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800 mb-1">Limit Increase Not Allowed</p>
                    <p className="text-red-700 mb-2">
                      This category was used today (
                      {activeMode === 'video-count'
                        ? `${editingCategory.videosWatchedToday || 0} video${(editingCategory.videosWatchedToday || 0) !== 1 ? 's' : ''}`
                        : formatTime(editingCategory.timeWatchedToday || 0)}
                      ), so its limit can&apos;t be increased.
                    </p>
                    <p className="text-red-600">
                      You can still lower the limit or edit other settings. Resets at midnight (
                      {getTimeUntilMidnight()}).
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="edit-category-name" className="mb-1 text-xs">
                Category Name
              </Label>
              <Input
                id="edit-category-name"
                value={newCategory.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (editingCategory && isCategoryLocked(editingCategory)) {
                    return;
                  }
                  setNewCategory({ ...newCategory, name: e.target.value });
                  if (validationErrors.name) {
                    setValidationErrors({ ...validationErrors, name: undefined });
                  }
                }}
                readOnly={editingCategory ? isCategoryLocked(editingCategory) : false}
                className={`focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8 ${
                  validationErrors.name ? 'border-red-500 ring-1 ring-red-500' : ''
                } ${
                  editingCategory && isCategoryLocked(editingCategory)
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : ''
                }`}
              />
              {validationErrors.name && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
              )}
              {editingCategory && isCategoryLocked(editingCategory) && (
                <p className="text-[10px] text-gray-500 mt-1">
                  Names of active categories cannot be changed. This prevents bypassing limits and
                  keeps usage data accurate.
                </p>
              )}
            </div>

            {activeMode === 'video-count' && (
              <div>
                <Label htmlFor="edit-daily-limit" className="mb-1 text-xs">
                  Daily Video Limit
                </Label>
                <div className="relative">
                  <Input
                    id="edit-daily-limit"
                    type="number"
                    min="1"
                    max="100"
                    value={newCategory.dailyLimitCount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newValue = Number.parseInt(e.target.value) || 5;
                      setNewCategory({
                        ...newCategory,
                        dailyLimitCount: newValue,
                      });
                      if (validationErrors.dailyLimitCount) {
                        setValidationErrors({ ...validationErrors, dailyLimitCount: undefined });
                      }
                    }}
                    className={`focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8 ${
                      validationErrors.dailyLimitCount ? 'border-red-500 ring-1 ring-red-500' : ''
                    }`}
                  />
                </div>
                {validationErrors.dailyLimitCount ? (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.dailyLimitCount}</p>
                ) : editingCategory && isCategoryLocked(editingCategory) ? (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Current: {editingCategory.dailyLimitCount} videos (locked) — Used{' '}
                    {editingCategory.videosWatchedToday || 0} today
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-500 mt-1">Maximum number of videos per day</p>
                )}
              </div>
            )}

            {activeMode === 'time-category' && (
              <div>
                <Label htmlFor="edit-daily-time-limit" className="mb-1 text-xs">
                  Daily Time Limit (minutes)
                </Label>
                <div className="relative">
                  <Input
                    id="edit-daily-time-limit"
                    type="number"
                    min="5"
                    max="480"
                    value={newCategory.dailyTimeLimit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newValue = Number.parseInt(e.target.value) || 60;
                      setNewCategory({
                        ...newCategory,
                        dailyTimeLimit: newValue,
                      });
                      if (validationErrors.dailyTimeLimit) {
                        setValidationErrors({ ...validationErrors, dailyTimeLimit: undefined });
                      }
                    }}
                    className={`focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8 ${
                      validationErrors.dailyTimeLimit ? 'border-red-500 ring-1 ring-red-500' : ''
                    }`}
                  />
                </div>
                {validationErrors.dailyTimeLimit ? (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.dailyTimeLimit}</p>
                ) : editingCategory && isCategoryLocked(editingCategory) ? (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Current: {formatTime(editingCategory.dailyTimeLimit || 60)} (locked) — Used{' '}
                    {formatTime(editingCategory.timeWatchedToday || 0)} today
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Maximum watch time per day ({formatTime(newCategory.dailyTimeLimit)})
                  </p>
                )}
              </div>
            )}

            <ColorPicker
              label="Color"
              value={newCategory.color}
              onChange={(color: string) => setNewCategory({ ...newCategory, color })}
            />

            <div className="flex gap-2">
              <Button
                onClick={handleUpdateCategory}
                className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 h-8 text-xs text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 ease-in-out"
              >
                Update Category
              </Button>
              <Button
                variant="outline"
                onClick={() => handleEditDialogOpenChange(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation?.isOpen || false}
        onOpenChange={(open) => !open && cancelDelete()}
      >
        <DialogContent className="max-w-80 rounded-none gap-2">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base flex items-center gap-2 justify-center text-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Delete Category
            </DialogTitle>
            <DialogDescription className="text-sm text-center">
              Are you sure you want to delete the category{' '}
              <strong>&quot;{deleteConfirmation?.categoryName}&quot;</strong>?
              <span className="block mt-2 text-muted-foreground">
                Your watch progress will be preserved. If you add a category with the same name
                later, your usage will be restored.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={confirmDelete}
              className="flex-1 bg-red-500 hover:bg-red-600 h-9 text-sm"
            >
              Delete Category
            </Button>
            <Button variant="outline" onClick={cancelDelete} className="h-9 text-sm">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Favorite Category Confirmation Dialog */}
      <Dialog
        open={favoriteConfirmation?.isOpen || false}
        onOpenChange={(open) => !open && cancelFavoriteAction()}
      >
        <DialogContent className="max-w-80 rounded-none gap-2">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base flex items-center gap-2 justify-center text-center">
              <Star className="w-5 h-5 text-amber-500" />
              {favoriteConfirmation?.action === 'add'
                ? 'Add to Favorites'
                : 'Remove from Favorites'}
            </DialogTitle>
            <DialogDescription className="text-sm text-center">
              {favoriteConfirmation?.action === 'add' ? (
                <>
                  Are you sure you want to add{' '}
                  <strong>&quot;{favoriteConfirmation?.category?.name}&quot;</strong> to your
                  favorites?
                  <span className="block mt-2 text-blue-600 font-medium">
                    This will save the category with its current limit settings for quick access
                    later.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to remove{' '}
                  <strong>&quot;{favoriteConfirmation?.category?.name}&quot;</strong> from your
                  favorites?
                  <span className="block mt-2 text-amber-600 font-medium">
                    You can always add it back to favorites later if needed.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={confirmFavoriteAction}
              className={`flex-1 h-9 text-sm ${
                favoriteConfirmation?.action === 'add'
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {favoriteConfirmation?.action === 'add'
                ? 'Add to Favorites'
                : 'Remove from Favorites'}
            </Button>
            <Button variant="outline" onClick={cancelFavoriteAction} className="h-9 text-sm">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Favorites Confirmation Dialog */}
      <Dialog
        open={loadFavoritesConfirmation?.isOpen || false}
        onOpenChange={(open) => !open && cancelLoadFavorites()}
      >
        <DialogContent className="max-w-80 rounded-none gap-2">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base flex items-center gap-2 justify-center text-center">
              <Zap className="w-5 h-5 text-amber-500" />
              Load Favorite Categories
            </DialogTitle>
            <DialogDescription className="text-sm text-center">
              {loadFavoritesConfirmation?.existingCount === 0 ? (
                <>
                  Are you sure you want to load{' '}
                  <strong>
                    {loadFavoritesConfirmation?.favoritesToAdd.length} favorite categories
                  </strong>
                  ?
                  <span className="block mt-2 text-blue-600 font-medium">
                    These categories will be added to your current setup.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to load{' '}
                  <strong>
                    {loadFavoritesConfirmation?.favoritesToAdd.length} favorite categories
                  </strong>
                  ?
                  <span className="block mt-2 text-blue-600 font-medium">
                    These will be added to your existing {loadFavoritesConfirmation?.existingCount}{' '}
                    categories. Duplicates will be skipped automatically.
                  </span>
                </>
              )}
              {loadFavoritesConfirmation?.favoritesToAdd &&
                loadFavoritesConfirmation.favoritesToAdd.length > 0 && (
                  <div className="mt-3 p-2 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-600 mb-1">Categories to add:</div>
                    <div className="flex flex-wrap gap-1">
                      {loadFavoritesConfirmation.favoritesToAdd.map((fav, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded px-2 py-0.5 text-xs"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: fav.color }}
                          />
                          {fav.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={confirmLoadFavorites}
              className="flex-1 bg-blue-500 hover:bg-blue-600 h-9 text-sm"
            >
              Load Categories
            </Button>
            <Button variant="outline" onClick={cancelLoadFavorites} className="h-9 text-sm">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Time Limit Confirmation Dialog */}
      <Dialog
        open={saveTimeLimitConfirmation?.isOpen || false}
        onOpenChange={(open) => !open && cancelSaveTimeLimit()}
      >
        <DialogContent className="max-w-80 rounded-none gap-2">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base flex items-center gap-2 justify-center text-center">
              {isTotalTimeLimitLocked() ? (
                <>
                  <Lock className="w-5 h-5 text-amber-500" />
                  Decrease Time Limit
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 text-purple-500" />
                  Save Time Limit
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm text-center">
              {isTotalTimeLimitLocked() ? (
                <>
                  Decrease your daily time limit from{' '}
                  <strong>{formatTime(saveTimeLimitConfirmation?.currentLimit || 60)}</strong> to{' '}
                  <strong>{formatTime(saveTimeLimitConfirmation?.newLimit || 60)}</strong>?
                  <span className="block mt-2 text-amber-600 font-medium">
                    Since the limit is locked, you can decrease but not increase until midnight.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to change your daily time limit from{' '}
                  <strong>{formatTime(saveTimeLimitConfirmation?.currentLimit || 60)}</strong> to{' '}
                  <strong>{formatTime(saveTimeLimitConfirmation?.newLimit || 60)}</strong>?
                  <span className="block mt-2 text-purple-600 font-medium">
                    This will update your global YouTube time limit and apply immediately.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={confirmSaveTimeLimit}
              className={`flex-1 h-9 text-sm ${
                isTotalTimeLimitLocked()
                  ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700'
                  : 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700'
              }`}
            >
              {isTotalTimeLimitLocked() ? 'Decrease Limit' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={cancelSaveTimeLimit} className="h-9 text-sm">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Favorite Dialog */}
      <Dialog open={!!editingFavorite} onOpenChange={handleFavoriteEditDialogOpenChange}>
        <DialogContent className="max-w-80 max-h-[80vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Favorite Category</DialogTitle>
            <DialogDescription className="text-xs">
              Modify the settings for this favorite category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-favorite-name" className="mb-1 text-xs">
                Category Name
              </Label>
              <Input
                id="edit-favorite-name"
                value={newCategory.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNewCategory({ ...newCategory, name: e.target.value });
                  if (validationErrors.name) {
                    setValidationErrors({ ...validationErrors, name: undefined });
                  }
                }}
                className={`focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8 ${
                  validationErrors.name ? 'border-red-500 ring-1 ring-red-500' : ''
                }`}
              />
              {validationErrors.name && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-favorite-limit" className="mb-1 text-xs">
                Daily Video Limit
              </Label>
              <Input
                id="edit-favorite-limit"
                type="number"
                min="1"
                max="100"
                value={newCategory.dailyLimitCount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNewCategory({
                    ...newCategory,
                    dailyLimitCount: Number.parseInt(e.target.value) || 5,
                  });
                  if (validationErrors.dailyLimitCount) {
                    setValidationErrors({ ...validationErrors, dailyLimitCount: undefined });
                  }
                }}
                className={`focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8 ${
                  validationErrors.dailyLimitCount ? 'border-red-500 ring-1 ring-red-500' : ''
                }`}
              />
              {validationErrors.dailyLimitCount ? (
                <p className="text-xs text-red-500 mt-1">{validationErrors.dailyLimitCount}</p>
              ) : (
                <p className="text-[10px] text-gray-500 mt-1">Maximum videos per day</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-favorite-time-limit" className="mb-1 text-xs">
                Daily Time Limit (minutes)
              </Label>
              <Input
                id="edit-favorite-time-limit"
                type="number"
                min="5"
                max="480"
                value={newCategory.dailyTimeLimit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNewCategory({
                    ...newCategory,
                    dailyTimeLimit: Number.parseInt(e.target.value) || 60,
                  });
                  if (validationErrors.dailyTimeLimit) {
                    setValidationErrors({ ...validationErrors, dailyTimeLimit: undefined });
                  }
                }}
                className={`focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8 ${
                  validationErrors.dailyTimeLimit ? 'border-red-500 ring-1 ring-red-500' : ''
                }`}
              />
              {validationErrors.dailyTimeLimit ? (
                <p className="text-xs text-red-500 mt-1">{validationErrors.dailyTimeLimit}</p>
              ) : (
                <p className="text-[10px] text-gray-500 mt-1">
                  Maximum watch time per day ({formatTime(newCategory.dailyTimeLimit)})
                </p>
              )}
            </div>

            <ColorPicker
              label="Color"
              value={newCategory.color}
              onChange={(color: string) => setNewCategory({ ...newCategory, color })}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateFavorite}
                className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 h-8 text-xs text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 ease-in-out"
              >
                Update Favorite
              </Button>
              <Button
                variant="outline"
                onClick={() => handleFavoriteEditDialogOpenChange(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Favorite Confirmation Dialog */}
      <Dialog
        open={deleteFavoriteConfirmation?.isOpen || false}
        onOpenChange={(open) => !open && cancelDeleteFavorite()}
      >
        <DialogContent className="max-w-80 rounded-none gap-2">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base flex items-center gap-2 justify-center text-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Delete Favorite Category
            </DialogTitle>
            <DialogDescription className="text-sm text-center">
              Are you sure you want to delete the favorite category{' '}
              <strong>&quot;{deleteFavoriteConfirmation?.favorite?.name}&quot;</strong>?
              <span className="block mt-2 text-red-600 font-medium">
                This will permanently remove it from your favorites. You can always add it back
                later if needed.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={confirmDeleteFavorite}
              className="flex-1 bg-red-500 hover:bg-red-600 h-9 text-sm"
            >
              Delete Favorite
            </Button>
            <Button variant="outline" onClick={cancelDeleteFavorite} className="h-9 text-sm">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Restoration Notification Dialog */}
      <Dialog
        open={!!restoredCategoriesInfo}
        onOpenChange={(open) => !open && setRestoredCategoriesInfo(null)}
      >
        <DialogContent className="max-w-80 rounded-none gap-2">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base flex items-center gap-2 justify-center text-center">
              <Lock className="w-5 h-5 text-blue-500" />
              Limits Locked
            </DialogTitle>
            <DialogDescription className="text-sm text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3 text-left">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-blue-700 mb-2">
                      Some categories were already used today, so their limits couldn&apos;t be
                      increased:
                    </p>
                    <div className="space-y-1">
                      {restoredCategoriesInfo?.categories.map((rc, index) => (
                        <p key={index} className="text-xs text-blue-800 font-medium">
                          {rc.name} — {rc.originalLimit}{' '}
                          <span className="font-normal text-blue-600">
                            (instead of {rc.newLimit})
                          </span>
                        </p>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600 mt-3">
                      Limits reset at midnight. You can still lower limits or edit other settings.
                    </p>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={() => setRestoredCategoriesInfo(null)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 h-9 text-sm"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

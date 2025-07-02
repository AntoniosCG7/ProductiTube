'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  RotateCcw,
  Hourglass,
  Hash,
  Timer,
  Save,
  Star,
  Zap,
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VideoCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#10b981',
    dailyLimitCount: 5,
    dailyTimeLimit: 60,
  });
  const [totalTimeLimit, setTotalTimeLimit] = useState(limitsSettings.totalDailyTimeLimit || 60);
  const [totalTimeWatched, setTotalTimeWatched] = useState(0);
  const [isTotalLimitSaved, setIsTotalLimitSaved] = useState(false);
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
  const [categoryToggleConfirmation, setCategoryToggleConfirmation] = useState<{
    categoryId: string;
    categoryName: string;
    currentState: boolean;
    isOpen: boolean;
  } | null>(null);
  const [resetConfirmation, setResetConfirmation] = useState<{
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

  const handleFavoriteEditDialogOpenChange = (open: boolean) => {
    if (!open) {
      setEditingFavorite(null);
      clearValidationErrors();
    }
  };

  const confirmLoadFavorites = () => {
    if (!loadFavoritesConfirmation) return;

    const currentModeCategories = getCurrentModeCategories();
    const { favoritesToAdd } = loadFavoritesConfirmation;

    const newCategories: VideoCategory[] = favoritesToAdd.map((fav: FavoriteCategory) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: fav.name,
      color: fav.color,
      dailyLimitCount: fav.dailyLimitCount,
      dailyTimeLimit: fav.dailyTimeLimit || 60,
      videosWatchedToday: 0,
      timeWatchedToday: 0,
      isActive: true,
    }));

    updateLimitsSettings({
      categories: {
        ...limitsSettings.categories,
        [activeMode]: [...currentModeCategories, ...newCategories],
      },
    });

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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const validateForm = () => {
    const errors: { name?: string; dailyLimitCount?: string; dailyTimeLimit?: string } = {};

    if (!newCategory.name.trim()) {
      errors.name = 'Category name is required';
    } else if (newCategory.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    } else if (newCategory.name.trim().length > 30) {
      errors.name = 'Category name must be less than 30 characters';
    }

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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearValidationErrors = () => {
    setValidationErrors({});
  };

  const handleModeToggle = (mode: LimitMode, enabled: boolean) => {
    setModeConfirmation({
      mode,
      enabled,
      isOpen: true,
    });
  };

  const confirmModeChange = () => {
    if (!modeConfirmation) return;

    const { mode, enabled } = modeConfirmation;

    if (enabled) {
      setActiveMode(mode);
      setIsTotalLimitSaved(false);

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
        setTotalTimeLimit(60);
        setTotalTimeWatched(0);
        updateLimitsSettings({
          activeMode: mode,
          isLimitsEnabled: true,
          totalDailyTimeLimit: 60,
        });
      }
    } else {
      updateLimitsSettings({ isLimitsEnabled: false });
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

  const confirmDelete = () => {
    if (!deleteConfirmation) return;

    const currentModeCategories = getCurrentModeCategories();
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

  const confirmCategoryToggle = () => {
    if (!categoryToggleConfirmation) return;

    const currentModeCategories = getCurrentModeCategories();
    const updatedCategories = currentModeCategories.map((cat: VideoCategory) =>
      cat.id === categoryToggleConfirmation.categoryId ? { ...cat, isActive: !cat.isActive } : cat
    );
    updateLimitsSettings({
      categories: {
        ...limitsSettings.categories,
        [activeMode]: updatedCategories,
      },
    });

    setCategoryToggleConfirmation(null);
  };

  const cancelCategoryToggle = () => {
    setCategoryToggleConfirmation(null);
  };

  const handleAddCategory = () => {
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

    if (newCategory.name.trim()) {
      const category: VideoCategory = {
        id: Date.now().toString(),
        name: newCategory.name.trim(),
        color: newCategory.color,
        dailyLimitCount: newCategory.dailyLimitCount,
        dailyTimeLimit: newCategory.dailyTimeLimit,
        videosWatchedToday: 0,
        timeWatchedToday: 0,
        isActive: true,
      };
      categoriesToAdd.push(category);
    }

    selectedPresets.forEach((presetName) => {
      const preset = PRESET_CATEGORIES.find((p) => p.name === presetName);
      if (preset) {
        const category: VideoCategory = {
          id: (Date.now() + Math.random()).toString(),
          name: preset.name,
          color: preset.color,
          dailyLimitCount: newCategory.dailyLimitCount,
          dailyTimeLimit: newCategory.dailyTimeLimit,
          videosWatchedToday: 0,
          timeWatchedToday: 0,
          isActive: true,
        };
        categoriesToAdd.push(category);
      }
    });

    const currentModeCategories = getCurrentModeCategories();

    updateLimitsSettings({
      categories: {
        ...limitsSettings.categories,
        [activeMode]: [...currentModeCategories, ...categoriesToAdd],
      },
    });

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
    const updatedCategories = currentModeCategories.map((cat: VideoCategory) =>
      cat.id === editingCategory.id
        ? {
            ...cat,
            name: newCategory.name.trim(),
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

  const handleToggleCategory = (categoryId: string) => {
    const currentModeCategories = getCurrentModeCategories();
    const category = currentModeCategories.find((cat: VideoCategory) => cat.id === categoryId);

    if (!category) return;

    if (category.isActive && (activeMode === 'video-count' || activeMode === 'time-category')) {
      setCategoryToggleConfirmation({
        categoryId,
        categoryName: category.name,
        currentState: category.isActive,
        isOpen: true,
      });
    } else {
      const updatedCategories = currentModeCategories.map((cat: VideoCategory) =>
        cat.id === categoryId ? { ...cat, isActive: !cat.isActive } : cat
      );
      updateLimitsSettings({
        categories: {
          ...limitsSettings.categories,
          [activeMode]: updatedCategories,
        },
      });
    }
  };

  const handleResetClick = () => {
    setResetConfirmation({
      isOpen: true,
    });
  };

  const confirmReset = async () => {
    try {
      await chrome.storage.local.remove('youtube_usage_data');

      if (activeMode === 'time-total') {
        setTotalTimeWatched(0);
      }

      console.debug('[ProductiTube] All limits reset');
    } catch (error) {
      console.error('Failed to reset limits:', error);
    }
    setResetConfirmation(null);
  };

  const cancelReset = () => {
    setResetConfirmation(null);
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
          {/* Favorites Section - Only show when favorites exist */}
          {hasFavorites && (
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
                            ({favorite.dailyLimitCount}{' '}
                            {activeMode === 'time-category' ? `• ${favorite.dailyTimeLimit}m` : ''})
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
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100/50 px-6 py-6">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-white rounded-md shadow-sm border border-green-100">
                          <Hash className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-bold text-gray-900 leading-tight">
                            Today&apos;s Usage
                          </CardTitle>
                          <p className="text-xs text-gray-600 mt-0.5">Track daily consumption</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetClick}
                        className="h-8 px-3 text-xs bg-white/80 backdrop-blur-sm border-green-200 hover:bg-white hover:border-green-300 hover:shadow-md transition-all duration-200 ml-3 flex-shrink-0"
                      >
                        <RotateCcw className="w-3 h-3 mr-1.5" />
                        Reset
                      </Button>
                    </div>
                  </div>

                  <CardContent className="pt-2 pb-6 px-6 bg-gradient-to-b from-white to-gray-50/30">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-white to-gray-50/60 rounded-xl p-3 border border-gray-100/60 shadow-sm">
                          <div className="text-xs text-gray-600 mb-1 font-medium">Watched</div>
                          <div className="text-xl font-bold text-gray-800">
                            {totalVideosWatched}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-white to-gray-50/60 rounded-xl p-3 border border-gray-100/60 shadow-sm">
                          <div className="text-xs text-gray-600 mb-1 font-medium">Limit</div>
                          <div className="text-xl font-bold text-gray-800">{totalVideoLimit}</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(getProgressPercentage(totalVideosWatched, totalVideoLimit))}`}
                          style={{
                            width: `${Math.min(getProgressPercentage(totalVideosWatched, totalVideoLimit), 100)}%`,
                          }}
                        />
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
                                {isExceeded && <AlertCircle className="w-3 h-3 text-red-500" />}
                                {!category.isActive && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                    Disabled
                                  </Badge>
                                )}
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
                                <Switch
                                  checked={category.isActive}
                                  onCheckedChange={() => handleToggleCategory(category.id)}
                                  className="scale-75"
                                />
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
                                  className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progressPercentage)}`}
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
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50 px-6 py-6">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-white rounded-md shadow-sm border border-blue-100">
                          <Hourglass className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-bold text-gray-900 leading-tight">
                            Today&apos;s Time Usage
                          </CardTitle>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Monitor your daily watch time
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetClick}
                        className="h-8 px-3 text-xs bg-white/80 backdrop-blur-sm border-blue-200 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200 ml-3 flex-shrink-0"
                      >
                        <RotateCcw className="w-3 h-3 mr-1.5" />
                        Reset
                      </Button>
                    </div>
                  </div>
                  <CardContent className="pt-2 pb-6 px-6 bg-gradient-to-b from-white to-gray-50/30">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-white to-gray-50/60 rounded-xl p-3 border border-gray-100/60 shadow-sm">
                          <div className="text-xs text-gray-600 mb-1 font-medium">Time Watched</div>
                          <div className="text-xl font-bold text-gray-800">
                            {formatTime(totalCategoryTimeWatched)}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-white to-gray-50/60 rounded-xl p-3 border border-gray-100/60 shadow-sm">
                          <div className="text-xs text-gray-600 mb-1 font-medium">Limit</div>
                          <div className="text-xl font-bold text-gray-800">
                            {formatTime(totalCategoryTimeLimit)}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(getProgressPercentage(totalCategoryTimeWatched, totalCategoryTimeLimit))}`}
                          style={{
                            width: `${Math.min(getProgressPercentage(totalCategoryTimeWatched, totalCategoryTimeLimit), 100)}%`,
                          }}
                        />
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
                        const isExceeded = timeWatched >= timeLimit;
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
                                {isExceeded && <AlertCircle className="w-3 h-3 text-red-500" />}
                                {!category.isActive && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                    Disabled
                                  </Badge>
                                )}
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
                                <Switch
                                  checked={category.isActive}
                                  onCheckedChange={() => handleToggleCategory(category.id)}
                                  className="scale-75"
                                />
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
                                  className={`h-2 rounded-full transition-all ${getProgressColor(progressPercentage)}`}
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
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100/50 px-6 py-6">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-white rounded-md shadow-sm border border-purple-100">
                          <Timer className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-bold leading-tight">
                            Today&apos;s Usage
                          </p>
                          <p className="text-xs font-normal text-gray-600 mt-0.5">
                            Your daily progress
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTotalTimeWatched(0)}
                        className="h-8 px-3 text-xs bg-white/80 backdrop-blur-sm border-purple-200 hover:bg-white hover:border-purple-300 hover:shadow-md transition-all duration-200 ml-3 flex-shrink-0"
                      >
                        <RotateCcw className="w-3 h-3 mr-1.5" />
                        Reset
                      </Button>
                    </div>
                  </div>
                  <CardContent className="pt-2 pb-4 px-6 bg-gradient-to-b from-white to-gray-50/30">
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-xl font-bold mb-2">{formatTime(totalTimeWatched)}</div>
                        <div className="text-xs text-gray-600">
                          of {formatTime(totalTimeLimit)} used today
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(getProgressPercentage(totalTimeWatched, totalTimeLimit))}`}
                          style={{
                            width: `${Math.min(getProgressPercentage(totalTimeWatched, totalTimeLimit), 100)}%`,
                          }}
                        />
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {totalTimeWatched >= totalTimeLimit ? (
                            <span className="text-red-600 text-xs font-medium flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              Time limit exceeded
                            </span>
                          ) : (
                            <div className="text-xs">
                              {formatTime(totalTimeLimit - totalTimeWatched)} remaining
                            </div>
                          )}
                        </span>
                        <span className="text-xs font-medium">
                          {Math.round(getProgressPercentage(totalTimeWatched, totalTimeLimit))}%
                        </span>
                      </div>

                      <div className="text-center py-4 px-4 bg-gradient-to-br from-gray-50/80 to-gray-100/60 rounded-xl border border-gray-200/50 backdrop-blur-sm">
                        <p className="text-xs text-gray-600 mb-2">
                          This mode tracks all YouTube videos regardless of content type
                        </p>
                        <Badge variant="secondary" className="text-[10px]">
                          Simple & Universal
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-white shadow-lg border-0 ring-1 ring-gray-200/60 transition-all duration-500 ease-out hover:shadow-xl hover:ring-gray-300/60 rounded-xl overflow-hidden p-0 gap-2">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100/50 px-6 py-6">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-white rounded-md shadow-sm border border-purple-100">
                        <Timer className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-gray-800 text-sm font-bold leading-tight">
                          Total Daily Time Limit
                        </CardTitle>
                        <p className="text-xm font-normal text-gray-600 mt-0.5">
                          Set your global time limit
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        updateLimitsSettings({ totalDailyTimeLimit: totalTimeLimit });
                        setIsTotalLimitSaved(true);
                      }}
                      className="h-8 px-3 text-xs text-black-600 bg-white border border-purple-200 hover:bg-white hover:border-purple-300  hover:shadow-md transition-all duration-200 ml-3 flex-shrink-0"
                    >
                      <Save className="w-4 h-4 mr-1.5" />
                      Save
                    </Button>
                  </div>
                </div>
                <CardContent className="space-y-4 pt-4 pb-6 px-6 bg-white">
                  <div>
                    <Label htmlFor="total-time-limit" className="mb-2 block text-sm">
                      Daily Time Limit (minutes)
                    </Label>
                    <Input
                      id="total-time-limit"
                      type="number"
                      min="5"
                      max="480"
                      value={totalTimeLimit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newLimit = Number.parseInt(e.target.value) || 60;
                        setTotalTimeLimit(newLimit);
                      }}
                      className="focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Total YouTube watch time allowed per day ({formatTime(totalTimeLimit)})
                    </p>
                  </div>
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
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Confirm Mode Change
            </DialogTitle>
            <DialogDescription className="text-sm">
              {modeConfirmation?.enabled ? (
                <>
                  Are you sure you want to <strong>enable</strong>{' '}
                  <span className="font-medium">
                    {modeConfirmation.mode === 'video-count' && 'Video Count by Category'}
                    {modeConfirmation.mode === 'time-category' && 'Time Limit by Category'}
                    {modeConfirmation.mode === 'time-total' && 'Total Time-Based Limit'}
                  </span>{' '}
                  mode?
                  <span className="block mt-2 font-medium">
                    {(() => {
                      if (limitsSettings.isLimitsEnabled && activeMode !== modeConfirmation.mode) {
                        return (
                          <span className="text-amber-600">
                            This will switch from your current mode and reset all limits for the new
                            mode.
                          </span>
                        );
                      } else {
                        if (modeConfirmation.mode === 'video-count') {
                          return (
                            <span className="text-blue-600">
                              You can create categories and set daily video limits for each one.
                            </span>
                          );
                        } else if (modeConfirmation.mode === 'time-category') {
                          return (
                            <span className="text-blue-600">
                              You can create categories and set daily time limits for each one.
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-blue-600">
                              You can set a single daily time limit for all YouTube videos.
                            </span>
                          );
                        }
                      }
                    })()}
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to <strong>disable</strong> all video limits?
                  <span className="block mt-2 text-amber-600 font-medium">
                    This will turn off all daily restrictions.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={confirmModeChange}
              className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 h-9 text-sm"
            >
              {modeConfirmation?.enabled ? 'Enable Mode' : 'Disable Limits'}
            </Button>
            <Button variant="outline" onClick={cancelModeChange} className="h-9 text-sm">
              Cancel
            </Button>
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
            <div>
              <Label htmlFor="edit-category-name" className="mb-1 text-xs">
                Category Name
              </Label>
              <Input
                id="edit-category-name"
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

            {activeMode === 'video-count' && (
              <div>
                <Label htmlFor="edit-daily-limit" className="mb-1 text-xs">
                  Daily Video Limit
                </Label>
                <Input
                  id="edit-daily-limit"
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
                  <p className="text-[10px] text-gray-500 mt-1">Maximum number of videos per day</p>
                )}
              </div>
            )}

            {activeMode === 'time-category' && (
              <div>
                <Label htmlFor="edit-daily-time-limit" className="mb-1 text-xs">
                  Daily Time Limit (minutes)
                </Label>
                <Input
                  id="edit-daily-time-limit"
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
              <span className="block mt-2 text-red-600 font-medium">
                This action cannot be undone. All progress for this category will be lost.
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

      {/* Category Toggle Confirmation Dialog */}
      <Dialog
        open={categoryToggleConfirmation?.isOpen || false}
        onOpenChange={(open) => !open && cancelCategoryToggle()}
      >
        <DialogContent className="max-w-80 rounded-none gap-2">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base flex items-center gap-2 justify-center text-center">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Disable Category
            </DialogTitle>
            <DialogDescription className="text-sm text-center">
              Are you sure you want to disable the category{' '}
              <strong>&quot;{categoryToggleConfirmation?.categoryName}&quot;</strong>?
              <span className="block mt-2 text-amber-600 font-medium">
                This will remove its usage from your daily totals and stop tracking new activity for
                this category.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={confirmCategoryToggle}
              className="flex-1 bg-amber-500 hover:bg-amber-600 h-9 text-sm"
            >
              Disable Category
            </Button>
            <Button variant="outline" onClick={cancelCategoryToggle} className="h-9 text-sm">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetConfirmation?.isOpen || false}
        onOpenChange={(open) => !open && cancelReset()}
      >
        <DialogContent className="max-w-80 rounded-none gap-2">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base flex items-center gap-2 justify-center text-center">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Reset All Usage Data
            </DialogTitle>
            <DialogDescription className="text-sm text-center">
              Are you sure you want to reset all your daily usage data?
              <span className="block mt-2 text-amber-600 font-medium">
                This will clear all today&apos;s video counts and time tracking. This action cannot
                be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={confirmReset}
              className="flex-1 bg-amber-500 hover:bg-amber-600 h-9 text-sm"
            >
              Reset All Data
            </Button>
            <Button variant="outline" onClick={cancelReset} className="h-9 text-sm">
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
    </div>
  );
};

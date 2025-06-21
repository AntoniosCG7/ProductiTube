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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';
import type { LimitsTabProps, VideoCategory } from '@/types';

const PRESET_CATEGORIES = [
  { name: 'Education', color: '#10b981' },
  { name: 'Entertainment', color: '#f59e0b' },
  { name: 'Music', color: '#8b5cf6' },
  { name: 'News', color: '#ef4444' },
  { name: 'Gaming', color: '#06b6d4' },
  { name: 'Sports', color: '#f97316' },
];

const COLOR_OPTIONS = [
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#6366f1',
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
    color: COLOR_OPTIONS[0],
    dailyLimitCount: 5,
    dailyTimeLimit: 60,
  });
  const [totalTimeLimit, setTotalTimeLimit] = useState(limitsSettings.totalDailyTimeLimit || 60);
  const [totalTimeWatched, setTotalTimeWatched] = useState(0);
  const [isTotalLimitSaved, setIsTotalLimitSaved] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);

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

  const handleModeToggle = (mode: LimitMode, enabled: boolean) => {
    if (enabled) {
      setActiveMode(mode);
      setIsTotalLimitSaved(false);
      updateLimitsSettings({
        activeMode: mode,
        isLimitsEnabled: true,
      });
    } else {
      updateLimitsSettings({ isLimitsEnabled: false });
    }
  };

  const handleAddCategory = () => {
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

    if (categoriesToAdd.length === 0) return;

    const currentModeCategories = getCurrentModeCategories();

    updateLimitsSettings({
      categories: {
        ...limitsSettings.categories,
        [activeMode]: [...currentModeCategories, ...categoriesToAdd],
      },
    });

    setNewCategory({
      name: '',
      color: COLOR_OPTIONS[0],
      dailyLimitCount: 5,
      dailyTimeLimit: 60,
    });
    setSelectedPresets([]);
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
    if (!editingCategory || !newCategory.name.trim()) return;

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
      color: COLOR_OPTIONS[0],
      dailyLimitCount: 5,
      dailyTimeLimit: 60,
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    const currentModeCategories = getCurrentModeCategories();
    const updatedCategories = currentModeCategories.filter(
      (cat: VideoCategory) => cat.id !== categoryId
    );
    updateLimitsSettings({
      categories: {
        ...limitsSettings.categories,
        [activeMode]: updatedCategories,
      },
    });
  };

  const handleToggleCategory = (categoryId: string) => {
    const currentModeCategories = getCurrentModeCategories();
    const updatedCategories = currentModeCategories.map((cat: VideoCategory) =>
      cat.id === categoryId ? { ...cat, isActive: !cat.isActive } : cat
    );
    updateLimitsSettings({
      categories: {
        ...limitsSettings.categories,
        [activeMode]: updatedCategories,
      },
    });
  };

  const handleResetAllLimits = () => {
    const currentModeCategories = getCurrentModeCategories();
    const resetCategories = currentModeCategories.map((cat: VideoCategory) => ({
      ...cat,
      videosWatchedToday: 0,
      timeWatchedToday: 0,
    }));
    updateLimitsSettings({
      categories: {
        ...limitsSettings.categories,
        [activeMode]: resetCategories,
      },
    });
    setTotalTimeWatched(0);
  };

  const handleTogglePreset = (presetName: string) => {
    setSelectedPresets((prev) =>
      prev.includes(presetName) ? prev.filter((name) => name !== presetName) : [...prev, presetName]
    );
  };

  const currentModeCategories = getCurrentModeCategories();

  const totalVideosWatched = currentModeCategories.reduce(
    (sum: number, cat: VideoCategory) => sum + cat.videosWatchedToday,
    0
  );
  const totalVideoLimit = currentModeCategories.reduce(
    (sum: number, cat: VideoCategory) => sum + cat.dailyLimitCount,
    0
  );

  const totalCategoryTimeWatched = currentModeCategories.reduce(
    (sum: number, cat: VideoCategory) => sum + (cat.timeWatchedToday || 0),
    0
  );
  const totalCategoryTimeLimit = currentModeCategories.reduce(
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
                        onClick={handleResetAllLimits}
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
                      <Progress
                        value={getProgressPercentage(totalVideosWatched, totalVideoLimit)}
                        className="h-2.5"
                      />
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
                      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 h-8 px-3 text-xs shadow-md hover:shadow-lg transition-all duration-200 border-0 ml-3 flex-shrink-0"
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </Button>
                        </DialogTrigger>

                        <DialogContent>
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
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setNewCategory({ ...newCategory, name: e.target.value })
                              }
                              placeholder="e.g., Education, Entertainment"
                              className="focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8"
                            />
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setNewCategory({
                                    ...newCategory,
                                    dailyLimitCount: Number.parseInt(e.target.value) || 5,
                                  })
                                }
                                className="focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8"
                              />
                              <p className="text-[10px] text-gray-500 mt-1">
                                Maximum videos per day
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="category-color" className="mb-1 text-xs">
                                Color
                              </Label>
                              <Select
                                value={newCategory.color}
                                onValueChange={(color: string) =>
                                  setNewCategory({ ...newCategory, color })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {COLOR_OPTIONS.map((color) => (
                                    <SelectItem key={color} value={color}>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: color }}
                                        />
                                        {color}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
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
                                      className={`h-6 px-2 text-xs ${
                                        isSelected ? 'border-red-500 border-2 bg-red-50' : ''
                                      } ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                className="flex-1 bg-red-500 hover:bg-[#c81e1e] h-8 text-xs"
                              >
                                {selectedPresets.length > 0 && newCategory.name.trim()
                                  ? `Add Category + ${selectedPresets.length} Preset${selectedPresets.length > 1 ? 's' : ''}`
                                  : selectedPresets.length > 0
                                    ? `Add ${selectedPresets.length} Preset${selectedPresets.length > 1 ? 's' : ''}`
                                    : 'Add Category'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsAddDialogOpen(false);
                                  setSelectedPresets([]);
                                }}
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
                        <Hash className="w-10 h-10 opacity-60 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium mb-1 text-gray-700">No categories yet</p>
                      <p className="text-xs text-gray-500">
                        Add categories to manage your video limits
                      </p>
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
                                  onClick={() => handleDeleteCategory(category.id)}
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
                                  {isExceeded ? 'Exceeded' : `${remainingVideos} left`}
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
                        onClick={handleResetAllLimits}
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
                      <Progress
                        value={getProgressPercentage(
                          totalCategoryTimeWatched,
                          totalCategoryTimeLimit
                        )}
                        className="h-2.5"
                      />
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
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 h-8 px-3 text-xs shadow-md hover:shadow-lg transition-all duration-200 border-0 ml-3 flex-shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </Button>
                      </DialogTrigger>

                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-base">Add New Time Category</DialogTitle>
                          <DialogDescription className="text-xs">
                            Create a new category with time-based limits for your YouTube watching.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Label htmlFor="category-name" className="mb-1 text-xs">
                            Category Name
                          </Label>
                          <Input
                            id="category-name"
                            value={newCategory.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setNewCategory({ ...newCategory, name: e.target.value })
                            }
                            placeholder="e.g., Education, Entertainment"
                            className="focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8"
                          />
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
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setNewCategory({
                                  ...newCategory,
                                  dailyTimeLimit: Number.parseInt(e.target.value) || 60,
                                })
                              }
                              className="focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                              Maximum watch time per day ({formatTime(newCategory.dailyTimeLimit)})
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="category-color" className="mb-1 text-sm">
                              Color
                            </Label>
                            <Select
                              value={newCategory.color}
                              onValueChange={(color: string) =>
                                setNewCategory({ ...newCategory, color })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COLOR_OPTIONS.map((color) => (
                                  <SelectItem key={color} value={color}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: color }}
                                      />
                                      {color}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
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
                                    className={`h-6 px-2 text-xs ${
                                      isSelected
                                        ? 'border-red-500 border-2 bg-red-50 text-red-700'
                                        : ''
                                    } ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <div
                                      className="w-2 h-2 rounded-full mr-1"
                                      style={{ backgroundColor: preset.color }}
                                    />
                                    {preset.name}
                                    {isAlreadyAdded && <span className="ml-1 text-[10px]">✓</span>}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleAddCategory}
                              className="flex-1 bg-red-500 hover:bg-red-600 h-8 text-xs"
                            >
                              {selectedPresets.length > 0 && newCategory.name.trim()
                                ? `Add Category + ${selectedPresets.length} Preset${selectedPresets.length > 1 ? 's' : ''}`
                                : selectedPresets.length > 0
                                  ? `Add ${selectedPresets.length} Preset${selectedPresets.length > 1 ? 's' : ''}`
                                  : 'Add Category'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsAddDialogOpen(false);
                                setSelectedPresets([]);
                              }}
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
                <CardContent className="pt-2 pb-4 px-4 bg-gradient-to-b from-white to-gray-50/30">
                  {currentModeCategories.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-gradient-to-br from-gray-50/80 to-gray-100/60 rounded-xl border border-gray-200/50 backdrop-blur-sm">
                      <div className="p-3 bg-white/60 rounded-full w-fit mx-auto mb-3 shadow-sm">
                        <Hourglass className="w-10 h-10 opacity-60 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium mb-1 text-gray-700">
                        No time categories created yet
                      </p>
                      <p className="text-xs text-gray-500">
                        Add categories to start managing your time limits
                      </p>
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
                                  onClick={() => handleDeleteCategory(category.id)}
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
                                    ? 'Time exceeded'
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

                      <Progress
                        value={getProgressPercentage(totalTimeWatched, totalTimeLimit)}
                        className="h-2.5"
                      />

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

      {/* Edit Category Dialog */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={(open: boolean) => !open && setEditingCategory(null)}
      >
        <DialogContent>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                className="focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8"
              />
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewCategory({
                      ...newCategory,
                      dailyLimitCount: Number.parseInt(e.target.value) || 5,
                    })
                  }
                  className="focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8"
                />
                <p className="text-[10px] text-gray-500 mt-1">Maximum number of videos per day</p>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewCategory({
                      ...newCategory,
                      dailyTimeLimit: Number.parseInt(e.target.value) || 60,
                    })
                  }
                  className="focus-visible:ring-red-500 focus-visible:border-red-500 focus-visible:ring-[1.5px] text-sm h-8"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Maximum watch time per day ({formatTime(newCategory.dailyTimeLimit)})
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="edit-category-color" className="mb-1 text-xs">
                Color
              </Label>
              <Select
                value={newCategory.color}
                onValueChange={(color: string) => setNewCategory({ ...newCategory, color })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((color) => (
                    <SelectItem key={color} value={color}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        {color}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateCategory}
                className="flex-1 bg-red-500 hover:bg-red-600 h-8 text-xs"
              >
                Update Category
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingCategory(null)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

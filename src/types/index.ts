export interface Settings {
  hideHomeFeed: boolean;
  hideShorts: boolean;
  hideSubscriptions: boolean;
  hideExplore: boolean;
  hideMoreFromYoutube: boolean;
  disableAutoplay: boolean;
  hideEndScreenCards: boolean;
  hideEndScreenFeed: boolean;
  hideChannel: boolean;
  hideVideoInfo: boolean;
  hideDescription: boolean;
  hideButtonsBar: boolean;
  hideComments: boolean;
  hideTopHeader: boolean;
  hideNotifications: boolean;
  hideRecommended: boolean;
  hideLiveChat: boolean;
  hidePlaylist: boolean;
  blurThumbnails: boolean;
}

export interface VideoCategory {
  id: string;
  name: string;
  color: string;
  dailyLimitCount: number;
  dailyTimeLimit?: number;
  videosWatchedToday: number;
  timeWatchedToday?: number;
  isActive: boolean;
}

export interface LimitsSettings {
  isLimitsEnabled: boolean;
  categories: VideoCategory[];
  activeMode?: 'video-count' | 'time-category' | 'time-total';
  totalDailyTimeLimit?: number;
}

export interface LimitsTabProps {
  limitsSettings: LimitsSettings;
  updateLimitsSettings: (updates: Partial<LimitsSettings>) => void;
}

export interface FeatureCategory {
  title: string;
  description: string;
  features: {
    key: keyof Settings;
    label: string;
  }[];
}

export interface Message {
  type: 'SETTINGS_UPDATED';
  settings: Settings;
}

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

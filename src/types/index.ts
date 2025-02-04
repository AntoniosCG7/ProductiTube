export interface Settings {
  // Interface Controls
  hideHomeFeed: boolean;
  hideVideoSidebar: boolean;
  hideRecommended: boolean;
  hideLiveChat: boolean;
  hidePlaylist: boolean;
  hideFundraiser: boolean;

  // Video Overlay Controls
  hideEndScreenFeed: boolean;
  hideEndScreenCards: boolean;
  hideShorts: boolean;
  hideComments: boolean;
  hideMixes: boolean;

  // Content Controls
  hideMerchOffers: boolean;
  hideVideoInfo: boolean;
  hideButtonsBar: boolean;
  hideChannel: boolean;
  hideDescription: boolean;

  // Global Page Controls
  hideTopHeader: boolean;
  hideNotifications: boolean;
  hideSearchResults: boolean;
  hideExplore: boolean;
  hideSubscriptions: boolean;
}

export interface FeatureCategory {
  title: string;
  description: string;
  features: {
    key: keyof Settings;
    label: string;
    description: string;
  }[];
}

export interface Message {
  type: 'SETTINGS_UPDATED';
  settings: Settings;
}

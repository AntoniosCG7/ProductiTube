export interface Settings {
  cleanMode: boolean;
  hideComments: boolean;
  hideRelated: boolean;
  hideShorts: boolean;
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

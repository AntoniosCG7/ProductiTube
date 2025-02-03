export interface Settings {
  cleanMode: boolean;
  hideComments: boolean;
  hideRelated: boolean;
  hideShorts: boolean;
}

export interface Message {
  type: 'SETTINGS_UPDATED';
  settings: Settings;
}

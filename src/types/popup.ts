// import {LimitsSettings } from './index';
import { Settings } from './index';
import { featureCategories } from '../popup/constants/featureCategories';

export type TabId = 'controls' | 'limits'; // | 'stats';

export interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export interface ControlsTabProps {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: boolean) => Promise<void>;
  isLoading?: boolean;
}

export interface FooterProps {
  activeControlsCount: number;
  onResetSettings: () => void;
}

export interface CategorySectionProps {
  category: (typeof featureCategories)[number];
  settings: Settings;
  updateSetting: ControlsTabProps['updateSetting'];
  isLoading?: boolean;
}

// export interface StatsTabProps {
//   limitsSettings?: LimitsSettings;
//   className?: string;
// }

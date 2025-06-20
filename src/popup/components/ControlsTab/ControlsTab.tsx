import React from 'react';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';
import { ControlsTabProps } from '@/types/popup';
import { Settings } from '@/types';
import { FeatureToggle } from '../FeatureToggle/FeatureToggle';
import { featureCategories } from '../../constants/featureCategories';

const CategorySection: React.FC<{
  category: (typeof featureCategories)[0];
  settings: Settings;
  updateSetting: ControlsTabProps['updateSetting'];
  isLast: boolean;
}> = ({ category, settings, updateSetting, isLast }) => (
  <div className={isLast ? 'mb-0' : 'mb-6'}>
    <div className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center gap-1">
        <h3 className="text-base font-bold text-gray-900">{category.title}</h3>
        <SimpleTooltip content={category.description}>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 text-gray-400 hover:text-gray-600"
            style={{ height: '16px', width: '16px', marginTop: '4px' }}
          >
            <Info style={{ height: '12px', width: '12px' }} />
          </Button>
        </SimpleTooltip>
      </div>
    </div>

    <div className="space-y-2">
      {category.features.map((feature) => (
        <FeatureToggle
          key={feature.key}
          label={feature.label}
          checked={settings[feature.key]}
          onChange={(checked) => updateSetting(feature.key, checked)}
        />
      ))}
    </div>
  </div>
);

export const ControlsTab: React.FC<ControlsTabProps> = ({ settings, updateSetting }) => (
  <div className="py-6">
    {featureCategories.map((category, index) => (
      <React.Fragment key={category.title}>
        <CategorySection
          category={category}
          settings={settings}
          updateSetting={updateSetting}
          isLast={index === featureCategories.length - 1}
        />
        {index < featureCategories.length - 1 && <Separator className="my-6 opacity-30" />}
      </React.Fragment>
    ))}
  </div>
);

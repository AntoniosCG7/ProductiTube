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
}> = ({ category, settings, updateSetting }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between mb-4 px-1">
      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        {category.title}
        <SimpleTooltip content={category.description}>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600 mr-1 mt-2"
          >
            <Info className="h-4 w-4" />
          </Button>
        </SimpleTooltip>
      </h3>
    </div>
    <div className="space-y-3">
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
  <div className="py-4">
    {featureCategories.map((category, index) => (
      <React.Fragment key={category.title}>
        <CategorySection category={category} settings={settings} updateSetting={updateSetting} />
        {index < featureCategories.length - 1 && <Separator className="my-8" />}
      </React.Fragment>
    ))}
  </div>
);

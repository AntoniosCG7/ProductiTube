import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, HelpCircle } from 'lucide-react';
import { FooterProps } from '@/types/popup';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import { HelpModal } from '../HelpModal/HelpModal';

export const Footer: React.FC<FooterProps> = ({ activeControlsCount, onResetSettings }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <div className="bg-gray-200 px-4 py-3 flex justify-between items-center border-t border-gray-300">
        <p className="text-sm text-gray-700 font-medium">{activeControlsCount} controls active</p>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm hover:bg-gray-300 cursor-pointer"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm hover:bg-gray-300 cursor-pointer"
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle className="h-4 w-4" />
            Help
          </Button>
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onResetSettings={onResetSettings}
      />

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
};

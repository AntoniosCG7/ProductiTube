import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, HelpCircle } from 'lucide-react';
import { FooterProps } from '@/types/popup';

export const Footer: React.FC<FooterProps> = ({ activeControlsCount }) => (
  <div className="bg-gray-200 px-4 py-3 flex justify-between items-center border-t border-gray-300">
    <p className="text-sm text-gray-700 font-medium">{activeControlsCount} controls active</p>
    <div className="flex gap-1">
      {[
        { icon: Settings, label: 'Settings' },
        { icon: HelpCircle, label: 'Help' },
      ].map(({ icon: Icon, label }) => (
        <Button
          key={label}
          variant="ghost"
          size="sm"
          className="text-sm hover:bg-gray-300 cursor-pointer"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  </div>
);

import React from 'react';
import { Eye, Clock, BarChart3 } from 'lucide-react';
import { NavigationProps, TabId } from '@/types/popup';

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { value: 'controls', icon: Eye, label: 'CONTROLS' },
    { value: 'limits', icon: Clock, label: 'LIMITS' },
    { value: 'stats', icon: BarChart3, label: 'STATS' },
  ] as const;

  return (
    <div className="flex border-b border-gray-200 bg-white">
      {tabs.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onTabChange(value as TabId)}
          className={`flex-1 flex flex-col items-center py-3 px-2 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === value
              ? 'text-[#f52f30] border-b-2 border-[#f52f30]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Icon className={`mb-1 ${value === 'controls' ? 'h-6 w-6' : 'h-5 w-5'}`} />
          {label}
        </button>
      ))}
    </div>
  );
};

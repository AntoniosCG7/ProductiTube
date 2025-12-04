import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, RotateCcw, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResetSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
  onResetSettings,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetSettings = () => {
    onResetSettings();
    setShowResetConfirm(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <div className="p-1.5 bg-gray-100 rounded-md">
              <Settings className="w-4 h-4 text-gray-600" />
            </div>
            Settings
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Customize your ProductiTube experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Data Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Data</h3>

            {!showResetConfirm ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-md">
                    <RotateCcw className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Reset All Settings</p>
                    <p className="text-xs text-gray-500">Restore all controls to defaults</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  Reset
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Are you sure?</p>
                    <p className="text-xs text-red-600 mt-1">
                      This will reset all your control settings to their default values.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowResetConfirm(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleResetSettings}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Reset All
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

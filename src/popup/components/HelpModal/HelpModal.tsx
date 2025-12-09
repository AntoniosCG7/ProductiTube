import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, Star, Bug, ExternalLink, Heart } from 'lucide-react';

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXTENSION_VERSION = '1.0.0';
const CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/fldinfajgbahlbnnaimpgofhgbcmjdhp?utm_source=item-share-cb';
const REPORT_EMAIL = 'support@productitube.com';

export const HelpModal: React.FC<HelpModalProps> = ({ open, onOpenChange }) => {
  const handleRateClick = () => {
    chrome.tabs.create({ url: CHROME_STORE_URL });
  };

  const handleReportClick = () => {
    const subject = encodeURIComponent(`ProductiTube Bug Report - v${EXTENSION_VERSION}`);
    const body = encodeURIComponent(
      `Please describe the issue you encountered:\n\n\n\n---\nVersion: ${EXTENSION_VERSION}\nBrowser: ${navigator.userAgent}`
    );
    chrome.tabs.create({ url: `mailto:${REPORT_EMAIL}?subject=${subject}&body=${body}` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <HelpCircle className="w-4 h-4 text-blue-600" />
            </div>
            Help & About
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Get help and learn more about ProductiTube
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* About Section */}
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-100">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 shadow-lg overflow-hidden">
              <img
                src={chrome.runtime.getURL('icons/icon128.png')}
                alt="ProductiTube"
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-lg font-bold text-gray-900">ProductiTube</h3>
            <p className="text-sm text-gray-600 mt-1">Your YouTube, Your Rules</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-gray-200">
              <span className="text-xs font-medium text-gray-600">Version</span>
              <span className="text-xs font-bold text-red-600">{EXTENSION_VERSION}</span>
            </div>
          </div>

          <Separator />

          {/* Actions Section */}
          <div className="space-y-2">
            {/* Rate & Review */}
            <button
              onClick={handleRateClick}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer text-left"
            >
              <div className="p-2 bg-yellow-100 rounded-md">
                <Star className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Rate & Review</p>
                <p className="text-xs text-gray-500">Love ProductiTube? Leave a review!</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </button>

            {/* Report Issue */}
            <button
              onClick={handleReportClick}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer text-left"
            >
              <div className="p-2 bg-red-100 rounded-md">
                <Bug className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Report an Issue</p>
                <p className="text-xs text-gray-500">Found a bug? Let us know</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for productivity
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

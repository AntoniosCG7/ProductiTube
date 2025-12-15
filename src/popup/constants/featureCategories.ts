import { FeatureCategory } from '@/types';

export const featureCategories: FeatureCategory[] = [
  {
    title: 'Homepage Controls',
    description: 'Customize the homepage layout and content visibility.',
    features: [
      { key: 'hideHomeFeed', label: 'Hide Home Feed' },
      { key: 'hideShorts', label: 'Hide Shorts' },
      { key: 'hideSubscriptions', label: 'Hide Subscriptions' },
      { key: 'hideExplore', label: 'Hide Explore' },
      { key: 'hideMoreFromYoutube', label: 'Hide More from YouTube' },
    ],
  },
  {
    title: 'Playback Controls',
    description: 'Manage video playback features and related elements.',
    features: [
      { key: 'disableAutoplay', label: 'Disable Autoplay' },
      { key: 'hideEndScreenCards', label: 'Hide End Screen Cards' },
      { key: 'hideEndScreenFeed', label: 'Hide End Screen Feed' },
    ],
  },
  {
    title: 'Content Visibility',
    description: 'Control the visibility of video details and interactions.',
    features: [
      { key: 'hideChannel', label: 'Hide Channel' },
      { key: 'hideVideoInfo', label: 'Hide Video Info' },
      { key: 'hideDescription', label: 'Hide Description' },
      { key: 'hideButtonsBar', label: 'Hide Buttons Bar' },
      { key: 'hideComments', label: 'Hide Comments' },
      { key: 'blurThumbnails', label: 'Blur Thumbnails' },
      { key: 'hideVideoPreview', label: 'Block Video Preview' },
    ],
  },
  {
    title: 'Header Controls',
    description: 'Hide header and notification elements.',
    features: [
      { key: 'hideTopHeader', label: 'Hide Top Header' },
      { key: 'hideNotifications', label: 'Hide Notifications' },
    ],
  },
  {
    title: 'Sidebar Controls',
    description: 'Manage visibility of sidebar content and interactions.',
    features: [
      { key: 'hideRecommended', label: 'Hide Recommended' },
      { key: 'hideLiveChat', label: 'Hide Live Chat' },
      { key: 'hidePlaylist', label: 'Hide Playlist' },
    ],
  },
];

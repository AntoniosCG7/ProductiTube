import { FeatureCategory } from '@/types';

export const featureCategories: FeatureCategory[] = [
  {
    title: 'Interface Controls',
    description: 'Customize YouTube interface elements',
    features: [
      {
        key: 'hideHomeFeed',
        label: 'Hide Home Feed',
      },
      {
        key: 'hideRecommended',
        label: 'Hide Recommended',
      },
      {
        key: 'hideLiveChat',
        label: 'Hide Live Chat',
      },
      {
        key: 'hidePlaylist',
        label: 'Hide Playlist',
      },
      {
        key: 'hideFundraiser',
        label: 'Hide Fundraiser',
      },
    ],
  },
  {
    title: 'Video Overlay Controls',
    description: 'Manage video-related elements',
    features: [
      {
        key: 'hideEndScreenFeed',
        label: 'Hide End Screen Feed',
      },
      {
        key: 'hideEndScreenCards',
        label: 'Hide End Screen Cards',
      },
      {
        key: 'hideShorts',
        label: 'Hide Shorts',
      },
      {
        key: 'hideComments',
        label: 'Hide Comments',
      },
      {
        key: 'hideMixes',
        label: 'Hide Mixes',
      },
    ],
  },
  {
    title: 'Content Controls',
    description: 'Manage additional content elements',
    features: [
      {
        key: 'hideMerchOffers',
        label: 'Hide Merch & Offers',
      },
      {
        key: 'hideVideoInfo',
        label: 'Hide Video Info',
      },
      {
        key: 'hideButtonsBar',
        label: 'Hide Buttons Bar',
      },
      {
        key: 'hideChannel',
        label: 'Hide Channel',
      },
      {
        key: 'hideDescription',
        label: 'Hide Description',
      },
    ],
  },
  {
    title: 'Global Page Controls',
    description: 'Manage site-wide elements',
    features: [
      {
        key: 'hideTopHeader',
        label: 'Hide Top Header',
      },
      {
        key: 'hideNotifications',
        label: 'Hide Notifications',
      },
      {
        key: 'hideSearchResults',
        label: 'Hide Search Results',
      },
      {
        key: 'hideExplore',
        label: 'Hide Explore',
      },
      {
        key: 'hideSubscriptions',
        label: 'Hide Subscriptions',
      },
    ],
  },
];

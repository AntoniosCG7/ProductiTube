import { FeatureCategory } from '@/types';

export const featureCategories: FeatureCategory[] = [
  {
    title: 'Interface Controls',
    description: 'Customize YouTube interface elements',
    features: [
      {
        key: 'hideHomeFeed',
        label: 'Hide Home Feed',
        description: 'Remove the main feed from homepage',
      },
      {
        key: 'hideVideoSidebar',
        label: 'Hide Video Sidebar',
        description: 'Remove the sidebar from video pages',
      },
      {
        key: 'hideRecommended',
        label: 'Hide Recommended',
        description: 'Remove recommended videos',
      },
      {
        key: 'hideLiveChat',
        label: 'Hide Live Chat',
        description: 'Remove live chat section',
      },
      {
        key: 'hidePlaylist',
        label: 'Hide Playlist',
        description: 'Remove playlist panel',
      },
      {
        key: 'hideFundraiser',
        label: 'Hide Fundraiser',
        description: 'Remove fundraiser boxes',
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
        description: 'Remove end screen video suggestions',
      },
      {
        key: 'hideEndScreenCards',
        label: 'Hide End Screen Cards',
        description: 'Remove end screen cards',
      },
      {
        key: 'hideShorts',
        label: 'Hide Shorts',
        description: 'Remove Shorts from feed',
      },
      {
        key: 'hideComments',
        label: 'Hide Comments',
        description: 'Remove comment section',
      },
      {
        key: 'hideMixes',
        label: 'Hide Mixes',
        description: 'Remove YouTube mix suggestions',
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
        description: 'Remove merchandise and promotional offers',
      },
      {
        key: 'hideVideoInfo',
        label: 'Hide Video Info',
        description: 'Remove video metadata and information',
      },
      {
        key: 'hideButtonsBar',
        label: 'Hide Buttons Bar',
        description: 'Remove like/dislike and share buttons',
      },
      {
        key: 'hideChannel',
        label: 'Hide Channel',
        description: 'Remove channel information section',
      },
      {
        key: 'hideDescription',
        label: 'Hide Description',
        description: 'Remove video description',
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
        description: 'Remove the top navigation bar',
      },
      {
        key: 'hideNotifications',
        label: 'Hide Notifications',
        description: 'Remove notification bell and popups',
      },
      {
        key: 'hideSearchResults',
        label: 'Hide Search Results',
        description: 'Filter out unwanted search results',
      },
      {
        key: 'hideExplore',
        label: 'Hide Explore',
        description: 'Remove explore and trending sections',
      },
      {
        key: 'hideSubscriptions',
        label: 'Hide Subscriptions',
        description: 'Remove subscription feed and buttons',
      },
    ],
  },
];

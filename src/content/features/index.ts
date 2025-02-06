import { initializeComments } from './comments.ts';
import { initializeRecommendedVideos } from './recommended-videos.ts';
import { initializeShorts } from './shorts.ts';
import { initializeHideHomeFeed } from './home-feed.ts';

export const initializeFeatures = async () => {
  try {
    const settings = await chrome.storage.sync.get();
    const applyFeatures = () => {
      if ('hideHomeFeed' in settings) {
        initializeHideHomeFeed(settings.hideHomeFeed);
      }
      if ('hideRecommended' in settings) {
        initializeRecommendedVideos(settings.hideRecommended);
      }
      if ('hideComments' in settings) {
        initializeComments(settings.hideComments);
      }
      if ('hideShorts' in settings) {
        initializeShorts(settings.hideShorts);
      }
    };

    applyFeatures();
    setTimeout(applyFeatures, 1000);
  } catch (error) {
    console.error('Failed to initialize features:', error);
  }
};

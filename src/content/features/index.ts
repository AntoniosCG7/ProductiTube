import { initializeCleanMode } from './clean-mode.ts';
import { initializeComments } from './comments.ts';
import { initializeRelatedVideos } from './related-videos.ts';
import { initializeShorts } from './shorts.ts';

export const initializeFeatures = async () => {
  try {
    const settings = await chrome.storage.sync.get();
    const applyFeatures = () => {
      if ('cleanMode' in settings) {
        initializeCleanMode(settings.cleanMode);
      }
      if ('hideComments' in settings) {
        initializeComments(settings.hideComments);
      }
      if ('hideRelated' in settings) {
        initializeRelatedVideos(settings.hideRelated);
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

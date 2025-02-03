import { initializeCleanMode } from './clean-mode.ts';
import { initializeComments } from './comments.ts';
import { initializeHomepage } from './homepage.ts';
import { initializeRelatedVideos } from './related-videos.ts';
import { initializeShorts } from './shorts.ts';

export const initializeFeatures = async () => {
  try {
    const settings = await chrome.storage.sync.get();

    if (settings.cleanMode) initializeCleanMode();
    if (settings.hideComments) initializeComments();
    if (settings.hideRelated) initializeRelatedVideos();
    if (settings.hideShorts) initializeShorts();

    // Initialize homepage modifications
    initializeHomepage();
  } catch (error) {
    console.error('Failed to initialize features:', error);
  }
};

import { initializeCleanMode } from './clean-mode';
import { initializeComments } from './comments';
import { initializeHomepage } from './homepage';
import { initializeRelatedVideos } from './related-videos';
import { initializeShorts } from './shorts';

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
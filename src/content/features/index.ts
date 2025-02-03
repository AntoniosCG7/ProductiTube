import { initializeCleanMode } from './clean-mode.ts';
import { initializeComments } from './comments.ts';
import { initializeHomepage } from './homepage.ts';
import { initializeRelatedVideos } from './related-videos.ts';
import { initializeShorts } from './shorts.ts';

export const initializeFeatures = async () => {
  try {
    const settings = await chrome.storage.sync.get();
    console.log('Applying settings:', settings);

    // Apply each feature with a small delay to ensure DOM elements are available
    const applyFeatures = () => {
      if (settings.cleanMode) {
        console.log('Applying clean mode');
        initializeCleanMode();
      }
      if (settings.hideComments) {
        console.log('Hiding comments');
        initializeComments();
      }
      if (settings.hideRelated) {
        console.log('Hiding related videos');
        initializeRelatedVideos();
      }
      if (settings.hideShorts) {
        console.log('Hiding shorts');
        initializeShorts();
      }
    };

    // Initial application
    applyFeatures();

    // Re-apply after a short delay to catch dynamically loaded content
    setTimeout(applyFeatures, 1000);
  } catch (error) {
    console.error('Failed to initialize features:', error);
  }
};

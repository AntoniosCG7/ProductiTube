/**
 * High-performance YouTube element hiding system
 * Uses CSS-only approach for optimal performance
 */

// ===============================
// FEATURE DEFINITIONS
// ===============================

interface FeatureConfig {
  cssClass: string;
  selectors: string[];
  effect?: 'hide' | 'blur';
}

const FEATURES: Record<string, FeatureConfig> = {
  'hide-home-feed': {
    cssClass: 'productitube-hide-home-feed',
    selectors: ['#chips-wrapper', 'ytd-browse[page-subtype="home"] #contents'],
  },
  'hide-shorts': {
    cssClass: 'productitube-hide-shorts',
    selectors: [
      'ytd-rich-shelf-renderer',
      'ytd-reel-shelf-renderer',
      '#shorts-container',
      'ytd-guide-entry-renderer:has([title="Shorts"])',
    ],
  },
  'hide-subscriptions': {
    cssClass: 'productitube-hide-subscriptions',
    selectors: [
      'ytd-guide-entry-renderer:has(a[href="/feed/subscriptions"])',
      '#sections > ytd-guide-section-renderer:nth-child(2)',
      'ytd-browse[page-subtype="subscriptions"]',
    ],
  },
  'hide-explore': {
    cssClass: 'productitube-hide-explore',
    selectors: [
      '#sections > ytd-guide-section-renderer:nth-child(4)',
      'ytd-browse[page-subtype="trending"]',
    ],
  },
  'hide-more-youtube': {
    cssClass: 'productitube-hide-more-youtube',
    selectors: ['#sections > ytd-guide-section-renderer:nth-child(5)'],
  },
  'hide-top-header': {
    cssClass: 'productitube-hide-top-header',
    selectors: ['ytd-masthead', '#masthead-container', '#container.ytd-masthead'],
  },
  'hide-notifications': {
    cssClass: 'productitube-hide-notifications',
    selectors: [
      'ytd-notification-topbar-button-renderer',
      '#notification-count',
      'ytd-notification-renderer',
    ],
  },
  'hide-recommended-videos': {
    cssClass: 'productitube-hide-recommended-videos',
    selectors: [
      '#related',
      '#items.ytd-watch-next-secondary-results-renderer',
      '#secondary ytd-compact-video-renderer',
      '#secondary ytd-item-section-renderer:has(ytd-compact-video-renderer)',
      '#contents > ytd-rich-item-renderer:has(ytd-compact-video-renderer)',
    ],
  },
  'hide-playlist': {
    cssClass: 'productitube-hide-playlist',
    selectors: [
      'ytd-playlist-panel-renderer',
      '#playlist-container',
      '#playlist-action-menu',
      'ytd-playlist-video-renderer',
      '.ytd-playlist-panel-renderer',
    ],
  },
  'hide-live-chat': {
    cssClass: 'productitube-hide-live-chat',
    selectors: [
      'ytd-live-chat-frame',
      '#chat:not([collapsed])',
      '#chat-container',
      '#live-chat-container',
    ],
  },
  'hide-channel': {
    cssClass: 'productitube-hide-channel',
    selectors: [
      '#owner',
      '#owner-container',
      'ytd-video-owner-renderer',
      '#upload-info',
      '#top-row ytd-channel-name',
    ],
  },
  'hide-video-info': {
    cssClass: 'productitube-hide-video-info',
    selectors: [
      'ytd-watch-metadata #title',
      'ytd-watch-metadata #info',
      'ytd-watch-metadata #top-row',
      'ytd-watch-metadata #bottom-row',
      'ytd-watch-metadata .ytd-video-primary-info-renderer',
      'ytd-watch-metadata #description',
      'ytd-watch-metadata #description-inline-expander',
      'ytd-watch-metadata .ytd-video-secondary-info-renderer',
    ],
  },
  'hide-description': {
    cssClass: 'productitube-hide-description',
    selectors: ['#description', '#structured-description'],
  },
  'hide-buttons-bar': {
    cssClass: 'productitube-hide-buttons-bar',
    selectors: [
      '#top-level-buttons-computed',
      '#subscribe-button',
      '#actions-inner',
      'ytd-watch-metadata #menu-container',
      'ytd-watch-metadata .ytd-menu-renderer',
      '#flexible-item-buttons',
    ],
  },
  'hide-comments': {
    cssClass: 'productitube-hide-comments',
    selectors: [
      '#comments',
      'ytd-comments',
      '#comment-section-renderer',
      '#sections > ytd-comments',
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-comments-section"]',
    ],
  },
  'hide-end-screen-cards': {
    cssClass: 'productitube-hide-end-screen-cards',
    selectors: [
      '.ytp-ce-element.ytp-ce-video.ytp-ce-element-show',
      '.ytp-ce-element.ytp-ce-channel.ytp-ce-element-show',
      '.ytp-ce-element.ytp-ce-playlist.ytp-ce-element-show',
      '.ytp-ce-element.ytp-ce-link.ytp-ce-element-show',
      '.ytp-ce-element.ytp-ce-web.ytp-ce-element-show',
      '.ytp-ce-element:not(.ytp-ce-video)',
    ],
  },
  'hide-end-screen-feed': {
    cssClass: 'productitube-hide-end-screen-feed',
    selectors: [
      '.ytp-endscreen-content',
      '.ytp-fullscreen-grid-stills-container',
      '.ytp-videowall-still',
      '.ytp-suggestion-set',
    ],
  },
  'blur-thumbnails': {
    cssClass: 'productitube-blur-thumbnails',
    effect: 'blur',
    selectors: [
      '#thumbnail',
      '.ytThumbnailViewModelImage',
      'yt-thumbnail-view-model',
      '.ytCoreImageHost:not(.yt-core-attributed-string__image-element)',
      'ytd-reel-item-renderer img',
      'ytd-reel-shelf-renderer img',
      'ytd-rich-shelf-renderer img',
      'yt-collection-thumbnail-view-model',
      '.ytp-ce-element.ytp-ce-video.ytp-ce-element-show',
      '.ytp-endscreen-content',
      '.ytp-autonav-endscreen-upnext-thumbnail',
      'ytd-browse[page-subtype="subscriptions"] ytd-thumbnail img',
      'ytd-browse[page-subtype="trending"] ytd-thumbnail img',
      '#inline-preview-player > div.html5-video-container > video',
    ],
  },
};

// ===============================
// CSS GENERATION
// ===============================

/**
 * Dynamically generates CSS rules to hide elements for each feature.
 */
function generateCSS(): string {
  const rules: string[] = [];

  for (const [featureName, config] of Object.entries(FEATURES)) {
    const selectorList = config.selectors
      .map((selector) => `.${config.cssClass} ${selector}`)
      .join(',\n  ');

    const effect = config.effect || 'hide';
    let cssRule: string;

    if (effect === 'blur') {
      cssRule = `  /* ${featureName.replace('-', ' ').toUpperCase()} */\n  ${selectorList} {\n    filter: blur(10px) !important;\n    transition: filter 0.2s ease !important;\n  }`;
    } else {
      cssRule = `  /* ${featureName.replace('-', ' ').toUpperCase()} */\n  ${selectorList} {\n    display: none !important;\n  }`;
    }

    rules.push(cssRule);
  }

  return `
  /* ProductiTube - High-performance element hiding */
${rules.join('\n\n')}
`;
}

// ===============================
// STATE
// ===============================

const activeFeatures = new Set<string>();
let stylesInjected = false;

/**
 * Injects the generated CSS into the document, if not already injected.
 */
function injectStyles(): void {
  if (stylesInjected) return;

  const style = document.createElement('style');
  style.textContent = generateCSS();
  (document.head || document.documentElement).appendChild(style);
  stylesInjected = true;
}

/**
 * Applies or removes feature CSS classes on the <html> element based on current state.
 */
function updateDocumentClasses(): void {
  const root = document.documentElement;
  const allClasses = Object.values(FEATURES).map((f) => f.cssClass);

  root.classList.remove(...allClasses);

  activeFeatures.forEach((featureClass) => {
    root.classList.add(featureClass);
  });
}

// ===============================
// PUBLIC API
// ===============================

/**
 * Enables a feature by injecting CSS and toggling the relevant class on <html>.
 * Also sets up a MutationObserver fallback if needed.
 *
 * @param featureName - The key name of the feature to enable
 * @returns A cleanup function that disables the feature
 */
export function enableFeature(featureName: string): () => void {
  const config = FEATURES[featureName];
  if (!config) {
    return () => {};
  }

  injectStyles();
  activeFeatures.add(config.cssClass);
  updateDocumentClasses();

  return () => {
    activeFeatures.delete(config.cssClass);
    updateDocumentClasses();
  };
}

/**
 * Returns a list of all available feature keys.
 */
export function getAvailableFeatures(): string[] {
  return Object.keys(FEATURES);
}

/**
 * Checks whether a given feature is currently active.
 *
 * @param featureName - The name of the feature to check
 * @returns True if the feature is active, false otherwise
 */
export function isFeatureActive(featureName: string): boolean {
  const config = FEATURES[featureName];
  return config ? activeFeatures.has(config.cssClass) : false;
}

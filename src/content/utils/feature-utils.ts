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
  needsFallback?: boolean;
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
    needsFallback: true, // For :has() compatibility
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
      '#sections > ytd-guide-section-renderer:nth-child(3)',
      'ytd-browse[page-subtype="trending"]',
    ],
  },
  'hide-more-youtube': {
    cssClass: 'productitube-hide-more-youtube',
    selectors: ['#sections > ytd-guide-section-renderer:nth-child(4)'],
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

    rules.push(
      `  /* ${featureName.replace('-', ' ').toUpperCase()} */\n  ${selectorList} {\n    display: none !important;\n  }`
    );
  }

  return `
  /* ProductiTube - High-performance element hiding */
${rules.join('\n\n')}

  /* Fallback for manual hiding */
  .productitube-hidden {
    display: none !important;
  }
`;
}

// ===============================
// STATE
// ===============================

const activeFeatures = new Set<string>();
let stylesInjected = false;
let fallbackObserver: MutationObserver | null = null;

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
// FALLBACK OBSERVER
// ===============================

/**
 * Sets up a MutationObserver fallback for browsers that don't support :has().
 */
function setupFallbackObserver(): void {
  if (fallbackObserver || CSS.supports('selector(:has(a))')) return;

  console.log('[ProductiTube] Setting up fallback observer for browser compatibility');

  const observer = new MutationObserver((records) => {
    if (!activeFeatures.has('productitube-hide-shorts')) return;

    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        const shortsLink = node.querySelector?.('[title="Shorts"]');
        if (shortsLink) {
          const guideEntry = shortsLink.closest('ytd-guide-entry-renderer');
          guideEntry?.classList.add('productitube-hidden');
        }
      }
    }
  });

  const observeSidebar = () => {
    const sidebar = document.querySelector('#guide-content, #sections');
    if (sidebar) {
      observer.observe(sidebar, { childList: true, subtree: true });
      fallbackObserver = observer;
    } else {
      setTimeout(observeSidebar, 100);
    }
  };

  observeSidebar();
}

/**
 * Cleans up the fallback observer and removes manually hidden elements.
 */
function cleanupFallbackObserver(): void {
  if (!fallbackObserver) return;

  fallbackObserver.disconnect();
  fallbackObserver = null;

  document.querySelectorAll('.productitube-hidden').forEach((el) => {
    el.classList.remove('productitube-hidden');
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
    console.warn(`[ProductiTube] Unknown feature: ${featureName}`);
    return () => {};
  }

  injectStyles();
  activeFeatures.add(config.cssClass);
  updateDocumentClasses();

  if (config.needsFallback) {
    setupFallbackObserver();
  }

  return () => {
    activeFeatures.delete(config.cssClass);
    updateDocumentClasses();

    const needsFallback = Array.from(activeFeatures).some(
      (cls) => Object.values(FEATURES).find((f) => f.cssClass === cls)?.needsFallback
    );

    if (!needsFallback) {
      cleanupFallbackObserver();
    }
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

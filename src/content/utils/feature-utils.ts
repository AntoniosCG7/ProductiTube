/**
 * Configuration options for the feature observer
 * @interface ObserverConfig
 */
interface ObserverConfig {
  /** CSS selectors to match target elements */
  selectors: readonly string[];
  /** Debounce time in milliseconds for handling mutations (default: 100ms) */
  debounceMs?: number;
  /** Additional MutationObserver configuration options */
  observerOptions?: MutationObserverInit;
}

/**
 * Callback function type for handling feature state changes
 * @callback FeatureCallback
 * @param {HTMLElement[]} elements - Array of HTML elements affected by the feature
 * @param {boolean} enabled - Current state of the feature (true = enabled, false = disabled)
 */
type FeatureCallback = (elements: HTMLElement[], enabled: boolean) => void;

/**
 * Creates a toggleable feature handler that manages DOM elements using MutationObserver.
 * Useful for features that need to react to dynamic DOM changes and maintain state.
 *
 * @param {ObserverConfig} config - Configuration for element selection and observation
 * @param {FeatureCallback} callback - Function to handle elements when feature state changes
 * @returns {(enabled: boolean) => () => void} Toggle function that returns a cleanup function
 *
 * @example
 * const handler = createFeatureHandler(
 *   { selectors: ['.video-title'], debounceMs: 200 },
 *   (elements, enabled) => {
 *     elements.forEach(el => {
 *       el.style.color = enabled ? 'red' : '';
 *     });
 *   }
 * );
 *
 * // Enable feature
 * const cleanup = handler(true);
 *
 * // Disable feature
 * handler(false);
 *
 * // Cleanup when component unmounts
 * cleanup();
 */
export const createFeatureHandler = (config: ObserverConfig, callback: FeatureCallback) => {
  // Track processed elements to avoid duplicate processing
  const processedElements = new WeakSet<Element>();
  let observer: MutationObserver | null = null;
  let debounceTimeout: number | undefined;
  let isObserving = false;

  /**
   * Finds all DOM elements matching the configured selectors
   * @returns {HTMLElement[]} Array of matching HTML elements
   */
  const findElements = () =>
    config.selectors
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .filter((el): el is HTMLElement => el instanceof HTMLElement);

  /**
   * Processes elements based on the feature's enabled state
   * @param {HTMLElement[]} elements - Elements to process
   * @param {boolean} enabled - Current feature state
   */
  const processElements = (elements: HTMLElement[], enabled: boolean) => {
    if (!elements.length) return;

    try {
      if (enabled) {
        // Only process new elements when enabling
        const newElements = elements.filter((el) => !processedElements.has(el));
        if (newElements.length) {
          callback(newElements, enabled);
          newElements.forEach((element) => processedElements.add(element));
        }
      } else {
        // When disabling, only process elements we previously modified
        const trackedElements = elements.filter((el) => processedElements.has(el));
        if (trackedElements.length) {
          callback(trackedElements, enabled);
          trackedElements.forEach((element) => processedElements.delete(element));
        }
      }
    } catch (error) {
      console.error('Error processing elements:', error);
    }
  };

  /**
   * Debounced handler for DOM mutations
   * @param {boolean} enabled - Current feature state
   */
  const handleMutations = (enabled: boolean) => {
    if (debounceTimeout) {
      window.clearTimeout(debounceTimeout);
    }

    debounceTimeout = window.setTimeout(() => {
      const elements = findElements();
      processElements(elements, enabled);
    }, config.debounceMs ?? 100);
  };

  /**
   * Checks if a mutation is relevant to our selectors
   * @param {MutationRecord} mutation - Mutation record to check
   * @returns {boolean} True if mutation affects our targeted elements
   */
  const isRelevantMutation = (mutation: MutationRecord): boolean => {
    const target = mutation.target as Element;

    // Check if the target itself matches any selector
    if (config.selectors.some((selector) => target.matches?.(selector))) {
      return true;
    }

    // Check if any of the added nodes match any selector
    for (const node of mutation.addedNodes) {
      if (node instanceof Element && config.selectors.some((selector) => node.matches(selector))) {
        return true;
      }
    }

    return false;
  };

  /**
   * Creates or reuses a MutationObserver instance
   * @param {boolean} enabled - Current feature state
   * @returns {MutationObserver} The observer instance
   */
  const getObserver = (enabled: boolean) => {
    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
      if (isObserving && mutations.some(isRelevantMutation)) {
        handleMutations(enabled);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      ...config.observerOptions,
    });

    return observer;
  };

  /**
   * Toggle function that enables/disables the feature
   * @param {boolean} enabled - Whether to enable or disable the feature
   * @returns {() => void} Cleanup function to remove all listeners and observers
   */
  return (enabled: boolean) => {
    isObserving = enabled;

    if (enabled) {
      getObserver(enabled);
    } else {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }

    // Process all matching elements
    const elements = findElements();
    processElements(elements, enabled);

    // Handle SPA navigation
    const navigationHandler = () => {
      if (isObserving) {
        const newElements = findElements();
        processElements(newElements, enabled);
      }
    };

    if (enabled) {
      document.addEventListener('yt-navigate-finish', navigationHandler);
    } else {
      document.removeEventListener('yt-navigate-finish', navigationHandler);
    }

    // Return cleanup function
    return () => {
      isObserving = false;
      document.removeEventListener('yt-navigate-finish', navigationHandler);
      window.clearTimeout(debounceTimeout);
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };
  };
};

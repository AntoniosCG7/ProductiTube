import type { LimitsSettings, VideoCategory } from '@/types';

const LIMITS_STORAGE_KEY = 'youtube_limits_settings';
const USAGE_STORAGE_KEY = 'youtube_usage_data';

interface UsageData {
  [date: string]: {
    [categoryId: string]: number;
  };
}

interface VideoLimitsState {
  isActive: boolean;
  settings: LimitsSettings | null;
  usageData: UsageData;
  modalElement: HTMLElement | null;
  videoElement: HTMLVideoElement | null;
  isProcessingVideo: boolean;
}

const state: VideoLimitsState = {
  isActive: false,
  settings: null,
  usageData: {},
  modalElement: null,
  videoElement: null,
  isProcessingVideo: false,
};

/**
 * Get today's date string for usage tracking
 */
const getTodayString = (): string => {
  return new Date().toDateString();
};

/**
 * Load limits settings and usage data
 */
const loadData = async (): Promise<void> => {
  try {
    const [limitsData, usageData] = await Promise.all([
      chrome.storage.sync.get(LIMITS_STORAGE_KEY),
      chrome.storage.local.get(USAGE_STORAGE_KEY),
    ]);

    state.settings = limitsData[LIMITS_STORAGE_KEY] || null;
    state.usageData = usageData[USAGE_STORAGE_KEY] || {};

    console.debug('[ProductiTube Limits] Loaded data:', {
      settings: state.settings,
      usage: state.usageData,
    });
  } catch (error) {
    console.error('[ProductiTube Limits] Failed to load data:', error);
  }
};

/**
 * Save usage data to storage
 */
const saveUsageData = async (): Promise<void> => {
  try {
    await chrome.storage.local.set({ [USAGE_STORAGE_KEY]: state.usageData });
    console.debug('[ProductiTube Limits] Saved usage data:', state.usageData);
  } catch (error) {
    console.error('[ProductiTube Limits] Failed to save usage data:', error);
  }
};

/**
 * Get videos watched today for a specific category
 */
const getVideosWatchedToday = (categoryId: string): number => {
  const today = getTodayString();
  return state.usageData[today]?.[categoryId] || 0;
};

/**
 * Increment video count for a category
 */
const incrementVideoCount = async (categoryId: string): Promise<void> => {
  const today = getTodayString();

  if (!state.usageData[today]) {
    state.usageData[today] = {};
  }

  state.usageData[today][categoryId] = (state.usageData[today][categoryId] || 0) + 1;
  await saveUsageData();

  console.debug(
    `[ProductiTube Limits] Incremented count for category ${categoryId}:`,
    state.usageData[today][categoryId]
  );
};

/**
 * Create and show the category selection modal
 */
const createCategoryModal = (): HTMLElement => {
  removeModal();

  const modal = document.createElement('div');
  modal.id = 'productitube-category-modal';
  modal.className = 'productitube-modal-overlay';

  const categories = state.settings?.categories['video-count'] || [];
  const activeCategories = categories.filter((cat) => cat.isActive);

  modal.innerHTML = `
    <div class="productitube-modal-content">
      <div class="productitube-modal-header">
        <h3>Categorize this video</h3>
        <p>Select a category for this video, then click Continue.</p>
      </div>
      
      <div class="productitube-modal-body">
        <div class="productitube-category-grid">
          ${activeCategories
            .map((category) => {
              const watchedCount = getVideosWatchedToday(category.id);
              const isExceeded = watchedCount >= category.dailyLimitCount;
              const remaining = category.dailyLimitCount - watchedCount;

              return `
              <button 
                class="productitube-category-option ${isExceeded ? 'exceeded' : ''}" 
                data-category-id="${category.id}"
                data-category-name="${category.name}"
                ${isExceeded ? 'disabled' : ''}
              >
                <div class="productitube-category-color" style="background-color: ${category.color}"></div>
                <div class="productitube-category-info">
                  <div class="productitube-category-name">${category.name}</div>
                  <div class="productitube-category-count">
                    ${watchedCount}/${category.dailyLimitCount} videos
                    ${isExceeded ? '(Limit reached)' : `(${remaining} left)`}
                  </div>
                </div>
              </button>
            `;
            })
            .join('')}
        </div>
        
        ${
          activeCategories.length === 0
            ? `
          <div class="productitube-no-categories">
            <p>No active categories found.</p>
            <p>Please set up categories in the extension popup.</p>
          </div>
        `
            : ''
        }
      </div>
      
      <div class="productitube-modal-footer">
        <button id="productitube-continue-btn" class="productitube-btn-primary" disabled>
          Continue
        </button>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .productitube-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'YouTube Noto', Roboto, Arial, Helvetica, sans-serif;
    }
    
    .productitube-modal-content {
      background: white;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    
    .productitube-modal-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .productitube-modal-header h3 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 500;
      color: #0f0f0f;
    }
    
    .productitube-modal-header p {
      margin: 0;
      font-size: 14px;
      color: #606060;
    }
    
    .productitube-modal-body {
      padding: 20px 24px;
    }
    
    .productitube-category-grid {
      display: grid;
      gap: 12px;
    }
    
    .productitube-category-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
      width: 100%;
    }
    
         .productitube-category-option:hover:not(:disabled) {
       border-color: #ff0000;
       background: #fff5f5;
     }
     
     .productitube-category-option:disabled {
       opacity: 0.5;
       cursor: not-allowed;
       background: #f5f5f5;
     }
     
     .productitube-category-option.exceeded {
       border-color: #d32f2f;
       background: #ffebee;
     }
     
     .productitube-category-option.selected {
       border-color: #ff0000;
       background: #fff5f5;
       border-width: 3px;
       box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.2);
     }
    
    .productitube-category-color {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .productitube-category-info {
      flex: 1;
    }
    
    .productitube-category-name {
      font-weight: 500;
      font-size: 14px;
      color: #0f0f0f;
      margin-bottom: 2px;
    }
    
    .productitube-category-count {
      font-size: 12px;
      color: #606060;
    }
    
    .productitube-no-categories {
      text-align: center;
      padding: 40px 20px;
      color: #606060;
    }
    
    .productitube-no-categories p {
      margin: 0 0 8px 0;
      font-size: 14px;
    }
    
              .productitube-modal-footer {
       padding: 16px 24px 20px;
       border-top: 1px solid #e0e0e0;
       display: flex;
       justify-content: center;
     }
     
     .productitube-btn-primary {
       padding: 12px 32px;
       border: none;
       border-radius: 18px;
       background: #ff0000;
       color: white;
       font-size: 14px;
       font-weight: 500;
       cursor: pointer;
       transition: all 0.2s ease;
       box-shadow: 0 2px 8px rgba(255, 0, 0, 0.2);
     }
     
     .productitube-btn-primary:hover:not(:disabled) {
       background: #cc0000;
       box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
       transform: translateY(-1px);
     }
     
     .productitube-btn-primary:disabled {
       background: #ccc;
       color: #666;
       cursor: not-allowed;
       box-shadow: none;
       transform: none;
     }
  `;

  document.head.appendChild(style);
  document.body.appendChild(modal);

  let selectedCategoryId: string | null = null;

  const categoryButtons = modal.querySelectorAll('.productitube-category-option:not(:disabled)');
  categoryButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      const categoryId = (e.currentTarget as HTMLElement).dataset.categoryId;
      if (categoryId) {
        modal.querySelectorAll('.productitube-category-option').forEach((btn) => {
          btn.classList.remove('selected');
        });

        (e.currentTarget as HTMLElement).classList.add('selected');
        selectedCategoryId = categoryId;

        const continueBtn = modal.querySelector('#productitube-continue-btn') as HTMLButtonElement;
        if (continueBtn) {
          continueBtn.disabled = false;
        }
      }
    });
  });

  const continueButton = modal.querySelector('#productitube-continue-btn');
  continueButton?.addEventListener('click', async () => {
    if (selectedCategoryId) {
      await handleCategorySelection(selectedCategoryId);
    }
  });

  return modal;
};

/**
 * Handle category selection
 */
const handleCategorySelection = async (categoryId: string): Promise<void> => {
  const category = state.settings?.categories['video-count']?.find((cat) => cat.id === categoryId);
  if (!category) return;

  const currentCount = getVideosWatchedToday(categoryId);
  const wouldExceedLimit = currentCount + 1 > category.dailyLimitCount;

  if (wouldExceedLimit) {
    showLimitExceededMessage(category);
  } else {
    await incrementVideoCount(categoryId);

    const newCount = getVideosWatchedToday(categoryId);
    const hasReachedLimit = newCount >= category.dailyLimitCount;

    if (hasReachedLimit) {
      showLimitReachedMessage(category);
    } else {
      resumeVideo();
      removeModal();
    }
  }
};

/**
 * Show limit exceeded message
 */
const showLimitExceededMessage = (category: VideoCategory): void => {
  removeModal();

  const message = document.createElement('div');
  message.className = 'productitube-limit-message';
  message.innerHTML = `
    <div class="productitube-limit-content">
      <div class="productitube-limit-icon">⏰</div>
      <h3>Daily limit reached</h3>
      <p>You've reached your daily limit for <strong>${category.name}</strong> videos.</p>
      <p>You can adjust your limits in the extension popup.</p>
      <button id="productitube-limit-ok" class="productitube-btn-primary">OK</button>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .productitube-limit-message {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      font-family: 'YouTube Noto', Roboto, Arial, Helvetica, sans-serif;
    }
    
    .productitube-limit-content {
      background: white;
      border-radius: 12px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    
    .productitube-limit-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .productitube-limit-content h3 {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 500;
      color: #0f0f0f;
    }
    
    .productitube-limit-content p {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #606060;
      line-height: 1.4;
    }
    
    .productitube-btn-primary {
      margin-top: 16px;
      padding: 10px 24px;
      border: none;
      border-radius: 18px;
      background: #ff0000;
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    
    .productitube-btn-primary:hover {
      background: #cc0000;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(message);

  const okButton = message.querySelector('#productitube-limit-ok');
  okButton?.addEventListener('click', () => {
    if (message.parentNode) {
      message.parentNode.removeChild(message);
    }
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  });
};

/**
 * Show limit reached message (when user reaches limit after selecting category)
 */
const showLimitReachedMessage = (category: VideoCategory): void => {
  removeModal();

  const message = document.createElement('div');
  message.className = 'productitube-limit-message';
  message.innerHTML = `
    <div class="productitube-limit-content">
      <div class="productitube-limit-icon">✅</div>
      <h3>Enjoy this video!</h3>
      <p>This video has been counted toward your <strong>${category.name}</strong> category.</p>
      <p>You've now reached your daily limit for this category.</p>
      <button id="productitube-limit-ok" class="productitube-btn-primary">Start Watching</button>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .productitube-limit-message {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      font-family: 'YouTube Noto', Roboto, Arial, Helvetica, sans-serif;
    }
    
    .productitube-limit-content {
      background: white;
      border-radius: 12px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    
    .productitube-limit-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .productitube-limit-content h3 {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 500;
      color: #0f0f0f;
    }
    
    .productitube-limit-content p {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #606060;
      line-height: 1.4;
    }
    
    .productitube-btn-primary {
      margin-top: 16px;
      padding: 10px 24px;
      border: none;
      border-radius: 18px;
      background: #ff0000;
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    
    .productitube-btn-primary:hover {
      background: #cc0000;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(message);

  const okButton = message.querySelector('#productitube-limit-ok');
  okButton?.addEventListener('click', () => {
    resumeVideo();
    if (message.parentNode) {
      message.parentNode.removeChild(message);
    }
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  });
};

/**
 * Remove modal from DOM
 */
const removeModal = (): void => {
  if (state.modalElement && state.modalElement.parentNode) {
    state.modalElement.parentNode.removeChild(state.modalElement);
    state.modalElement = null;
  }

  const existingModal = document.getElementById('productitube-category-modal');
  if (existingModal && existingModal.parentNode) {
    existingModal.parentNode.removeChild(existingModal);
  }

  const existingStyles = document.querySelectorAll('style');
  existingStyles.forEach((style) => {
    if (style.textContent?.includes('productitube-modal-overlay')) {
      style.remove();
    }
  });
};

/**
 * Pause the current video
 */
const pauseVideo = (): void => {
  const video = document.querySelector('video') as HTMLVideoElement;
  if (video && !video.paused) {
    video.pause();
    state.videoElement = video;
    console.debug('[ProductiTube Limits] Video paused for categorization');
  }
};

/**
 * Resume the current video
 */
const resumeVideo = (): void => {
  if (state.videoElement && state.videoElement.paused) {
    state.videoElement.play();
    console.debug('[ProductiTube Limits] Video resumed');
  }
  state.videoElement = null;
  state.isProcessingVideo = false;
};

/**
 * Check if we're on a video watch page
 */
const isVideoWatchPage = (): boolean => {
  return window.location.pathname === '/watch' && window.location.search.includes('v=');
};

/**
 * Handle video load event
 */
const handleVideoLoad = async (): Promise<void> => {
  if (!isVideoWatchPage() || state.isProcessingVideo) return;

  await loadData();

  if (!state.settings?.isLimitsEnabled || state.settings?.activeMode !== 'video-count') {
    return;
  }

  const categories = state.settings.categories['video-count'] || [];
  const activeCategories = categories.filter((cat) => cat.isActive);

  if (activeCategories.length === 0) {
    console.debug('[ProductiTube Limits] No active categories, skipping limits');
    return;
  }

  state.isProcessingVideo = true;

  const waitForVideo = () => {
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video && video.readyState >= 1) {
      pauseVideo();
      state.modalElement = createCategoryModal();
    } else {
      setTimeout(waitForVideo, 500);
    }
  };

  setTimeout(waitForVideo, 1000);
};

/**
 * Initialize video limits feature
 */
export const initializeVideoLimits = (): (() => void) => {
  console.debug('[ProductiTube Limits] Initializing video limits feature');

  let videoObserver: MutationObserver | null = null;
  let navigationHandler: (() => void) | null = null;

  const startWatching = () => {
    videoObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          const hasVideo = addedNodes.some(
            (node) => node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'VIDEO'
          );

          if (hasVideo) {
            handleVideoLoad();
          }
        }
      }
    });

    videoObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    navigationHandler = () => {
      if (isVideoWatchPage()) {
        setTimeout(handleVideoLoad, 1500);
      }
    };

    window.addEventListener('yt-navigate-finish', navigationHandler);

    if (isVideoWatchPage()) {
      handleVideoLoad();
    }
  };

  startWatching();
  state.isActive = true;

  return () => {
    console.debug('[ProductiTube Limits] Cleaning up video limits feature');

    if (videoObserver) {
      videoObserver.disconnect();
      videoObserver = null;
    }

    if (navigationHandler) {
      window.removeEventListener('yt-navigate-finish', navigationHandler);
      navigationHandler = null;
    }

    removeModal();
    state.isActive = false;
    state.isProcessingVideo = false;
  };
};

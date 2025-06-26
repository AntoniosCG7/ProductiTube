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
        <div class="productitube-header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7z" fill="white"/>
          </svg>
        </div>
        <div class="productitube-header-text">
          <h3>Categorize this video</h3>
          <p>Select a category for this video, then click Continue to start watching.</p>
        </div>
      </div>
      
      <div class="productitube-modal-body">
        <div class="productitube-category-grid">
          ${activeCategories
            .map((category) => {
              const watchedCount = getVideosWatchedToday(category.id);
              const isLimitReached = watchedCount >= category.dailyLimitCount;
              const remaining = category.dailyLimitCount - watchedCount;

              return `
              <button 
                class="productitube-category-option ${isLimitReached ? 'limit-reached' : ''}" 
                data-category-id="${category.id}"
                data-category-name="${category.name}"
                ${isLimitReached ? 'disabled' : ''}
              >
                <div class="productitube-category-color-wrapper">
                  <div class="productitube-category-color" style="background-color: ${category.color}"></div>
                </div>
                <div class="productitube-category-info">
                  <div class="productitube-category-name">${category.name}</div>
                  <div class="productitube-category-stats">
                    <span class="productitube-category-count">${watchedCount}/${category.dailyLimitCount} videos</span>
                    <span class="productitube-category-badge ${isLimitReached ? 'limit-reached' : 'remaining'}">
                      ${isLimitReached ? 'Limit reached' : `${remaining} left`}
                    </span>
                  </div>
                </div>
                <div class="productitube-check-icon" style="display: none;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17l-5-5" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
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
            <div class="productitube-no-categories-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#9ca3af" stroke-width="2"/>
                <path d="m9 9 6 6" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="m15 9-6 6" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p><strong>No active categories found</strong></p>
            <p>Please set up categories in the extension popup.</p>
          </div>
        `
            : ''
        }
      </div>
      
      <div class="productitube-modal-footer">
       <button id="productitube-home-btn" class="productitube-btn-secondary">
          Go to Home Feed
        </button>
        <button id="productitube-continue-btn" class="productitube-btn-primary" disabled>
          Continue
        </button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes productitube-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes productitube-scale-in {
      from { 
        opacity: 0; 
        transform: scale(0.95) translateY(10px); 
      }
      to { 
        opacity: 1; 
        transform: scale(1) translateY(0); 
      }
    }
    
    .productitube-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'YouTube Noto', Roboto, Arial, Helvetica, sans-serif;
      animation: productitube-fade-in 0.3s ease-out;
      padding: clamp(8px, 2vw, 24px);
      box-sizing: border-box;
    }
    
    .productitube-modal-content {
      background: white;
      border-radius: clamp(12px, 2vw, 16px);
      width: 100%;
      max-width: min(90vw, 600px);
      max-height: min(90vh, 700px);
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      animation: productitube-scale-in 0.3s ease-out;
      display: flex;
      flex-direction: column;
    }
    
    .productitube-modal-header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      padding: clamp(16px, 3vw, 24px);
      display: flex;
      align-items: center;
      gap: clamp(12px, 2vw, 16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }
    
    .productitube-header-icon {
      width: clamp(32px, 5vw, 40px);
      height: clamp(32px, 5vw, 40px);
      background: rgba(255, 255, 255, 0.2);
      border-radius: clamp(8px, 1.5vw, 12px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .productitube-header-text h3 {
      margin: 0 0 4px 0;
      font-size: clamp(16px, 3vw, 20px);
      font-weight: 600;
      color: white;
      line-height: 1.2;
    }
    
    .productitube-header-text p {
      margin: 0;
      font-size: clamp(12px, 2.2vw, 14px);
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.4;
    }
    
    .productitube-modal-body {
      padding: clamp(16px, 3vw, 24px);
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
    
    /* Red scrollbar styling for modal */
    .productitube-modal-overlay *::-webkit-scrollbar {
      width: 6px !important;
    }
    
    .productitube-modal-overlay *::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1) !important;
      border-radius: 10px !important;
    }
    
    .productitube-modal-overlay *::-webkit-scrollbar-thumb {
      background: red !important;
      border-radius: 10px !important;
    }
    
    .productitube-modal-overlay *::-webkit-scrollbar-thumb:hover {
      background: rgb(200, 30, 30) !important;
    }
    
    .productitube-category-grid {
      display: grid;
      gap: clamp(8px, 1.5vw, 12px);
      grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
    }
    
    @media (min-width: 640px) {
      .productitube-category-grid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }
    }
    
    @media (max-width: 480px) {
      .productitube-category-grid {
        grid-template-columns: 1fr;
      }
      
      .productitube-modal-content {
        max-width: 95vw;
        max-height: 95vh;
      }
      
      .productitube-modal-overlay {
        padding: 8px;
      }
    }
    
    .productitube-category-option {
      display: flex;
      align-items: center;
      gap: clamp(12px, 2vw, 16px);
      padding: clamp(12px, 2.5vw, 16px);
      border: 2px solid #e2e8f0;
      border-radius: clamp(8px, 1.5vw, 12px);
      background: white;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: left;
      width: 100%;
      position: relative;
      overflow: hidden;
      min-height: clamp(60px, 8vw, 72px);
    }
    
    .productitube-category-option::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .productitube-category-option:hover:not(:disabled)::before {
      opacity: 1;
    }
    
    .productitube-category-option:hover:not(:disabled) {
      border-color: #ef4444;
      transform: translateY(-1px);
      box-shadow: 0 8px 25px -8px rgba(239, 68, 68, 0.3);
    }
    
    .productitube-category-option:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: #f8fafc;
      border-color: #e2e8f0;
    }
    
    .productitube-category-option.limit-reached {
      border-color: #fca5a5;
      background: #fef2f2;
    }
    
    .productitube-category-option.selected {
      border-color: #ef4444;
      background: #fef2f2;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      transform: translateY(-1px);
    }
    
    .productitube-category-option.selected .productitube-check-icon {
      display: block !important;
    }
    
    .productitube-category-color-wrapper {
      position: relative;
    }
    
    .productitube-category-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 1), 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .productitube-category-info {
      flex: 1;
      min-width: 0;
    }
    
    .productitube-category-name {
      font-weight: 600;
      font-size: clamp(13px, 2.2vw, 15px);
      color: #1e293b;
      margin-bottom: 4px;
      line-height: 1.3;
    }
    
    .productitube-category-stats {
      display: flex;
      align-items: center;
      gap: clamp(6px, 1vw, 8px);
      flex-wrap: wrap;
    }
    
    .productitube-category-count {
      font-size: clamp(11px, 1.8vw, 13px);
      color: #64748b;
      font-weight: 500;
    }
    
    .productitube-category-badge {
      font-size: clamp(9px, 1.5vw, 11px);
      font-weight: 600;
      padding: clamp(2px, 0.5vw, 3px) clamp(6px, 1vw, 8px);
      border-radius: clamp(8px, 1.5vw, 12px);
      text-transform: uppercase;
      letter-spacing: 0.025em;
      white-space: nowrap;
    }
    
    .productitube-category-badge.remaining {
      background: #dcfce7;
      color: #166534;
    }
    
    .productitube-category-badge.limit-reached {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .productitube-check-icon {
      flex-shrink: 0;
    }
    
    .productitube-no-categories {
      text-align: center;
      padding: clamp(32px, 6vw, 48px) clamp(16px, 3vw, 24px);
      color: #64748b;
    }
    
    .productitube-no-categories-icon {
      margin-bottom: clamp(12px, 2vw, 16px);
    }
    
    .productitube-no-categories p {
      margin: 0 0 clamp(6px, 1vw, 8px) 0;
      font-size: clamp(12px, 2vw, 14px);
      line-height: 1.5;
    }
    
    .productitube-no-categories p:first-of-type {
      color: #374151;
      font-weight: 600;
    }
    
    .productitube-modal-footer {
      padding: clamp(16px, 2.5vw, 20px) clamp(16px, 3vw, 24px) clamp(20px, 3vw, 24px);
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: center;
      background: #fafafa;
      gap: 12px;
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .productitube-btn-secondary {
      padding: 12px 24px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      color: #475569;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .productitube-btn-secondary::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(71, 85, 105, 0.05) 0%, rgba(71, 85, 105, 0.02) 100%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .productitube-btn-secondary:hover::before {
      opacity: 1;
    }

    .productitube-btn-secondary:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .productitube-btn-secondary:active {
      transform: translateY(0);
    }

    .productitube-btn-primary {
      padding: clamp(10px, 1.8vw, 12px) clamp(24px, 4vw, 32px);
      border: none;
      border-radius: clamp(6px, 1vw, 8px);
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      font-size: clamp(12px, 2vw, 14px);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      position: relative;
      overflow: hidden;
      min-width: clamp(100px, 20vw, 140px);
      max-width: 100%;
    }
    
    .productitube-btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .productitube-btn-primary:hover:not(:disabled)::before {
      opacity: 1;
    }
    
    .productitube-btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
    }
    
    .productitube-btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }
    
    .productitube-btn-primary:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
    
    .productitube-btn-primary:disabled::before {
      display: none;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(modal);

  setTimeout(() => {
    const additionalScrollbarStyle = document.createElement('style');
    additionalScrollbarStyle.id = 'productitube-scrollbar-override';
    additionalScrollbarStyle.textContent = `
      .productitube-modal-overlay *::-webkit-scrollbar {
        width: 6px !important;
      }
      
      .productitube-modal-overlay *::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1) !important;
        border-radius: 10px !important;
      }
      
      .productitube-modal-overlay *::-webkit-scrollbar-thumb {
        background: red !important;
        border-radius: 10px !important;
      }
      
      .productitube-modal-overlay *::-webkit-scrollbar-thumb:hover {
        background: rgb(200, 30, 30) !important;
      }
    `;

    const existing = document.getElementById('productitube-scrollbar-override');
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(additionalScrollbarStyle);

    const modalBody = modal.querySelector('.productitube-modal-body') as HTMLElement;
    if (modalBody) {
      modalBody.style.setProperty('scrollbar-width', 'thin');
      modalBody.style.setProperty('scrollbar-color', 'red rgba(0, 0, 0, 0.1)');
    }
  }, 100);

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

  const homeButton = modal.querySelector('#productitube-home-btn');
  homeButton?.addEventListener('click', () => {
    window.location.href = '/';
  });

  return modal;
};

/**
 * Handle category selection
 */
const handleCategorySelection = async (categoryId: string): Promise<void> => {
  const category = state.settings?.categories['video-count']?.find((cat) => cat.id === categoryId);
  if (!category) return;

  await incrementVideoCount(categoryId);

  const newCount = getVideosWatchedToday(categoryId);
  const hasReachedLimit = newCount >= category.dailyLimitCount;

  if (hasReachedLimit) {
    showLimitReachedMessage(category);
  } else {
    resumeVideo();
    removeModal();
  }
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
      <div class="productitube-limit-icon success">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="m9 11 3 3L22 4" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3>Enjoy this video!</h3>
      <div class="productitube-limit-text">
        <p>This video has been counted toward your <strong>${category.name}</strong> category.</p>
        <p>You've now reached your daily limit for this category.</p>
      </div>
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
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      font-family: 'YouTube Noto', Roboto, Arial, Helvetica, sans-serif;
      animation: productitube-fade-in 0.3s ease-out;
      padding: 16px;
    }
    
    .productitube-limit-content {
      background: white;
      border-radius: 20px;
      padding: 40px 32px 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      animation: productitube-scale-in 0.3s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .productitube-limit-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .productitube-limit-icon.success {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    }
    
    .productitube-limit-content h3 {
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
    }
    
    .productitube-limit-text {
      margin-bottom: 28px;
    }
    
    .productitube-limit-content p {
      margin: 0 0 12px 0;
      font-size: 15px;
      color: #64748b;
      line-height: 1.5;
    }
    
    .productitube-limit-content p:last-child {
      margin-bottom: 0;
    }
    
    .productitube-limit-content strong {
      color: #1e293b;
      font-weight: 600;
    }
    
    .productitube-btn-primary {
      padding: 12px 28px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    
    .productitube-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
    }
    
    .productitube-btn-primary:active {
      transform: translateY(0);
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
    if (
      style.textContent?.includes('productitube-modal-overlay') ||
      style.textContent?.includes('productitube-limit-message')
    ) {
      style.remove();
    }
  });

  const scrollbarOverride = document.getElementById('productitube-scrollbar-override');
  if (scrollbarOverride) {
    scrollbarOverride.remove();
  }
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

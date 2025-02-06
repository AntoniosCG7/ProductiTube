export const initializeRecommendedVideos = (hideRecommended: boolean) => {
  const hideRecommendedVideos = () => {
    const recommendedVideos = document.querySelector('ytd-watch-next-secondary-results-renderer');
    if (recommendedVideos) {
      (recommendedVideos as HTMLElement).style.display = hideRecommended ? 'none' : '';
    }
  };

  hideRecommendedVideos();

  const observer = new MutationObserver(() => {
    hideRecommendedVideos();
  });

  observer.observe(document.body, { childList: true, subtree: true });
};

export const initializeRelatedVideos = (enable: boolean) => {
  const relatedVideos = document.querySelector('ytd-watch-next-secondary-results-renderer');
  if (relatedVideos) {
    (relatedVideos as HTMLElement).style.display = enable ? 'none' : '';
  }
};

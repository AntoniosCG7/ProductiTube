export const initializeRelatedVideos = () => {
  const relatedVideos = document.querySelector('ytd-watch-next-secondary-results-renderer');
  if (relatedVideos) {
    (relatedVideos as HTMLElement).style.display = 'none';
  }
}; 
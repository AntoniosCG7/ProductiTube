export const initializeCleanMode = (enable: boolean) => {
  const distractingElements = document.querySelectorAll(
    [
      'ytd-rich-grid-renderer', // Homepage grid
      'ytd-watch-next-secondary-results-renderer', // Related videos
      'ytd-comments', // Comments section
    ].join(',')
  );

  distractingElements.forEach((element) => {
    (element as HTMLElement).style.display = enable ? 'none' : '';
  });
};

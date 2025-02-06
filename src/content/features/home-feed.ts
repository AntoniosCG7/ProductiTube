export const initializeHideHomeFeed = (hide: boolean) => {
  const homeFeedSelector = 'ytd-rich-grid-renderer, ytd-two-column-browse-results-renderer';

  const updateHomeFeed = () => {
    const homeFeedElements = document.querySelectorAll(homeFeedSelector);

    homeFeedElements.forEach((element) => {
      (element as HTMLElement).style.display = hide ? 'none' : '';
    });
  };

  // Initial update
  updateHomeFeed();

  // Create a MutationObserver to handle dynamically loaded content
  const observer = new MutationObserver(() => {
    updateHomeFeed();
  });

  // Start observing the document with the configured parameters
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Cleanup function
  return () => observer.disconnect();
};

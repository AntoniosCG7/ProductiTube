export const initializeCleanMode = () => {
  const hideDistractions = () => {
    // Add selectors for elements to hide in clean mode
    const distractingElements = document.querySelectorAll(
      [
        'ytd-rich-grid-renderer', // Homepage grid
        'ytd-watch-next-secondary-results-renderer', // Related videos
        'ytd-comments', // Comments section
      ].join(',')
    );

    distractingElements.forEach((element) => {
      (element as HTMLElement).style.display = 'none';
    });
  };

  hideDistractions();
};

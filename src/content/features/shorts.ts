export const initializeShorts = (enable: boolean) => {
  // Hide shorts from homepage and recommendations
  const shortsElements = document.querySelectorAll(
    [
      'ytd-reel-shelf-renderer', // Shorts shelf
      'ytd-rich-section-renderer', // Shorts section
    ].join(',')
  );

  shortsElements.forEach((element) => {
    (element as HTMLElement).style.display = enable ? 'none' : '';
  });
};

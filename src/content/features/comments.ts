export const initializeComments = (enable: boolean) => {
  const commentsSection = document.querySelector('ytd-comments');
  if (commentsSection) {
    (commentsSection as HTMLElement).style.display = enable ? 'none' : '';
  }
};

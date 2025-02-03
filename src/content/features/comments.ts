export const initializeComments = () => {
  const commentsSection = document.querySelector('ytd-comments');
  if (commentsSection) {
    (commentsSection as HTMLElement).style.display = 'none';
  }
}; 
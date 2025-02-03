export const initializeHomepage = () => {
  if (window.location.pathname === '/') {
    const homepage = document.querySelector('ytd-rich-grid-renderer');
    if (homepage) {
      (homepage as HTMLElement).style.display = 'none';
    }
  }
}; 
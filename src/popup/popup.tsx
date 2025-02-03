import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/popup/styles/popup.css';

const Popup = () => {
  return (
    <div className="popup-container">
      <h1>ProductiTube</h1>
      <p>Your YouTube, Your Rules</p>
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}

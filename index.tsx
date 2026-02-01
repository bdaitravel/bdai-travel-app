
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.debug('SW registered'))
        .catch(err => {
          if (err.name === 'SecurityError' || err.message.includes('cross-origin')) {
            console.debug('SW registration ignored in sandbox.');
          } else {
            console.warn('SW error:', err);
          }
        });
    } catch (e) {
      console.debug('SW not supported or blocked.');
    }
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

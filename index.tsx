
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Registro silencioso del Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Solo intentamos registrar si estamos en el mismo origen para evitar el error de Security Error en el sandbox
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registered'))
      .catch(err => {
        // En el entorno de previsualización de AI Studio, este error es esperado y normal
        if (err.name === 'SecurityError') {
          console.debug('SW registration skipped: Sandbox environment detected.');
        } else {
          console.warn('SW registration failed: ', err);
        }
      });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

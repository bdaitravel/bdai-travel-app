
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.info("%c [CORE] React Active v3.2.3", "background: #7c3aed; color: white; padding: 4px 10px; border-radius: 6px; font-weight: 900;");

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  // Limpieza del loader HTML
  setTimeout(() => {
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 500);
    }
  }, 200);
}

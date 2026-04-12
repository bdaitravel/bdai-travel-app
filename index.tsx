import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HashRouter } from 'react-router-dom';

console.log("bdai: index.tsx loaded");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <ErrorBoundary language="es">
        <App />
      </ErrorBoundary>
    </HashRouter>
  </React.StrictMode>
);

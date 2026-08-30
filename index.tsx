import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HashRouter } from 'react-router-dom';

console.log("bdai: index.tsx loaded");

// Cada deploy de Vite genera chunks con hash nuevo. Si un usuario tiene la
// pestaña abierta desde antes del último deploy y navega a una ruta cuyo
// chunk (React.lazy, ej. CityDetailView) ya no existe con ese hash en el
// servidor, el import dinámico falla con "Failed to fetch dynamically
// imported module". No es un bug de la app — basta recargar para pedir el
// index.html actual. Se recarga como mucho una vez por pestaña (sessionStorage)
// para no entrar en bucle si el fallo persiste por otra causa (red caída...),
// en cuyo caso sí debe verse el ErrorBoundary con su botón manual de recarga.
window.addEventListener('vite:preloadError', () => {
  const key = 'bdai_chunk_reload_attempted';
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  window.location.reload();
});

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

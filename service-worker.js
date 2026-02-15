
const CACHE_NAME = 'bdai-v8-final-reset';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar caché para asegurar que los cambios se vean
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

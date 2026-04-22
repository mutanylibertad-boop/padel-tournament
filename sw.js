const CACHE_NAME = 'torneo-padel-v5.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Cache strategy functions
const CACHE_STRATEGIES = {
  CACHE_FIRST: async (request) => {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(request);
    if (response) return response;
    
    try {
      const fetchResponse = await fetch(request);
      if (fetchResponse && fetchResponse.status === 200) {
        cache.put(request, fetchResponse.clone());
      }
      return fetchResponse;
    } catch {
      return cache.match('./index.html');
    }
  },

  NETWORK_FIRST: async (request) => {
    try {
      const fetchResponse = await fetch(request);
      if (fetchResponse && fetchResponse.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, fetchResponse.clone());
      }
      return fetchResponse;
    } catch {
      const cache = await caches.open(CACHE_NAME);
      return cache.match(request) || cache.match('./index.html');
    }
  }
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(() => {
        console.log('⚠️ Algunos archivos no se pudieron cachear');
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 Limpiando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Estrategia por tipo de contenido
  if (event.request.url.includes('.html') || event.request.url.endsWith('/')) {
    event.respondWith(CACHE_STRATEGIES.NETWORK_FIRST(event.request));
  } else {
    event.respondWith(CACHE_STRATEGIES.CACHE_FIRST(event.request));
  }
});

const CACHE_NAME = 'shift-planner-cache-v8';
const urlsToCache = [
  './',
  './index.html',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './icon.svg',
  './manifest.json',
  './hooks/useLocalStorage.ts',
  './utils/date.ts',
  './utils/schedule.ts',
  './utils/holidays.ts',
  './components/Header.tsx',
  './components/Calendar.tsx',
  './components/CalendarDay.tsx',
  './components/DayDetailModal.tsx',
  './components/SettingsMenu.tsx',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf-autotable.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://esm.sh/react@19.1.1',
  'https://esm.sh/react-dom@19.1.1/client'
];

self.addEventListener('install', event => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use {cache: 'reload'} to bypass HTTP cache for third-party resources during install
        const requests = urlsToCache.map(url => new Request(url, {cache: 'reload'}));
        return cache.addAll(requests);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response to cache
            // We only cache GET requests that return a 2xx status.
            // We also cache opaque responses (for CDNs)
            if(!response || response.status !== 200 || event.request.method !== 'GET') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
    );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients
  );
});

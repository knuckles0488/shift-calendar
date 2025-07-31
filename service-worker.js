const CACHE_NAME = 'shift-planner-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/icon.svg',
  '/manifest.json',
  '/hooks/useLocalStorage.ts',
  '/utils/date.ts',
  '/utils/schedule.ts',
  '/utils/holidays.ts',
  '/components/Header.tsx',
  '/components/Calendar.tsx',
  '/components/CalendarDay.tsx',
  '/components/DayDetailModal.tsx',
  '/components/SettingsMenu.tsx',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf-autotable.min.js',
  'https://esm.sh/react@^19.1.1',
  'https://esm.sh/react-dom@^19.1.1/client'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
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
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              if (response && (response.type === 'opaque' || response.type === 'cors')) {
                 return response; // For CDN resources
              }
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
    })
  );
});

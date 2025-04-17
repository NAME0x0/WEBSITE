const CACHE_NAME = 'glassmorphic-dashboard-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192x192.png', // Add paths to your icons
  '/icons/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js' // Cache external libraries if needed
];

// Install event: Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to open cache or add URLs:', err);
      })
  );
  self.skipWaiting(); // Activate worker immediately
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of clients immediately
});

// Fetch event: Serve cached assets, fallback to network, basic offline page (optional)
self.addEventListener('fetch', event => {
  // Skip non-GET requests and requests for external resources not explicitly cached (like APIs)
  if (event.request.method !== 'GET' ||
      !event.request.url.startsWith(self.location.origin) &&
      !urlsToCache.includes(event.request.url) // Only handle explicitly cached external URLs
     ) {
    // Let the browser handle it
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !urlsToCache.includes(event.request.url)) {
              return networkResponse; // Don't cache invalid or non-basic responses unless explicitly listed
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
          // Network request failed, try to serve a fallback (optional)
          console.log('Network request failed, serving offline fallback if available.', error);
          // You could return a specific offline page here:
          // return caches.match('/offline.html');
          // Or just let the browser handle the error
        });
      })
  );
});

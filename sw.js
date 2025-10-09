// sw.js - Updated with cache versioning
const CACHE_VERSION = 'v11.1.1';
const CACHE_NAME = `rlc-bingo-${CACHE_VERSION}`;

const urlsToCache = [
  '/rlc-bingo-manager/',
  '/rlc-bingo-manager/index.html',
  '/rlc-bingo-manager/css/style.css',
  '/rlc-bingo-manager/css/wizard.css',
  '/rlc-bingo-manager/css/dark-mode.css',
  '/rlc-bingo-manager/js/config.js',
  '/rlc-bingo-manager/js/app.js',
  '/rlc-bingo-manager/js/wizard.js',
  '/rlc-bingo-manager/js/calculations.js',
  '/rlc-bingo-manager/js/offline.js',
  '/rlc-bingo-manager/js/sync.js',
  '/rlc-bingo-manager/js/init.js',
  '/rlc-bingo-manager/manifest.json',
  '/rlc-bingo-manager/version.json'
];

self.addEventListener('install', event => {
  // Skip waiting to activate new service worker immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete all caches that don't match current version
          if (cacheName.startsWith('rlc-bingo-') && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  // Skip service worker for Google Apps Script API requests
  if (event.request.url.includes('script.google.com')) {
    return; // Let the request go through normally without service worker interference
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Always fetch index.html fresh to check for updates
        if (event.request.url.includes('index.html') ||
            event.request.url.endsWith('/')) {
          return fetch(event.request);
        }

        // Return cached version or fetch new
        return response || fetch(event.request);
      })
  );
});

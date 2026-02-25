// ─── Service Worker for Kathmandu Bakery Attendance PWA ───────────
const CACHE_NAME = 'bakery-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './login.html',
    './employee.html',
    './admin.html',
    './style.css',
    './manifest.json',
    './kathmandu-bakery-logo.jpg'
];

// Install: cache core assets
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (key) { return key !== CACHE_NAME; })
                    .map(function (key) { return caches.delete(key); })
            );
        })
    );
    self.clients.claim();
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', function (event) {
    // Don't cache Firebase API calls
    if (event.request.url.includes('firebaseapp.com') ||
        event.request.url.includes('googleapis.com') ||
        event.request.url.includes('gstatic.com') ||
        event.request.url.includes('firestore.googleapis.com')) {
        event.respondWith(fetch(event.request));
        return;
    }
    event.respondWith(
        caches.match(event.request).then(function (cached) {
            return cached || fetch(event.request).then(function (response) {
                // Cache new responses
                var respClone = response.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, respClone);
                });
                return response;
            });
        }).catch(function () {
            // Offline fallback to cached index
            return caches.match('./index.html');
        })
    );
});

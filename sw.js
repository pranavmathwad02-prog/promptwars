const CACHE_NAME = 'elected-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/index.css',
    '/css/premium.css',
    '/css/pollmap.css',
    '/css/registration.css',
    '/js/app.js',
    '/js/api/electionData.js',
    '/js/api/registrationData.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(ASSETS))
        .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Only intercept local requests for caching
    if (event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version or fetch from network
                return cachedResponse || fetch(event.request);
            })
        );
    }
});

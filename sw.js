/**
 * @file sw.js
 * @description PWA Service Worker for ElectEd Platform
 * Strategy: Cache-first for static assets, Network-first for API calls.
 * Implements stale-while-revalidate for optimal performance and offline support.
 */
'use strict';

const CACHE_VERSION = 'elected-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

/** Static assets to precache on install */
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/index.css',
    '/css/base.css',
    '/css/components.css',
    '/css/sections.css',
    '/css/premium.css',
    '/css/registration.css',
    '/css/electoralMap.css',
    '/css/pollmap.css',
    '/js/app.js',
    '/js/worker.js',
    '/js/api/electionData.js',
    '/js/api/registrationData.js',
    '/manifest.json'
];

// ── INSTALL: Precache all static assets ──
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting()) // Activate immediately
            .catch((err) => console.error('[SW] Install failed:', err))
    );
});

// ── ACTIVATE: Clean up old caches and claim clients ──
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
                        .map((name) => {
                            console.info(`[SW] Deleting old cache: ${name}`);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim()) // Take control of all open tabs
    );
});

// ── FETCH: Route requests to appropriate strategy ──
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and cross-origin requests that are not cached
    if (request.method !== 'GET') return;

    // API requests: Network-first with cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request, API_CACHE));
        return;
    }

    // Only handle same-origin static requests
    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    }
});

/**
 * Cache-first strategy: serve from cache, fallback to network.
 * @param {Request} request
 * @param {string} cacheName
 * @returns {Promise<Response>}
 */
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (err) {
        // Serve offline fallback for navigation requests
        if (request.mode === 'navigate') {
            const fallback = await caches.match('/index.html');
            if (fallback) return fallback;
        }
        throw err;
    }
}

/**
 * Network-first strategy: try network, fallback to cache.
 * @param {Request} request
 * @param {string} cacheName
 * @returns {Promise<Response>}
 */
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw err;
    }
}

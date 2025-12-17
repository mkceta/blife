// Service Worker for BLife App
// Provides offline functionality and asset caching

const CACHE_NAME = 'blife-v1'
const RUNTIME_CACHE = 'blife-runtime-v1'

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/market',
    '/community',
    '/flats',
    '/profile',
    '/messages',
    '/manifest.json',
    '/icon',
]

// Install event - cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Precaching assets')
            return cache.addAll(PRECACHE_ASSETS)
        })
    )
    self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map((name) => caches.delete(name))
            )
        })
    )
    self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return
    }

    // Skip API calls (Supabase, etc)
    if (url.pathname.includes('/api/') || url.hostname.includes('supabase')) {
        return
    }

    // Network first strategy for HTML pages
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache the response
                    const responseClone = response.clone()
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseClone)
                    })
                    return response
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || caches.match('/')
                    })
                })
        )
        return
    }

    // Cache first strategy for assets (images, CSS, JS)
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse
            }

            return fetch(request).then((response) => {
                // Don't cache if not a success response
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response
                }

                // Clone and cache for future
                const responseClone = response.clone()
                caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(request, responseClone)
                })

                return response
            })
        })
    )
})

// Listen for messages from the client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})
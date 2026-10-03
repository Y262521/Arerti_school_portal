// Arerti Portal service worker
// Strategy:
//  - Navigation requests: network-first, falling back to the cached shell when offline.
//  - Same-origin static assets (JS/CSS/images/fonts): stale-while-revalidate.
//  - /api/** requests: network-only (never cached — always want fresh, authenticated data).
//    A GET to /api/notices or /api/resources etc. that fails offline simply fails; the
//    UI already handles fetch errors with toast messages.

const CACHE_NAME = 'arerti-portal-shell-v1'
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/logo.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never cache API calls — always hit the network so data (and auth) stays fresh.
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return

  // Navigations: try network first, fall back to cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Static assets (Vite-hashed JS/CSS, images, fonts): stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone())
            return response
          })
          .catch(() => cached)
        return cached || networkFetch
      })
    )
  )
})

// ─── SERVICE WORKER — Catalina TV ─────────────────────────────────────────────
// Caches all app shell files on first load.
// App loads instantly from cache even with zero WiFi.
// External data (weather, Google Sheets) is never cached here —
// the app handles those with localStorage fallbacks.

const CACHE_NAME = 'catalina-tv-v4';

const APP_SHELL = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/config.js',
  '/js/clock.js',
  '/js/background.js',
  '/js/modes.js',
  '/js/weather.js',
  '/js/events.js',
  '/js/directory.js',
  '/js/info.js',
  '/js/passcode.js',
  '/js/settings.js',
  '/js/darkmode.js',
  '/js/main.js',
  '/assets/images/logo.png',
  '/assets/images/logo-light.png',
];

// ─── INSTALL: cache all app shell files ───────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH: cache-first for app shell, network-first for external APIs ─────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go to network for external APIs (weather, Google Sheets)
  const isExternal = url.origin !== self.location.origin;
  if (isExternal) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Cache-first for all local app files
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache any new local files we haven't seen before
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

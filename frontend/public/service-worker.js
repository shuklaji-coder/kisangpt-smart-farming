// KisanGPT Mobile-First PWA Service Worker
// Enhanced for mobile experience with better caching and offline support

const VERSION = 'v3-mobile';
const SHELL_CACHE = `kisangpt-shell-${VERSION}`;
const RUNTIME_CACHE = `kisangpt-runtime-${VERSION}`;
const IMAGE_CACHE = `kisangpt-images-${VERSION}`;
const STATIC_CACHE = `kisangpt-static-${VERSION}`;

// Essential app shell files for offline functionality
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/offline.html' // Offline fallback page
];

// Critical routes for offline support
const OFFLINE_PAGES = [
  '/',
  '/dashboard',
  '/disease-detection',
  '/ai-chat',
  '/weather',
  '/community'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => ![SHELL_CACHE, RUNTIME_CACHE].includes(k)).map((k) => caches.delete(k)));
      // Enable navigation preload for faster responses where supported
      if ('navigationPreload' in self.registration) {
        try { await self.registration.navigationPreload.enable(); } catch (_) {}
      }
      self.clients.claim();
    })()
  );
});

function isApiRequest(req) {
  return req.url.includes('/api/');
}

function isStaticAsset(req) {
  const url = new URL(req.url);
  return url.pathname.startsWith('/static/') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // App-shell for SPA navigation
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preload = (await event.preloadResponse) || (await fetch(request));
          // Cache a copy for offline navigations
          const cache = await caches.open(SHELL_CACHE);
          cache.put('/', preload.clone());
          return preload;
        } catch (err) {
          const cached = await caches.match('/index.html');
          return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // Static assets: cache-first
  if (request.method === 'GET' && isStaticAsset(request)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((resp) => {
          const copy = resp.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return resp;
        });
      })
    );
    return;
  }

  // API GET: network-first with cache fallback
  if (request.method === 'GET' && isApiRequest(request)) {
    event.respondWith(
      (async () => {
        try {
          const resp = await fetch(request);
          const copy = resp.clone();
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, copy);
          return resp;
        } catch (e) {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ status: 'offline', message: 'Using last saved data not available' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
          });
        }
      })()
    );
    return;
  }

  // Default: try cache, then network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => caches.match('/index.html')))
  );
});

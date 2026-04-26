// Advanced Mechanix — service worker
// Caches static assets and HTML to make repeat visits and inter-page
// navigations near-instant on mobile. Bump CACHE_VERSION on any deploy
// where you need clients to refresh precached assets.

const CACHE_VERSION = 'am-v1-2026-04-26';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const HTML_CACHE = `${CACHE_VERSION}-html`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/main.js',
  '/fonts/fraunces-600-normal-latin.woff2',
  '/fonts/ibm-plex-sans-400-normal-latin.woff2',
  '/images/AM-Black-Logo.png',
  '/images/drawings/single-line-diagram.svg',
  '/404.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((k) => !k.startsWith(CACHE_VERSION))
        .map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

function isSameOrigin(url) {
  return new URL(url, self.location.href).origin === self.location.origin;
}

function isHtmlRequest(req) {
  if (req.mode === 'navigate') return true;
  const accept = req.headers.get('accept') || '';
  return accept.includes('text/html');
}

function isStaticAsset(url) {
  return /\.(?:css|js|woff2?|ttf|otf|svg|png|jpe?g|webp|avif|ico|gif)$/i.test(url.pathname);
}

// Network-first with cache fallback for HTML — fresh content when online,
// instant fallback when offline or on flaky mobile connections.
async function handleHtml(request) {
  const cache = await caches.open(HTML_CACHE);
  try {
    const network = await fetch(request);
    if (network && network.ok) cache.put(request, network.clone());
    return network;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await caches.match('/404.html');
    return offline || Response.error();
  }
}

// Cache-first for hashed/immutable static assets — these are served with
// long Cache-Control already, but SW makes them survive HTTP cache eviction.
async function handleStatic(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    // Refresh in background so future visits get any updated asset.
    fetch(request).then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
    }).catch(() => {});
    return cached;
  }
  try {
    const network = await fetch(request);
    if (network && network.ok) cache.put(request, network.clone());
    return network;
  } catch (err) {
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!isSameOrigin(request.url)) return;

  if (isHtmlRequest(request)) {
    event.respondWith(handleHtml(request));
    return;
  }

  if (isStaticAsset(new URL(request.url))) {
    event.respondWith(handleStatic(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

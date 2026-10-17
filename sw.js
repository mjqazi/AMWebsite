// Advanced Mechanix — service worker
// HTML, CSS and JS are network-first (cache only as an offline fallback), so
// a deploy is picked up on the next page view even though GitHub Pages
// serves un-hashed /css/styles.min.css and /js/main.min.js. Fonts and images are
// cache-first with background refresh. Bump CACHE_VERSION on each deploy
// that changes precached files.

const CACHE_VERSION = 'am-v13-consented-analytics-2026-10-17';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const HTML_CACHE = `${CACHE_VERSION}-html`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/styles.min.css',
  '/js/main.min.js',
  '/fonts/archivo-var-latin.woff2',
  '/fonts/ibm-plex-sans-var-latin.woff2',
  '/images/am-logo-black-h88.png',
  '/images/drawings/design-review.svg',
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

function isCodeAsset(url) {
  return /\.(?:css|js)$/i.test(url.pathname);
}

// Network-first for CSS/JS — always fresh when online, cached copy offline.
async function handleCode(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const network = await fetch(request);
    if (network && network.ok) cache.put(request, network.clone());
    return network;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || Response.error();
  }
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

// Cache-first (with background refresh) for fonts and images.
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

  const url = new URL(request.url);
  if (isCodeAsset(url)) {
    event.respondWith(handleCode(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(handleStatic(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

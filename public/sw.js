// Service worker — offline-ready, never stale. __BUILD__ is replaced per deploy by the server.
// Pages, CSS and JS: network first (news must be fresh), cache as fallback when offline.
// Fonts and images: cache first (they never change in place). /api/* is never touched.
const VERSION = '__BUILD__';
const CACHE = `gta6info-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = ['/', OFFLINE_URL, '/css/site.css', '/js/app.js', '/js/zones.js', '/js/time.js', '/js/schedule.js',
  '/fonts/TwemojiCountryFlags.woff2', '/icon-192.png', '/favicon.svg', '/site.webmanifest'];
const IMMUTABLE = /\.(png|svg|woff2|ico)$/;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const putInCache = (req, res) => {
  if (res.ok && res.type === 'basic') {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname === '/sw.js' || url.pathname === '/healthz') return;

  if (IMMUTABLE.test(url.pathname)) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => putInCache(req, res))));
    return;
  }

  event.respondWith(fetch(req)
    .then((res) => putInCache(req, res))
    .catch(async () => (await caches.match(req)) || (req.mode === 'navigate' ? caches.match(OFFLINE_URL) : Response.error())));
});

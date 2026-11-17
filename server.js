// Zero-dependency server: static files, 30 city pages, news (Markdown), sitemaps, RSS, IndexNow and a visit counter.
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { join, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { ZONES } from './public/js/zones.js';
import { scheduleRowsHtml } from './public/js/schedule.js';
import { applyPartials, headCommon } from './lib/partials.js';
import { renderCityPage, renderSitemap } from './lib/render.js';
import { createCounter } from './lib/counter.js';
import { loadPosts, tagsOf } from './lib/content.js';
import { renderPost, renderNewsHub, renderTag, renderRss, renderNewsSitemap, latestNewsHtml } from './lib/news.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const CONTENT_DIR = join(ROOT, 'content', 'news');
const PORT = Number(process.env.PORT) || 8080;
const EXPLICIT_SITE_URL = (process.env.SITE_URL || '').replace(/\/+$/, '');
const SITE_URL = EXPLICIT_SITE_URL
  || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${PORT}`);
const CANONICAL_HOST = EXPLICIT_SITE_URL ? new URL(EXPLICIT_SITE_URL).host : '';
const DATA_DIR = process.env.DATA_DIR || join(ROOT, 'data');
const BUILD_DATE = new Date().toISOString().slice(0, 10);
// IndexNow keys are public by design (served at /<key>.txt); this only enables the ping.
const INDEXNOW_KEY = /^[a-zA-Z0-9-]{8,128}$/.test(process.env.INDEXNOW_KEY || '') ? process.env.INDEXNOW_KEY : '';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
const TEXT_EXT = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.xml', '.txt', '.svg']);
const TEMPLATED_EXT = new Set(['.html', '.xml', '.txt', '.webmanifest']);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
};

const routes = new Map(); // url path → { body, gz, type, cache }
let posts = [];

const cacheFor = (ext) => {
  if (ext === '.html' || ext === '.xml' || ext === '.txt' || ext === '.webmanifest') return 'public, max-age=60, must-revalidate';
  if (ext === '.png' || ext === '.svg' || ext === '.ico' || ext === '.woff2') return 'public, max-age=604800';
  return 'public, max-age=600';
};

const addRoute = (path, body, ext) => {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  routes.set(path, {
    body: buf,
    gz: TEXT_EXT.has(ext) && buf.length > 1024 ? gzipSync(buf, { level: 9 }) : null,
    type: TYPES[ext] || 'application/octet-stream',
    cache: cacheFor(ext),
  });
};

const templated = (text) => applyPartials(text)
  .replace('<!--SSR:SCHEDULE-->', scheduleRowsHtml(true))
  .replace('<!--SSR:LATEST-->', latestNewsHtml(posts))
  .replaceAll('__SITE_URL__', SITE_URL);

const walk = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
};

const loadSite = async () => {
  posts = await loadPosts(CONTENT_DIR);
  for (const file of await walk(PUBLIC_DIR)) {
    const ext = extname(file);
    const urlPath = `/${relative(PUBLIC_DIR, file).split(sep).join('/')}`;
    const raw = await readFile(file);
    let body = raw;
    if (TEMPLATED_EXT.has(ext)) {
      // Pages can carry a head block: <!--SSR:HEAD {"title":…,"description":…,"path":…}-->
      let text = raw.toString('utf8').replace(/<!--SSR:HEAD (\{.*?\})-->/s, (_, json) => headCommon(JSON.parse(json)));
      text = templated(text);
      body = text;
    }
    addRoute(urlPath, body, ext);
    if (urlPath.endsWith('/index.html')) addRoute(urlPath.slice(0, -'index.html'.length), body, ext);
  }
  for (const zone of ZONES) {
    addRoute(`/gta-6-release-time/${zone.slug}/`, templated(renderCityPage(zone)), '.html');
  }
  const tags = tagsOf(posts).map((t) => t.tag);
  addRoute('/news/', templated(renderNewsHub(posts)), '.html');
  for (const post of posts) addRoute(`/news/${post.slug}/`, templated(renderPost(post, posts)), '.html');
  for (const tag of tags) addRoute(`/tag/${tag}/`, templated(renderTag(tag, posts)), '.html');
  addRoute('/news/feed.xml', templated(renderRss(posts)), '.xml');
  addRoute('/news-sitemap.xml', templated(renderNewsSitemap(posts)), '.xml');
  addRoute('/sitemap.xml', templated(renderSitemap(BUILD_DATE, posts, tags)), '.xml');
  if (INDEXNOW_KEY) addRoute(`/${INDEXNOW_KEY}.txt`, INDEXNOW_KEY, '.txt');
};

// Tell Bing/Yandex (and engines that read IndexNow) about every URL after each deploy.
const pingIndexNow = async () => {
  if (!INDEXNOW_KEY || !EXPLICIT_SITE_URL) return;
  const urlList = [...routes.keys()].filter((p) => p.endsWith('/')).map((p) => `${SITE_URL}${p}`);
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: CANONICAL_HOST, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList }),
    });
    console.log(`IndexNow: ${res.status} for ${urlList.length} URLs`);
  } catch (err) {
    console.error('IndexNow ping failed:', err.message);
  }
};

const send = (req, res, status, route, extra = {}) => {
  const useGz = route.gz && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'Content-Type': route.type,
    'Cache-Control': route.cache,
    Vary: 'Accept-Encoding',
    ...(useGz ? { 'Content-Encoding': 'gzip' } : {}),
    'Content-Length': (useGz ? route.gz : route.body).length,
    ...extra,
  });
  res.end(req.method === 'HEAD' ? undefined : (useGz ? route.gz : route.body));
};

const sendJson = (res, status, obj) => {
  const body = JSON.stringify(obj);
  res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
};

const readSmallJson = (req) => new Promise((resolve) => {
  let size = 0;
  const chunks = [];
  req.on('data', (c) => {
    size += c.length;
    if (size > 1024) { req.destroy(); resolve(null); return; }
    chunks.push(c);
  });
  req.on('end', () => {
    try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { resolve(null); }
  });
  req.on('error', () => resolve(null));
});

const clientIp = (req) => String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',').pop().trim();

const start = async () => {
  await loadSite();
  const counter = await createCounter(DATA_DIR);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const path = decodeURIComponent(url.pathname);

    if (path === '/healthz') { sendJson(res, 200, { ok: true }); return; }

    if (path === '/api/stats' && req.method === 'GET') { sendJson(res, 200, counter.stats()); return; }
    if (path === '/api/hit' && req.method === 'POST') {
      const body = await readSmallJson(req);
      sendJson(res, 200, counter.hit(body?.sid, body?.first === true, clientIp(req)));
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') { sendJson(res, 405, { error: 'Method not allowed' }); return; }

    // One canonical host once SITE_URL is set (e.g. the custom subdomain).
    if (CANONICAL_HOST && req.headers.host && req.headers.host !== CANONICAL_HOST) {
      res.writeHead(301, { Location: `${EXPLICIT_SITE_URL}${url.pathname}${url.search}` });
      res.end();
      return;
    }

    const route = routes.get(path);
    if (route) { send(req, res, 200, route); return; }
    if (!path.endsWith('/') && routes.has(`${path}/`)) {
      res.writeHead(301, { Location: `${path}/${url.search}` });
      res.end();
      return;
    }
    send(req, res, 404, routes.get('/404.html'), { 'Cache-Control': 'no-store' });
  });

  server.listen(PORT, () => {
    console.log(`gta6 site on :${PORT} → ${SITE_URL} (data: ${DATA_DIR}, ${routes.size} routes, ${posts.length} posts)`);
    setTimeout(pingIndexNow, 15_000).unref();
  });

  const shutdown = async () => {
    await counter.flush();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start();

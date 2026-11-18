// SEO audit for GTA6Info.in. Usage: node tools/seo-audit.mjs [baseUrl]   (default http://localhost:8099)
// Crawls every sitemap URL plus every internal link it finds. Exit code 1 when any ERROR is found.
// Zero dependencies (Node 20+ global fetch).
const BASE = (process.argv[2] || 'http://localhost:8099').replace(/\/+$/, '');
const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const get = async (path) => {
  try {
    const res = await fetch(BASE + path, { redirect: 'manual' });
    return { status: res.status, text: await res.text(), location: res.headers.get('location') };
  } catch (e) {
    return { status: 0, text: '', error: e.message };
  }
};

const attr = (html, re) => html.match(re)?.[1] ?? '';
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const sitemap = await get('/sitemap.xml');
if (sitemap.status !== 200) { console.error(`ERROR sitemap.xml returned ${sitemap.status}`); process.exit(1); }
const sitemapPaths = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const canonicalOrigin = new URL([...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)][0][1]).origin;

const pages = new Map(); // path → { title, desc, h1s, canonical, links }
const queue = [...sitemapPaths];
const linkedFrom = new Map(); // path → Set(source paths)
const checked = new Set();

while (queue.length) {
  const path = queue.shift();
  if (checked.has(path)) continue;
  checked.add(path);
  const res = await get(path);
  if (res.status >= 300 && res.status < 400) {
    if (!sitemapPaths.includes(path)) continue; // internal redirect target is fine (e.g. /guides/x → /guides/x/)
    err(`${path}: sitemap URL redirects (${res.status} → ${res.location})`);
    continue;
  }
  if (res.status !== 200) { err(`${path}: HTTP ${res.status}${linkedFrom.has(path) ? ` (linked from ${[...linkedFrom.get(path)].slice(0, 3).join(', ')})` : ''}`); continue; }
  if (!/<html/i.test(res.text)) continue;
  const html = res.text;
  const title = decode(attr(html, /<title>([^<]*)<\/title>/i));
  const desc = decode(attr(html, /<meta name="description" content="([^"]*)"/i));
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/i);
  const robots = attr(html, /<meta name="robots" content="([^"]*)"/i);
  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  const noindex = /noindex/i.test(robots);
  if (!noindex && sitemapPaths.includes(path)) {
    if (!title) err(`${path}: missing <title>`);
    else if (title.length > 125) warn(`${path}: title ${title.length} chars (very long)`);
    if (!desc) err(`${path}: missing meta description`);
    else if (desc.length < 70 || desc.length > 200) warn(`${path}: description ${desc.length} chars (aim 120-190)`);
    if (h1s !== 1) err(`${path}: ${h1s} <h1> elements`);
    if (canonical !== canonicalOrigin + path) err(`${path}: canonical is ${canonical || '(none)'}`);
    if (!/property="og:image"/.test(html)) err(`${path}: missing og:image`);
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { err(`${path}: invalid JSON-LD (${e.message})`); }
  }
  const links = [...html.matchAll(/<a\b[^>]*href="([^"#]+)(?:#[^"]*)?"/g)].map((m) => decode(m[1]))
    .filter((h) => h.startsWith('/') && !h.startsWith('//'))
    .map((h) => h.split('?')[0]);
  for (const l of links) {
    if (!linkedFrom.has(l)) linkedFrom.set(l, new Set());
    linkedFrom.get(l).add(path);
    if (!checked.has(l) && !/\.(xml|txt|png|svg|ico|webmanifest)$/.test(l)) queue.push(l);
  }
  pages.set(path, { title, desc, noindex });
}

// Duplicates across indexable pages.
const dup = (field) => {
  const seen = new Map();
  for (const [p, v] of pages) {
    if (v.noindex || !v[field]) continue;
    if (seen.has(v[field])) err(`duplicate ${field}: ${seen.get(v[field])} and ${p}`);
    else seen.set(v[field], p);
  }
};
dup('title');
dup('desc');

// Orphans: sitemap news posts nobody links to (except listing pages).
for (const p of sitemapPaths.filter((x) => x.startsWith('/news/') && x !== '/news/')) {
  const from = [...(linkedFrom.get(p) || [])].filter((s) => s !== '/news/' && !s.startsWith('/tag/') && s !== p);
  if (!from.length) warn(`${p}: no in-content links point to it (only listings) — link it from a related post`);
}

// Feeds.
const rss = await get('/news/feed.xml');
const news = await get('/news-sitemap.xml');
const posts = sitemapPaths.filter((x) => /^\/news\/[^/]+\/$/.test(x)).length;
if (rss.status !== 200) err(`RSS returned ${rss.status}`);
else if ((rss.text.match(/<item>/g) || []).length < Math.min(posts, 50)) err('RSS has fewer items than published posts');
if (news.status !== 200) err(`news-sitemap.xml returned ${news.status}`);
const robotsTxt = await get('/robots.txt');
if (!/Sitemap: .*\/sitemap\.xml/.test(robotsTxt.text)) err('robots.txt does not list sitemap.xml');

console.log(`Checked ${checked.size} URLs (${sitemapPaths.length} in sitemap, ${posts} posts) on ${BASE}`);
for (const w of warnings) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(errors.length ? `\n${errors.length} error(s), ${warnings.length} warning(s)` : `\nNo errors. ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);

// News pages: article, hub, tag pages, ticker, RSS feed and Google News sitemap — plus the small
// list pieces (cards, rows, badges) the hub pages in lib/hubs.js reuse.
import { esc, tagsOf } from './content.js';
import { headCommon, banner, header, footer, spoilerToggle } from './partials.js';

const PUBLISHER = 'GTA6Info.in';
const AUTHOR = 'GTA6Info.in Desk';
const NEWS_WINDOW_MS = 2 * 24 * 3600 * 1000;
const TAG_LABELS = {
  india: 'India', 'release-time': 'Release Time', ps5: 'PS5', xbox: 'Xbox', price: 'Price', preload: 'Preload',
  scam: 'Scam Alert', guide: 'Guides', streaming: 'Streaming', 'new-zealand': 'New Zealand', usa: 'USA', pc: 'PC',
  'gta-online': 'GTA Online',
};
const TYPE_LABELS = { news: 'News', guide: 'Guide', fix: 'Fix' };
const TYPE_HUBS = { news: ['/news/', 'News'], guide: ['/guides/', 'Guides'], fix: ['/fixes/', 'Fixes'] };

const tagLabel = (t) => TAG_LABELS[t] || t.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const istDate = (iso, withTime = true) => new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric',
  ...(withTime ? { hour: 'numeric', minute: '2-digit', hour12: true } : {}),
}).format(new Date(iso)) + (withTime ? ' IST' : '');

const istShort = (iso) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso));

// Attributes every listed post carries: its freshness (for "new since your last visit") and a spoiler
// marker (hidden from lists unless the visitor switches spoiler posts on).
const itemAttrs = (p) => ` data-ts="${p.updated}"${p.spoiler ? ' data-spoiler-item' : ''}`;

const statusKind = (status) => {
  const s = status.toLowerCase();
  if (s.startsWith('fixed')) return 'fixed';
  if (s.startsWith('workaround')) return 'workaround';
  return 'open';
};

// `short` shows just the state word (open / workaround / fixed) for tight lists; hubs and posts show it all.
const statusChip = (status, short = false) => (status ? `<span class="fix-status fix-status-${statusKind(status)}"${short && status !== statusKind(status) ? ` title="${esc(status)}"` : ''}>${esc(short ? statusKind(status) : status)}</span>` : '');

const badges = (p) => [
  p.type !== 'news' ? `<span class="badge badge-${p.type}">${TYPE_LABELS[p.type]}</span>` : '',
  p.spoiler ? '<span class="badge badge-spoiler">Spoilers</span>' : '',
].join('');

// Homepage ticker: headlines only, rolling upward; the second copy makes the loop seamless.
const tickerHtml = (posts, n = 12) => {
  const list = posts.slice(0, n);
  if (!list.length) return '';
  const items = (hidden) => list.map((p) => `<li${itemAttrs(p)}><a href="/news/${p.slug}/"${hidden ? ' tabindex="-1"' : ''}><time datetime="${p.date}">${esc(istShort(p.date))}</time><span>${esc(p.title)}</span></a></li>`).join('');
  return `
<section class="ticker-card" aria-labelledby="ticker-h">
  <div class="ticker-head"><h2 id="ticker-h"><span class="live-dot" aria-hidden="true"></span> Latest GTA 6 news <small>+ around the web</small></h2><a href="/news/">All news →</a></div>
  <div class="ticker-viewport" style="--dur:${Math.max(18, list.length * 6)}s">
    <div class="ticker-roll">
      <ul class="ticker-list">${items(false)}</ul>
      <ul class="ticker-list" aria-hidden="true">${items(true)}</ul>
    </div>
  </div>
</section>`;
};

// Hero carousel list (light text on the dusk background). `kicker` labels each row: the time by default.
const heroListHtml = (posts, n, kicker = (p) => `<time datetime="${p.date}">${esc(istShort(p.date))} IST</time>`, empty = 'News is on the way. Check back in a few hours.') => (posts.length
  ? `<ol class="hero-news">${posts.slice(0, n).map((p) => `<li${itemAttrs(p)}><a href="/news/${p.slug}/">${kicker(p)}<span>${esc(p.title)}${p.spoiler ? ' <em class="badge badge-spoiler">Spoilers</em>' : ''}</span></a></li>`).join('')}</ol>`
  : `<p class="hero-news-empty">${esc(empty)}</p>`);

const heroNewsHtml = (posts, n = 10) => heroListHtml(posts, n);

// Carousel slide: the brief's headline + first few bullets, cropped, with a button to the full panel.
const briefPreviewHtml = (brief, n = 3) => {
  if (!brief) return '<h2 class="slide-title">✦ AI Brief</h2><p class="hero-news-empty">The AI brief is being prepared. Check back shortly.</p>';
  const bullets = (brief.html.match(/<li[\s>][\s\S]*?<\/li>/g) || []).slice(0, n).join('');
  return `<div class="ai-preview">
          <h2 class="slide-title"><b>✦ AI Brief</b> what's hot right now${brief.updated ? ` <span>updated ${esc(istDate(brief.updated))}</span>` : ''}</h2>
          ${brief.headline ? `<p class="ai-preview-headline">${esc(brief.headline)}</p>` : ''}
          <div class="ai-preview-body"><ul>${bullets}</ul></div>
          <p class="ai-preview-more"><a class="ai-open-btn" href="/ai/">✦ Open the full AI Brief</a> What to try today, the fix of the day, and what's happening around the world.</p>
        </div>`;
};

// Floating "AI Brief" panel, present on every page.
const briefHtml = (brief) => `
<button class="ai-fab" type="button" data-ai-open aria-expanded="false" aria-controls="ai-pop"><span aria-hidden="true">✦</span> AI Brief</button>
<div class="ai-pop" id="ai-pop" role="dialog" aria-modal="false" aria-labelledby="ai-pop-h" hidden>
  <div class="faq-pop-head">
    <h2 id="ai-pop-h"><span aria-hidden="true">✦</span> AI Brief: what's hot</h2>
    <button class="faq-pop-close" type="button" data-ai-close aria-label="Close AI brief">✕</button>
  </div>
  ${brief ? `${brief.updated ? `<p class="ai-meta">Updated <time datetime="${brief.updated}">${esc(istDate(brief.updated))}</time> · refreshed about every hour</p>` : ''}
  ${brief.headline ? `<p class="ai-headline">${esc(brief.headline)}</p>` : ''}
  <div class="ai-body">${brief.html}</div>` : '<p class="ai-meta">The brief is being prepared. Check back shortly.</p>'}
  <p class="ai-note">Written by AI from linked sources and checked against our posts. Follow the links for details.</p>
  <p class="faq-pop-foot"><a href="/ai/">Open the AI Brief page →</a> · <a href="/news/">All GTA 6 news →</a></p>
</div>`;

const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const tagChips = (tags) => tags.map((t) => `<a class="tag-chip" href="/tag/${t}/">${esc(tagLabel(t))}</a>`).join('');

const postCard = (p) => `
<article class="news-card" data-type="${p.type}"${itemAttrs(p)}>
  <p class="news-meta">${badges(p)}${statusChip(p.status)}<time datetime="${p.date}">${esc(istDate(p.date))}</time> · ${p.minutes} min read</p>
  <h3><a href="/news/${p.slug}/">${esc(p.title)}</a></h3>
  <p class="news-desc">${esc(p.description)}</p>
  <p class="news-tags">${tagChips(p.tags.slice(0, 3))}</p>
</article>`;

const latestNewsHtml = (posts, n = 4) => (posts.length ? `
<section class="latest" aria-labelledby="latest-h">
  <div class="section-head">
    <h2 id="latest-h">Latest GTA 6 news <span class="pill">updated ${esc(istDate(posts[0].updated))}</span></h2>
    <p><a href="/news/">All GTA 6 news →</a></p>
  </div>
  <div class="news-grid">${posts.slice(0, n).map(postCard).join('')}</div>
</section>` : '');

const page = ({ head, bodyAttrs = 'data-page="guide"', main }) => `<!doctype html>
<html lang="en-IN">
<head>
${head}
</head>
<body ${bodyAttrs}>
${banner()}
${header()}
${main}
${footer()}
</body>
</html>`;

const breadcrumbLd = (items) => jsonLd({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `__SITE_URL__${path}` })),
});

const shareLinks = (title, path) => {
  const url = encodeURIComponent(`__SITE_URL__${path}`);
  const text = encodeURIComponent(title);
  return `<p class="share-row">Share:
    <a class="btn btn-small" href="https://wa.me/?text=${text}%20${url}" rel="noopener" target="_blank">WhatsApp</a>
    <a class="btn btn-small" href="https://twitter.com/intent/tweet?text=${text}&amp;url=${url}" rel="noopener" target="_blank">X</a>
    <a class="btn btn-small" href="https://www.reddit.com/submit?url=${url}&amp;title=${text}" rel="noopener" target="_blank">Reddit</a>
    <a class="btn btn-small" href="https://t.me/share/url?url=${url}&amp;text=${text}" rel="noopener" target="_blank">Telegram</a></p>`;
};

const renderPost = (post, posts) => {
  const path = `/news/${post.slug}/`;
  const [hubPath, hubName] = TYPE_HUBS[post.type];
  const related = [
    ...posts.filter((p) => p.slug !== post.slug && p.type === post.type && post.type !== 'news'),
    ...posts.filter((p) => p.slug !== post.slug && p.tags.some((t) => post.tags.includes(t))),
    ...posts.filter((p) => p.slug !== post.slug),
  ].filter((p, i, arr) => arr.indexOf(p) === i).slice(0, 3);
  const head = [
    headCommon({ title: `${post.title} | GTA6Info.in`, description: post.description, path, ogType: 'article', keywords: post.tags.map(tagLabel).join(', ') }),
    `<meta property="article:published_time" content="${post.date}">`,
    `<meta property="article:modified_time" content="${post.updated}">`,
    `<meta property="article:section" content="GTA 6 ${hubName}">`,
    ...post.tags.map((t) => `<meta property="article:tag" content="${esc(tagLabel(t))}">`),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: post.title.slice(0, 110),
      description: post.description,
      datePublished: post.date,
      dateModified: post.updated,
      inLanguage: 'en-IN',
      isAccessibleForFree: true,
      articleSection: `GTA 6 ${hubName}`,
      keywords: post.tags.map(tagLabel).join(', '),
      image: ['__SITE_URL__/og.png'],
      mainEntityOfPage: `__SITE_URL__${path}`,
      author: { '@type': 'Organization', name: AUTHOR, url: '__SITE_URL__/about/' },
      publisher: { '@type': 'Organization', name: PUBLISHER, logo: { '@type': 'ImageObject', url: '__SITE_URL__/icon-512.png' } },
      ...(post.sources.length ? { citation: post.sources.map((s) => s.url) } : {}),
    }),
    breadcrumbLd([['Home', '/'], [`GTA 6 ${hubName}`, hubPath], [post.title, path]]),
  ].join('\n');
  const sources = post.sources.length ? `
  <aside class="sources" aria-label="Sources">
    <h2>Sourced from</h2>
    <ul>${post.sources.map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a></li>`).join('')}</ul>
  </aside>` : '';
  const body = post.spoiler
    ? `<details class="spoiler-gate"><summary><span>⚠️ This post discusses story events.</span> <b>Show it</b></summary><div class="prose">${post.html}</div></details>`
    : `<div class="prose">${post.html}</div>`;
  const main = `
<main id="main" class="guide article">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span aria-hidden="true">/</span> <a href="${hubPath}">${hubName}</a></nav>
  <header class="guide-head">
    <p class="news-tags">${badges(post)}${tagChips(post.tags)}</p>
    <h1>${esc(post.title)}</h1>
    <p class="article-meta">By <a href="/about/">${AUTHOR}</a> · <time datetime="${post.date}">${esc(istDate(post.date))}</time>${post.updated !== post.date ? ` · Updated <time datetime="${post.updated}">${esc(istDate(post.updated))}</time>` : ''} · ${post.minutes} min read</p>
    ${post.status ? `<p class="fix-line">Status: ${statusChip(post.status)} <span class="muted">We update this post when that changes.</span></p>` : ''}
    <p class="lede">${esc(post.description)}</p>
  </header>
  ${sources}
  ${body}
  ${shareLinks(post.title, path)}
  ${related.length ? `<section class="related" aria-labelledby="rel-h"><h2 id="rel-h">Keep reading</h2><div class="news-grid">${related.map(postCard).join('')}</div></section>` : ''}
  <section class="cta-row">
    <a class="btn btn-hot" href="/guides/">GTA 6 guides →</a>
    <a class="btn" href="/fixes/">Something broken? Fixes →</a>
    <a class="btn" href="/gta-6-india/">🇮🇳 GTA 6 India hub →</a>
  </section>
</main>`;
  return page({ head, main });
};

const typeChips = (posts) => {
  const count = (t) => posts.filter((p) => p.type === t).length;
  const chip = (type, label, n) => `<button class="chip" type="button" data-type="${type}" aria-pressed="${type === 'all'}">${label} <span>${n}</span></button>`;
  return `<div class="chips type-chips" role="group" aria-label="Show only" data-type-chips>
    ${chip('all', 'All', posts.length)}${chip('news', 'News', count('news'))}${chip('guide', 'Guides', count('guide'))}${chip('fix', 'Fixes', count('fix'))}
  </div>`;
};

const lastUpdate = (posts) => posts.reduce((m, p) => (p.updated > m ? p.updated : m), posts[0].updated);

const listPage = ({ title, description, path, h1, intro, posts, crumbs, chips = false }) => {
  const head = [
    headCommon({ title, description, path }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: h1,
      description,
      url: `__SITE_URL__${path}`,
      inLanguage: 'en-IN',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: posts.slice(0, 30).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `__SITE_URL__/news/${p.slug}/`, name: p.title })),
      },
    }),
  ].join('\n');
  const tags = tagsOf(posts);
  const main = `
<main id="main" class="guide news-hub">
  <nav class="crumbs" aria-label="Breadcrumb">${crumbs}</nav>
  <div class="news-bar">
    <p><span class="live-dot" aria-hidden="true"></span> Updated every hour${posts[0] ? ` · last update <time datetime="${lastUpdate(posts)}">${esc(istDate(lastUpdate(posts)))}</time>` : ''}</p>
    ${spoilerToggle()}
    <a href="/news/how-to-get-gta6info-news-automatically-rss-telegram-discord/">Stay updated with our news automatically — here's how →</a>
  </div>
  <header class="guide-head">
    <h1>${esc(h1)}</h1>
    <p class="lede">${intro}</p>
  </header>
  ${chips ? typeChips(posts) : ''}
  ${tags.length ? `<p class="news-tags tag-cloud">${tags.map(({ tag, count }) => `<a class="tag-chip" href="/tag/${tag}/">${esc(tagLabel(tag))} <span>${count}</span></a>`).join('')}</p>` : ''}
  <div class="news-list">${posts.map(postCard).join('') || '<p class="muted">No posts yet. Check back soon.</p>'}</div>
  <section class="cta-row">
    <a class="btn btn-hot" href="/guides/">GTA 6 guides →</a>
    <a class="btn" href="/fixes/">GTA 6 fixes →</a>
    <a class="btn" href="/news/feed.xml">RSS feed</a>
  </section>
</main>`;
  return page({ head, main });
};

const renderNewsHub = (posts) => listPage({
  title: 'GTA 6 News India 🔥 Latest Updates, Guides and Fixes (Updated Every Hour) | GTA6Info.in',
  description: 'All the latest GTA 6 news for India: launch updates, PS5 and Xbox fixes, how-to guides, prices in ₹ and what Indian players are talking about. Sources linked, refreshed every hour.',
  path: '/news/',
  h1: 'GTA 6 News India',
  intro: 'Every GTA 6 story, guide and fix for Indian players, newest first, with sources linked on every story.',
  posts,
  crumbs: '<a href="/">Home</a> <span aria-hidden="true">/</span> <span>News</span>',
  chips: true,
});

const renderTag = (tag, posts) => {
  const label = tagLabel(tag);
  const tagged = posts.filter((p) => p.tags.includes(tag));
  return listPage({
    title: `GTA 6 ${label} News & Updates (India) | GTA6Info.in`,
    description: `Every GTA 6 ${label.toLowerCase()} story on GTA6Info.in: ${tagged.length} update${tagged.length === 1 ? '' : 's'} with sources linked, refreshed every hour for players in India.`,
    path: `/tag/${tag}/`,
    h1: `GTA 6 ${label} news`,
    intro: `Every GTA 6 story tagged <b>${esc(label)}</b>, newest first.`,
    posts: tagged,
    crumbs: `<a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/news/">News</a> <span aria-hidden="true">/</span> <span>${esc(label)}</span>`,
  });
};

const renderRss = (posts) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>GTA6Info.in — GTA 6 News India</title>
  <link>__SITE_URL__/news/</link>
  <description>GTA 6 news, guides and fixes for players in India: prices in ₹, times in IST, sources linked.</description>
  <language>en-in</language>
  <atom:link href="__SITE_URL__/news/feed.xml" rel="self" type="application/rss+xml"/>
  ${posts[0] ? `<lastBuildDate>${new Date(posts[0].updated).toUTCString()}</lastBuildDate>` : ''}
${posts.slice(0, 50).map((p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>__SITE_URL__/news/${p.slug}/</link>
    <guid isPermaLink="true">__SITE_URL__/news/${p.slug}/</guid>
    <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    <description>${esc(p.description)}</description>
${p.tags.map((t) => `    <category>${esc(tagLabel(t))}</category>`).join('\n')}
  </item>`).join('\n')}
</channel>
</rss>
`;

// Google News sitemap: only articles from the last two days belong in it.
const renderNewsSitemap = (posts, now = Date.now()) => {
  const recent = posts.filter((p) => now - new Date(p.date).getTime() <= NEWS_WINDOW_MS);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${recent.map((p) => `  <url>
    <loc>__SITE_URL__/news/${p.slug}/</loc>
    <news:news>
      <news:publication><news:name>${PUBLISHER}</news:name><news:language>en</news:language></news:publication>
      <news:publication_date>${p.date}</news:publication_date>
      <news:title>${esc(p.title)}</news:title>
    </news:news>
  </url>`).join('\n')}
</urlset>
`;
};

export {
  renderPost, renderNewsHub, renderTag, renderRss, renderNewsSitemap, latestNewsHtml, tickerHtml, heroNewsHtml, heroListHtml,
  briefHtml, briefPreviewHtml, tagLabel, istDate, istShort, itemAttrs, statusChip, badges, postCard, page, jsonLd, breadcrumbLd, TYPE_LABELS,
};

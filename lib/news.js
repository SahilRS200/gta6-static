// News pages: article, hub, tag pages, latest-news strip, RSS feed and Google News sitemap.
import { esc, tagsOf } from './content.js';
import { headCommon, banner, header, footer } from './partials.js';

const PUBLISHER = 'GTA6Info.in';
const AUTHOR = 'GTA6Info.in Desk';
const NEWS_WINDOW_MS = 2 * 24 * 3600 * 1000;
const TAG_LABELS = {
  india: 'India', 'release-time': 'Release Time', ps5: 'PS5', xbox: 'Xbox', price: 'Price', preload: 'Preload',
  scam: 'Scam Alert', guide: 'Guides', streaming: 'Streaming', 'new-zealand': 'New Zealand', usa: 'USA', pc: 'PC',
};

const tagLabel = (t) => TAG_LABELS[t] || t.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const istDate = (iso, withTime = true) => new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric',
  ...(withTime ? { hour: 'numeric', minute: '2-digit', hour12: true } : {}),
}).format(new Date(iso)) + (withTime ? ' IST' : '');

const istShort = (iso) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso));

// Homepage ticker: headlines only, rolling upward; the second copy makes the loop seamless.
const tickerHtml = (posts, n = 12) => {
  const list = posts.slice(0, n);
  if (!list.length) return '';
  const items = (hidden) => list.map((p) => `<li><a href="/news/${p.slug}/"${hidden ? ' tabindex="-1"' : ''}><time datetime="${p.date}">${esc(istShort(p.date))}</time><span>${esc(p.title)}</span></a></li>`).join('');
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

// Hero carousel slide: the five newest headlines, light text on the dusk background.
const heroNewsHtml = (posts, n = 5) => (posts.length
  ? `<ol class="hero-news">${posts.slice(0, n).map((p) => `<li><a href="/news/${p.slug}/"><time datetime="${p.date}">${esc(istShort(p.date))} IST</time><span>${esc(p.title)}</span></a></li>`).join('')}</ol>`
  : '<p class="hero-news-empty">News is on the way. Check back in a few hours.</p>');

// Carousel slide: the brief's headline + first few bullets, cropped, with a button to the full panel.
const briefPreviewHtml = (brief) => {
  if (!brief) return '<h2 class="slide-title">✦ AI Brief</h2><p class="hero-news-empty">The AI brief is being prepared. Check back shortly.</p>';
  const bullets = (brief.html.match(/<li>[\s\S]*?<\/li>/g) || []).slice(0, 3).join('');
  return `<div class="ai-preview">
          <h2 class="slide-title"><b>✦ AI Brief</b> what's hot right now${brief.updated ? ` <span>updated ${esc(istDate(brief.updated))}</span>` : ''}</h2>
          ${brief.headline ? `<p class="ai-preview-headline">${esc(brief.headline)}</p>` : ''}
          <div class="ai-preview-body"><ul>${bullets}</ul></div>
          <p class="ai-preview-more"><button class="ai-open-btn" type="button" data-ai-open aria-controls="ai-pop">✦ Open the full AI Brief</button> Click on AI Brief for more: what to do now, and what's happening around the world.</p>
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
  <p class="faq-pop-foot"><a href="/news/">All GTA 6 news →</a> · <a href="/gta-6-india/">GTA 6 India hub →</a></p>
</div>`;

const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const tagChips = (tags) => tags.map((t) => `<a class="tag-chip" href="/tag/${t}/">${esc(tagLabel(t))}</a>`).join('');

const postCard = (p) => `
<article class="news-card">
  <p class="news-meta"><time datetime="${p.date}">${esc(istDate(p.date))}</time> · ${p.minutes} min read</p>
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
  const related = [
    ...posts.filter((p) => p.slug !== post.slug && p.tags.some((t) => post.tags.includes(t))),
    ...posts.filter((p) => p.slug !== post.slug),
  ].filter((p, i, arr) => arr.indexOf(p) === i).slice(0, 3);
  const head = [
    headCommon({ title: `${post.title} | GTA6Info.in`, description: post.description, path, ogType: 'article', keywords: post.tags.map(tagLabel).join(', ') }),
    `<meta property="article:published_time" content="${post.date}">`,
    `<meta property="article:modified_time" content="${post.updated}">`,
    '<meta property="article:section" content="GTA 6 News">',
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
      articleSection: 'GTA 6 News',
      keywords: post.tags.map(tagLabel).join(', '),
      image: ['__SITE_URL__/og.png'],
      mainEntityOfPage: `__SITE_URL__${path}`,
      author: { '@type': 'Organization', name: AUTHOR, url: '__SITE_URL__/about/' },
      publisher: { '@type': 'Organization', name: PUBLISHER, logo: { '@type': 'ImageObject', url: '__SITE_URL__/icon-512.png' } },
      ...(post.sources.length ? { citation: post.sources.map((s) => s.url) } : {}),
    }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: '__SITE_URL__/' },
        { '@type': 'ListItem', position: 2, name: 'GTA 6 News', item: '__SITE_URL__/news/' },
        { '@type': 'ListItem', position: 3, name: post.title, item: `__SITE_URL__${path}` },
      ],
    }),
  ].join('\n');
  const sources = post.sources.length ? `
  <aside class="sources" aria-label="Sources">
    <h2>Sourced from</h2>
    <ul>${post.sources.map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a></li>`).join('')}</ul>
  </aside>` : '';
  const main = `
<main id="main" class="guide article">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/news/">News</a></nav>
  <header class="guide-head">
    <p class="news-tags">${tagChips(post.tags)}</p>
    <h1>${esc(post.title)}</h1>
    <p class="article-meta">By <a href="/about/">${AUTHOR}</a> · <time datetime="${post.date}">${esc(istDate(post.date))}</time>${post.updated !== post.date ? ` · Updated <time datetime="${post.updated}">${esc(istDate(post.updated))}</time>` : ''} · ${post.minutes} min read</p>
    <p class="lede">${esc(post.description)}</p>
  </header>
  ${sources}
  <section class="mini-count" aria-label="India unlock countdown">
    <p class="muted">🇮🇳 GTA 6 unlocks in India in</p>
    <div class="countdown countdown-md" data-countdown="india"></div>
  </section>
  <div class="prose">${post.html}</div>
  ${shareLinks(post.title, path)}
  ${related.length ? `<section class="related" aria-labelledby="rel-h"><h2 id="rel-h">Keep reading</h2><div class="news-grid">${related.map(postCard).join('')}</div></section>` : ''}
  <section class="cta-row">
    <a class="btn btn-hot" href="/">Live GTA 6 countdown →</a>
    <a class="btn" href="/gta-6-india/">GTA 6 India: everything in one place →</a>
  </section>
</main>`;
  return page({ head, main });
};

const listPage = ({ title, description, path, h1, intro, posts, crumbs }) => {
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
    <p><span class="live-dot" aria-hidden="true"></span> Updated every hour${posts[0] ? ` · last update <time datetime="${posts.reduce((m, p) => (p.updated > m ? p.updated : m), posts[0].updated)}">${esc(istDate(posts.reduce((m, p) => (p.updated > m ? p.updated : m), posts[0].updated)))}</time>` : ''}</p>
    <a href="/news/how-to-get-gta6info-news-automatically-rss-telegram-discord/">Stay updated with our news automatically — here's how →</a>
  </div>
  <header class="guide-head">
    <h1>${esc(h1)}</h1>
    <p class="lede">${intro}</p>
  </header>
  ${tags.length ? `<p class="news-tags tag-cloud">${tags.map(({ tag, count }) => `<a class="tag-chip" href="/tag/${tag}/">${esc(tagLabel(tag))} <span>${count}</span></a>`).join('')}</p>` : ''}
  <div class="news-list">${posts.map(postCard).join('') || '<p class="muted">No posts yet. Check back soon.</p>'}</div>
  <section class="cta-row">
    <a class="btn btn-hot" href="/">Live GTA 6 countdown →</a>
    <a class="btn" href="/news/feed.xml">RSS feed</a>
  </section>
</main>`;
  return page({ head, main });
};

const renderNewsHub = (posts) => listPage({
  title: 'GTA 6 News India 🔥 Latest Updates, Leaks & Launch Info (Updated Every Few Hours) | GTA6Info.in',
  description: 'All the latest GTA 6 news for India: release time in IST, price in ₹, preload, PS5 tips, scams to avoid and launch-night updates. Refreshed every few hours.',
  path: '/news/',
  h1: 'GTA 6 News India',
  intro: 'Release time in IST, prices in ₹, preload status, PS5 tips and every launch-night update, with sources linked on every story.',
  posts,
  crumbs: '<a href="/">Home</a> <span aria-hidden="true">/</span> <span>News</span>',
});

const renderTag = (tag, posts) => {
  const label = tagLabel(tag);
  const tagged = posts.filter((p) => p.tags.includes(tag));
  return listPage({
    title: `GTA 6 ${label} News & Updates (India) | GTA6Info.in`,
    description: `Every GTA 6 ${label.toLowerCase()} story on GTA6Info.in: ${tagged.length} update${tagged.length === 1 ? '' : 's'} with sources linked, refreshed every few hours.`,
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
  <description>GTA 6 release time in IST, price in India, preload and launch updates.</description>
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

export { renderPost, renderNewsHub, renderTag, renderRss, renderNewsSitemap, latestNewsHtml, tickerHtml, heroNewsHtml, briefHtml, briefPreviewHtml, tagLabel };

// Post-launch hubs: /guides/, /fixes/, /whats-next/, /ai/, the home carousel slides and home blocks, the
// India hub blocks and the search index. Hubs are views over the same posts — no second content system.
import { esc } from './content.js';
import { headCommon } from './partials.js';
import { dayLabel } from '../public/js/day.js';
import { heroListHtml, istDate, itemAttrs, statusChip, badges, postCard, page, jsonLd, breadcrumbLd, TYPE_LABELS } from './news.js';

// Guide sections in display order. A guide goes to the first section in MATCH_ORDER whose tags it
// carries (most specific first), else "More guides". Empty sections are not shown.
const GUIDE_SECTIONS = [
  { id: 'first-hours', title: 'First hours', tags: ['first-hours', 'tips', 'saving', 'beginner'] },
  { id: 'controls', title: 'Controls and camera', tags: ['controls', 'camera'] },
  { id: 'money', title: 'Money and progress', tags: ['money', 'cheats', 'progress'] },
  { id: 'police', title: 'Police and combat', tags: ['police', 'wanted-level', 'combat', 'weapons'] },
  { id: 'settings', title: 'Settings and performance', tags: ['settings', 'performance'] },
  { id: 'streaming', title: 'Streaming', tags: ['streaming', 'youtube'] },
  { id: 'more', title: 'More guides', tags: [] },
];
const MATCH_ORDER = ['police', 'controls', 'money', 'settings', 'streaming', 'first-hours'];

// Hand-written guides that live outside content/news/.
const STATIC_GUIDES = [
  { url: '/guides/stream-gta-6-ps5-youtube-twitch/', title: 'Stream GTA 6 live from PS5 to YouTube and Twitch', description: 'Link your accounts, go live with Create → Broadcast, and fix "stuck on preparing".', section: 'streaming' },
  { url: '/guides/ps5-time-zone/', title: 'How to change your PS5 time zone (and why it never unlocked GTA 6 early)', description: 'Launch-week reference: the menu path, and why the unlock followed your PSN account region.', section: 'more' },
];

const TRACKER_STATUSES = ['confirmed', 'reported', 'rumoured', 'not announced'];

const sectionOf = (p) => MATCH_ORDER.find((id) => GUIDE_SECTIONS.find((s) => s.id === id).tags.some((t) => p.tags.includes(t))) || 'more';
const sectionTitle = (id) => GUIDE_SECTIONS.find((s) => s.id === id).title;

const byUpdated = (a, b) => b.updated.localeCompare(a.updated);
const guidesOf = (posts) => posts.filter((p) => p.type === 'guide').sort(byUpdated);
const fixesOf = (posts) => posts.filter((p) => p.type === 'fix').sort(byUpdated);

// In a list that is already all fixes (or all guides), the type badge is noise: keep only the spoiler one.
const fromPost = (p, typeBadge = true) => ({
  url: `/news/${p.slug}/`, title: p.title, description: p.description, updated: p.updated, status: p.status, attrs: itemAttrs(p),
  badges: typeBadge ? badges(p) : badges({ ...p, type: 'news' }),
});
const fromSameTypePost = (p) => fromPost(p, false);

// One row in a hub list (guides, fixes, home blocks).
const hubRow = (it) => `
<li class="hub-row"${it.attrs || ''}>
  <a href="${it.url}"><span class="hub-title">${esc(it.title)}</span><span class="hub-desc">${esc(it.description)}</span></a>
  <span class="hub-meta">${it.badges || ''}${it.status ? statusChip(it.status) : ''}${it.updated ? `<span>Updated <time datetime="${it.updated}">${esc(istDate(it.updated))}</time></span>` : ''}</span>
</li>`;

const collectionLd = (name, description, path, items) => jsonLd({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name,
  description,
  url: `__SITE_URL__${path}`,
  inLanguage: 'en-IN',
  mainEntity: { '@type': 'ItemList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: `__SITE_URL__${it.url}`, name: it.title })) },
});

// ---------- /guides/ ----------
const renderGuidesHub = (posts) => {
  const path = '/guides/';
  const title = 'GTA 6 Guides and Tips — How to Save, Lose the Cops, Cheats, Settings and More (India) | GTA6Info.in';
  const description = 'Spoiler-free GTA 6 guides for Indian players: how to save, lose the cops, unlock cheats, pick the best settings and stream from PS5. Every guide is updated as the game changes.';
  const items = [
    ...guidesOf(posts).map((p) => ({ ...fromSameTypePost(p), section: sectionOf(p) })),
    ...STATIC_GUIDES,
  ];
  const sections = GUIDE_SECTIONS.map((s) => ({ ...s, items: items.filter((it) => it.section === s.id) })).filter((s) => s.items.length);
  const head = [
    headCommon({ title, description, path, keywords: 'GTA 6 guide, GTA 6 tips, GTA 6 how to save, GTA 6 cheats, GTA 6 wanted level, GTA 6 settings, GTA 6 beginner tips' }),
    collectionLd('GTA 6 guides and tips', description, path, items),
    breadcrumbLd([['Home', '/'], ['GTA 6 Guides', path]]),
  ].join('\n');
  const main = `
<main id="main" class="guide wide hub-page">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span aria-hidden="true">/</span> <span>Guides</span></nav>
  <header class="guide-head">
    <p class="eyebrow">Guides · spoiler-free · updated as the game changes</p>
    <h1>GTA 6 guides: <span class="grad">how do I…?</span></h1>
    <p class="lede">Short, spoiler-free answers to what players are asking right now, each with its sources. Something not working instead? <a href="/fixes/">Try the fixes →</a></p>
  </header>
  <nav class="chips section-chips" aria-label="Guide sections">${sections.map((s) => `<a class="chip" href="#${s.id}">${esc(s.title)} <span>${s.items.length}</span></a>`).join('')}</nav>
  ${sections.map((s) => `
  <section class="hub-section" id="${s.id}" aria-labelledby="${s.id}-h">
    <h2 id="${s.id}-h">${esc(s.title)}</h2>
    <ul class="hub-list">${s.items.map(hubRow).join('')}</ul>
  </section>`).join('')}
  <section class="cta-row">
    <a class="btn btn-hot" href="/fixes/">Something broken? Fixes →</a>
    <a class="btn" href="/news/">All GTA 6 news →</a>
    <a class="btn" href="/gta-6-india/">🇮🇳 GTA 6 India hub →</a>
  </section>
</main>`;
  return page({ head, main });
};

// ---------- /fixes/ ----------
const psnCard = (headingId = 'psn-h') => `
<section class="status-card" aria-labelledby="${headingId}">
  <h2 id="${headingId}" class="slide-title">Is PlayStation online in India? <span>live from status.playstation.com</span></h2>
  <div class="psn" data-psn><p class="psn-loading">Checking PlayStation services…</p></div>
</section>`;

const renderFixesHub = (posts) => {
  const path = '/fixes/';
  const title = 'GTA 6 Fixes — Game Locked, PSN Errors, Bugs and Lost Saves: What Works (India) | GTA6Info.in';
  const description = 'GTA 6 not starting, PSN sign-in errors, bugs or lost saves? Live PlayStation status for India, plus every known GTA 6 problem with its status and the fix that works. Updated hourly.';
  const items = fixesOf(posts).map(fromSameTypePost);
  const head = [
    headCommon({ title, description, path, keywords: 'GTA 6 not starting, GTA 6 locked PS5, GTA 6 PSN error, GTA 6 bugs, GTA 6 crash, GTA 6 fix, PSN down India' }),
    collectionLd('GTA 6 fixes', description, path, items),
    items.length ? jsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((it) => ({ '@type': 'Question', name: it.title, acceptedAnswer: { '@type': 'Answer', text: `${it.description}${it.status ? ` Status: ${it.status}.` : ''}` } })),
    }) : '',
    breadcrumbLd([['Home', '/'], ['GTA 6 Fixes', path]]),
  ].join('\n');
  const main = `
<main id="main" class="guide wide hub-page">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span aria-hidden="true">/</span> <span>Fixes</span></nav>
  <header class="guide-head">
    <p class="eyebrow">Fixes · is it me or is it Sony?</p>
    <h1>GTA 6 fixes: <span class="grad">something broken?</span></h1>
    <p class="lede">First check whether PlayStation itself is down. Then find your problem below: each one shows whether it is still open, has a workaround, or was fixed in a patch.</p>
  </header>
  ${psnCard()}
  <section class="hub-section" aria-labelledby="fix-list-h">
    <h2 id="fix-list-h">Known GTA 6 problems</h2>
    ${items.length ? `<ul class="hub-list">${items.map(hubRow).join('')}</ul>` : '<p class="muted">No known problems right now.</p>'}
    <p class="legend"><span class="fix-status fix-status-open">open</span> no fix yet · <span class="fix-status fix-status-workaround">workaround</span> something you can do now · <span class="fix-status fix-status-fixed">fixed</span> patched</p>
  </section>
  <section class="hub-section" aria-labelledby="who-h">
    <h2 id="who-h">Still stuck? Who to contact</h2>
    <ul class="ticks">
      <li><b>PlayStation Support</b> for launch, download, code and refund problems: <a href="https://www.playstation.com/en-in/support/games/gta-vi-support/" rel="noopener" target="_blank">PlayStation India GTA VI support</a>.</li>
      <li><b>Rockstar Support</b> for bugs and gameplay issues: <a href="https://support.rockstargames.com/" rel="noopener" target="_blank">support.rockstargames.com</a>.</li>
    </ul>
  </section>
  <section class="cta-row">
    <a class="btn btn-hot" href="/guides/">GTA 6 guides →</a>
    <a class="btn" href="/whats-next/">Next patch and what's coming →</a>
    <a class="btn" href="/gta-6-india/">🇮🇳 GTA 6 India hub →</a>
  </section>
</main>`;
  return page({ head, main });
};

// ---------- /whats-next/ (content/whats-next.md) ----------
const splitRow = (line) => String(line).split('|').map((s) => s.trim());

const trackerItems = (doc) => (Array.isArray(doc?.data?.items) ? doc.data.items : []).map(splitRow).map(([name = '', status = '', date = '', link = '', note = '']) => {
  const known = TRACKER_STATUSES.includes(status.toLowerCase()) ? status.toLowerCase() : 'not announced';
  const at = /^\d{4}-\d{2}-\d{2}T/.test(date) ? Date.parse(date) : NaN;
  return { name, status: known, date, link: link.startsWith('/') || /^https?:\/\//.test(link) ? link : '', note, countdownAt: known === 'confirmed' && !Number.isNaN(at) ? new Date(at).toISOString() : '' };
}).filter((it) => it.name);

const patchItems = (doc) => (Array.isArray(doc?.data?.patches) ? doc.data.patches : []).map(splitRow)
  .map(([date = '', version = '', detail = '', link = '']) => ({ date, version, detail, link: link.startsWith('/') ? link : '' }))
  .filter((p) => p.version);

const fmtTrackerDate = (date) => {
  if (!date || date === '-' || date === '—') return '—';
  if (/^\d{4}-\d{2}-\d{2}T/.test(date)) return istDate(date);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return istDate(`${date}T12:00:00+05:30`, false);
  return esc(date);
};

const statusPill = (status) => `<span class="track-status track-${status.replace(/\s+/g, '-')}">${esc(status[0].toUpperCase() + status.slice(1))}</span>`;

const trackerRowHtml = (it) => `
<li class="track-row">
  <div class="track-main">
    <b class="track-name">${esc(it.name)}</b>
    ${statusPill(it.status)}
    ${fmtTrackerDate(it.date) === '—' ? '' : `<span class="track-date">${fmtTrackerDate(it.date)}</span>`}
  </div>
  ${it.note ? `<p class="track-note">${esc(it.note)}${it.link ? ` <a href="${esc(it.link)}"${it.link.startsWith('http') ? ' rel="noopener" target="_blank"' : ''}>Details →</a>` : ''}</p>` : ''}
  ${it.countdownAt ? `<div class="countdown countdown-md" data-countdown-to="${it.countdownAt}" aria-live="off"></div>` : ''}
</li>`;

const renderWhatsNext = (doc) => {
  const path = '/whats-next/';
  const title = "What's Next for GTA 6 — GTA 6 Online, PC Release, Patches and DLC Tracker | GTA6Info.in";
  const description = "Is GTA 6 Online out? When is the PC version? Our tracker shows what Rockstar has confirmed, what is only reported or rumoured, and every GTA 6 patch with its size. Updated hourly.";
  const items = trackerItems(doc);
  const patches = patchItems(doc);
  const head = [
    headCommon({ title, description, path, keywords: 'GTA 6 Online release date, GTA 6 PC release date, GTA 6 patch, GTA 6 update, GTA 6 DLC, GTA 6 what next' }),
    collectionLd("What's next for GTA 6", description, path, items.map((it) => ({ url: it.link.startsWith('/') ? it.link : path, title: it.name }))),
    breadcrumbLd([['Home', '/'], ["What's next for GTA 6", path]]),
  ].join('\n');
  const main = `
<main id="main" class="guide hub-page">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span aria-hidden="true">/</span> <span>What's next</span></nav>
  <header class="guide-head">
    <p class="eyebrow">Tracker${doc?.updated ? ` · updated ${esc(istDate(doc.updated))}` : ''}</p>
    <h1>What's next for GTA 6: <span class="grad">Online, PC, patches, DLC</span></h1>
    ${doc?.html ? `<div class="lede">${doc.html}</div>` : ''}
  </header>
  <section class="hub-section" aria-labelledby="track-h">
    <h2 id="track-h">The tracker</h2>
    ${items.length ? `<ul class="track-list">${items.map(trackerRowHtml).join('')}</ul>` : '<p class="muted">Nothing tracked yet.</p>'}
    <p class="legend">${TRACKER_STATUSES.map(statusPill).join(' ')} — only <b>Confirmed</b> means Rockstar or the platform said so. A countdown appears only when a date is confirmed.</p>
  </section>
  <section class="hub-section" aria-labelledby="patch-h">
    <h2 id="patch-h">GTA 6 patch notes</h2>
    ${patches.length ? `<ul class="patch-list">${patches.map((p) => `<li><span class="patch-date">${fmtTrackerDate(p.date)}</span> <b>${esc(p.version)}</b> <span class="muted">${esc(p.detail)}</span>${p.link ? ` <a href="${esc(p.link)}">Details →</a>` : ''}</li>`).join('')}</ul>` : '<p class="muted">No patches yet.</p>'}
  </section>
  <section class="cta-row">
    <a class="btn btn-hot" href="/fixes/">Known problems and fixes →</a>
    <a class="btn" href="/news/">All GTA 6 news →</a>
    <a class="btn" href="/gta-6-india/">🇮🇳 GTA 6 India hub →</a>
  </section>
</main>`;
  return page({ head, main });
};

// ---------- /ai/ — the AI Brief as a page: big headline, then the brief and the news side by side ----------
const SKYLINE = '<svg class="skyline" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="104" width="1200" height="16" fill="currentColor"/><path fill="currentColor" d="M0 120V92h40V70h22v22h18V58h30v34h16V80h24V48h12V36h10v12h12v44h20V66h34v26h14V54h26v38h22V74h18V40h8V28h6v12h8v52h26V84h30V62h22v30h16V50h38v42h12V72h28V58h14v34h22V44h10V32h12v12h10v48h26V76h20V60h30v32h18V68h24v24h16V52h28v40h22V80h18V46h14V36h8v10h12v46h24V70h32v22h16V56h22v36h20V74h26v18h18V62h30v30h14V82h40v38z"/></svg>';

// The brief's own ## sections become h3 under the column heading; ids are dropped because the floating
// brief panel on the same page carries the same headings.
const briefForPage = (html) => html.replace(/<h2 id="[^"]*">/g, '<h3>').replace(/<\/h2>/g, '</h3>');

// Changes when the brief or the newest post changes; the page's quiet refresh compares it.
const aiSignature = (brief, posts) => `${brief?.updated || ''}|${posts[0]?.slug || ''}|${posts.length}`;

const renderAiPage = (brief, posts) => {
  const path = '/ai/';
  const title = "GTA 6 AI Brief — What's Hot for Indian Players Right Now (Updated Hourly) | GTA6Info.in";
  const description = "The GTA 6 AI Brief: the one story that matters most this hour for Indian players, what to try today, the fix of the day and the latest news, side by side. Updated every hour.";
  const head = [
    headCommon({ title, description, path, keywords: 'GTA 6 AI brief, GTA 6 latest news, GTA 6 today, GTA 6 India news, GTA 6 what is happening' }),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'GTA 6 AI Brief',
      description,
      url: `__SITE_URL__${path}`,
      inLanguage: 'en-IN',
      ...(brief?.updated ? { dateModified: brief.updated } : {}),
      isPartOf: { '@id': '__SITE_URL__/#website' },
    }),
    breadcrumbLd([['Home', '/'], ['GTA 6 AI Brief', path]]),
  ].join('\n');
  const main = `
<main id="main" class="ai-page">
  <section class="hero hero-ai" aria-labelledby="ai-h" data-ai-sig="${esc(aiSignature(brief, posts))}">
    ${SKYLINE}
    <p class="eyebrow" data-ai-meta>✦ AI Brief${brief?.updated ? ` · updated <time datetime="${brief.updated}">${esc(istDate(brief.updated))}</time>` : ''} · refreshed every hour</p>
    <h1 id="ai-h" class="ai-page-headline" data-ai-headline>${esc(brief?.headline || "What's hot in GTA 6 right now")}</h1>
    <p class="ai-page-sub"><span class="day-chip" data-day>${dayLabel()}</span> <span>What matters most for Indian players this hour, from our sourced posts.</span></p>
    <div class="ai-cols">
      <section class="ai-col ai-col-brief" aria-labelledby="ai-brief-h" data-ai-brief>
        <h2 id="ai-brief-h" class="slide-title"><b>✦ The brief</b> <span>what to know, what to do</span></h2>
        ${brief?.html ? briefForPage(brief.html) : '<p>The brief is being prepared. Check back shortly.</p>'}
        <p class="ai-col-note">Written by AI from linked sources and checked against our posts. Follow the links for details.</p>
      </section>
      <section class="ai-col ai-col-news" aria-labelledby="ai-news-h" data-ai-news>
        <h2 id="ai-news-h" class="slide-title">Latest GTA 6 news <span>updated every hour</span></h2>
        ${heroListHtml(posts, 10)}
        <p class="slide-more"><a href="/news/">All GTA 6 news →</a> · <a href="/guides/">Guides →</a> · <a href="/fixes/">Fixes →</a></p>
      </section>
    </div>
  </section>
</main>`;
  return page({ head, bodyAttrs: 'data-page="ai"', main });
};

// ---------- home carousel slides ----------
const heroGuidesHtml = (posts) => `
        <h2 class="slide-title">Guides <span>how to do it, spoiler-free</span></h2>
        ${heroListHtml(guidesOf(posts), 6, (p) => `<em class="kicker">${esc(sectionTitle(sectionOf(p)))}</em>`, 'Guides are on the way.')}
        <p class="slide-more"><a href="/guides/">All GTA 6 guides →</a></p>`;

const heroFixesHtml = (posts) => `
        <h2 class="slide-title">Something broken? <span>known problems, and whether PlayStation is up</span></h2>
        <div class="fix-col">
          ${heroListHtml(fixesOf(posts), 5, (p) => statusChip(p.status, true) || '<em class="kicker">Fix</em>', 'No known problems right now.')}
          <p class="slide-more"><a href="/fixes/">All fixes →</a></p>
        </div>
        <div class="psn" data-psn><p class="psn-loading">Checking PlayStation services…</p></div>`;

const indiaPosts = (posts, n) => posts.filter((p) => p.tags.includes('india')).slice(0, n);

// The carousel's India slide. On the hub itself (onHub) it drops the title and the link back to the hub.
const heroIndiaHtml = (india, posts, onHub = false) => `
        ${onHub ? '' : `<h2 class="slide-title">🇮🇳 GTA 6 in India <span>${india?.updated ? `updated ${esc(istDate(india.updated))}` : 'price, stock, creators'}</span></h2>`}
        ${india?.data?.headline ? `<p class="ai-preview-headline">${esc(india.data.headline)}</p>` : ''}
        ${india?.data?.price ? `<p class="india-price">${esc(india.data.price)}</p>` : ''}
        ${heroListHtml(indiaPosts(posts, 3), 3)}
        <p class="slide-more">${onHub ? '<a href="/tag/india/">All India stories →</a>' : '<a href="/gta-6-india/">Open the GTA 6 India hub →</a>'} · <a href="/gta-6-price-in-india/">Price and where to buy →</a></p>`;

// ---------- home blocks below the hero ----------
const homeGuidesHtml = (posts) => {
  const list = guidesOf(posts).slice(0, 6);
  return `
    <div class="section-head"><h2 id="start-h">Start here</h2><p><a href="/guides/">All guides →</a></p></div>
    <div class="guides-teaser">${list.map((p) => `<a class="guide-card" href="/news/${p.slug}/"${itemAttrs(p)}><span class="guide-tag">${esc(sectionTitle(sectionOf(p)))}</span><b>${esc(p.title)}</b><span class="muted">${esc(p.description)}</span></a>`).join('')}</div>`;
};

const homeFixesHtml = (posts) => `
    <div class="section-head"><h2 id="broken-h">Something broken?</h2><p><a href="/fixes/">All fixes →</a></p></div>
    <p class="psn-line" data-psn-line>Checking PlayStation services…</p>
    <ul class="hub-list hub-list-compact">${fixesOf(posts).slice(0, 4).map(fromSameTypePost).map(hubRow).join('')}</ul>`;

const homeIndiaHtml = (india, posts) => `
    <div class="india-band-head">
      <h2 id="india-h"><span aria-hidden="true">🇮🇳</span> GTA 6 in India</h2>
      ${india?.data?.headline ? `<p class="india-headline">${esc(india.data.headline)}</p>` : ''}
      ${india?.data?.price ? `<p class="india-price">${esc(india.data.price)} · <a href="/gta-6-price-in-india/">where to buy →</a></p>` : ''}
      <a class="btn btn-hot" href="/gta-6-india/">Open the India hub →</a>
    </div>
    <ul class="hub-list hub-list-compact">${indiaPosts(posts, 4).map((p) => fromPost(p)).map(hubRow).join('')}</ul>`;

const homeNextHtml = (doc) => `
    <div class="section-head"><h2 id="next-h">What's next</h2><p><a href="/whats-next/">Full tracker and patch notes →</a></p></div>
    <ul class="track-list track-compact">${trackerItems(doc).slice(0, 4).map(trackerRowHtml).join('')}</ul>`;

// ---------- /gta-6-india/ blocks (content/india.md: each ## section becomes a card) ----------
const indiaBlocksHtml = (india) => {
  if (!india?.html) return '';
  const chunks = india.html.split(/(?=<h2[\s>])/).filter((c) => c.trim());
  const cards = chunks.filter((c) => c.startsWith('<h2'));
  return `<div class="india-cards">${cards.map((c) => `<article class="india-card">${c}</article>`).join('')}</div>`;
};

const indiaNewsHtml = (posts) => {
  const list = indiaPosts(posts, 6);
  return list.length ? `<div class="news-grid">${list.map(postCard).join('')}</div>` : '<p class="muted">India news is on the way.</p>';
};

// ---------- header search hints: the hottest topics, from the AI brief ----------
// A term is kept only if it finds a (non-spoiler) post with the same matching the browser search uses,
// so a suggestion never leads to "no results". Brief `search:` terms come first; if the agent left fewer
// than three, topics are taken from the posts the brief links to, in brief order (India first).
const findsPost = (term, posts) => {
  const words = term.toLowerCase().split(/\s+/).filter(Boolean);
  return words.length > 0 && posts.some((p) => !p.spoiler && words.every((w) => `${p.title} ${p.description} ${p.tags.join(' ')}`.toLowerCase().includes(w)));
};

const shortTopic = (p) => {
  const head = p.title.replace(/^GTA 6('s)?\s+/i, '').split(/\s[—–]\s|[:?]\s/)[0].trim();
  const words = head.split(/\s+/);
  return words.length > 4 ? words.slice(0, 3).join(' ') : head;
};

const trendingSearches = (brief, posts, n = 4) => {
  const out = [];
  const add = (term) => {
    const t = String(term || '').trim().slice(0, 32);
    if (t && out.length < n && !out.some((o) => o.toLowerCase() === t.toLowerCase()) && findsPost(t, posts)) out.push(t);
  };
  (brief?.search || []).forEach(add);
  if (out.length < 3 && brief?.html) {
    for (const m of brief.html.matchAll(/href="\/news\/([a-z0-9-]+)\/"/g)) {
      const p = posts.find((x) => x.slug === m[1] && !x.spoiler);
      if (p) add(shortTopic(p));
    }
  }
  if (!out.length) ['how to save', 'price', 'not starting'].forEach(add);
  return out;
};

// ---------- search index (/search-index.json) ----------
const STATIC_PAGES = [
  { u: '/gta-6-india/', t: 'GTA 6 India hub: price, where to buy, creators, Hinglish FAQ', d: 'Everything Indian players need: price in ₹, where to buy today, PS5 stock, creators and a Hinglish FAQ.', y: 'Page' },
  { u: '/gta-6-price-in-india/', t: 'GTA 6 price in India and where to buy', d: '₹5,999 Standard, ₹7,499 Ultimate on PlayStation Store India, plus the full bill with a PS5.', y: 'Page' },
  { u: '/ai/', t: "GTA 6 AI Brief: what's hot right now", d: 'The story that matters most this hour for Indian players, what to try today, and the latest news.', y: 'Page' },
  { u: '/guides/', t: 'All GTA 6 guides', d: 'Spoiler-free how-tos: saving, police, cheats, settings, streaming.', y: 'Page' },
  { u: '/fixes/', t: 'All GTA 6 fixes and PlayStation status', d: 'Known problems, their status and the fix that works, plus live PSN status.', y: 'Page' },
  { u: '/whats-next/', t: "What's next for GTA 6: Online, PC, patches, DLC", d: 'Tracker of what is confirmed, reported or rumoured, and every patch.', y: 'Page' },
  ...STATIC_GUIDES.map((g) => ({ u: g.url, t: g.title, d: g.description, y: 'Guide' })),
];

const searchIndexJson = (posts) => JSON.stringify([
  ...posts.map((p) => ({ u: `/news/${p.slug}/`, t: p.title, d: p.description, g: p.tags.join(' '), y: TYPE_LABELS[p.type], ...(p.spoiler ? { s: 1 } : {}), ts: p.updated })),
  ...STATIC_PAGES,
]);

export {
  renderGuidesHub, renderFixesHub, renderWhatsNext, renderAiPage, heroGuidesHtml, heroFixesHtml, heroIndiaHtml,
  homeGuidesHtml, homeFixesHtml, homeIndiaHtml, homeNextHtml, indiaBlocksHtml, indiaNewsHtml, searchIndexJson, trendingSearches,
};

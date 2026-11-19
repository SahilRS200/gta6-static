// Server-rendered pages: the 30 "GTA 6 release time in <country>" pages — kept after launch as short
// "it's out" archive pages so their links and rankings survive — their index, and the sitemap.
import { ZONES } from '../public/js/zones.js';
import { unlockUtc, fmtUnlockLocal, fmtUtc, fmtOffset, fmtHoursGap } from '../public/js/time.js';
import { sortedZones, scheduleRowsHtml } from '../public/js/schedule.js';
import { dayLabel } from '../public/js/day.js';
import { esc, headCommon, banner, header, footer } from './partials.js';

const STATIC_PATHS = ['/ai/', '/home/', '/news/', '/guides/', '/fixes/', '/whats-next/', '/gta-6-india/', '/gta-6-price-in-india/', '/guides/stream-gta-6-ps5-youtube-twitch/', '/guides/ps5-time-zone/', '/gta-6-release-time/', '/about/', '/privacy/', '/terms/'];
const HIGH_PRIORITY = new Set(['/ai/', '/home/', '/news/', '/guides/', '/fixes/', '/whats-next/', '/gta-6-india/', '/gta-6-price-in-india/']);
const HOURLY = new Set(['/ai/', '/home/', '/news/', '/guides/', '/fixes/', '/whats-next/', '/gta-6-india/']);
const SKYLINE = '<svg class="skyline" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="104" width="1200" height="16" fill="currentColor"/><path fill="currentColor" d="M0 120V92h40V70h22v22h18V58h30v34h16V80h24V48h12V36h10v12h12v44h20V66h34v26h14V54h26v38h22V74h18V40h8V28h6v12h8v52h26V84h30V62h22v30h16V50h38v42h12V72h28V58h14v34h22V44h10V32h12v12h10v48h26V76h20V60h30v32h18V68h24v24h16V52h28v40h22V80h18V46h14V36h8v10h12v46h24V70h32v22h16V56h22v36h20V74h26v18h18V62h30v30h14V82h40v38z"/></svg>';

const countryShort = (zone) => zone.country.replace(/ \(.*\)$/, '').replace(' — ', ' ');

const relGap = (a, b) => {
  if (a === b) return 'at the same moment as';
  return a < b ? `${fmtHoursGap(b - a)} before` : `${fmtHoursGap(a - b)} after`;
};

const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const faqJsonLd = (items) => jsonLd({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

const breadcrumbJsonLd = (items) => jsonLd({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `__SITE_URL__${path}` })),
});

const shell = ({ head, bodyAttrs, main }) => `<!doctype html>
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

const renderCityPage = (zone) => {
  const path = `/gta-6-release-time/${zone.slug}/`;
  const at = unlockUtc(zone, true);
  const order = sortedZones(true).findIndex((r) => r.zone.id === zone.id) + 1;
  const nz = unlockUtc(ZONES[0], true);
  const ny = unlockUtc(ZONES.find((z) => z.id === 'newyork'), true);
  const name = countryShort(zone);
  const local = fmtUnlockLocal(at, zone.tz);
  const cities = [zone.city, ...zone.also].join(', ');
  const isIndia = zone.id === 'india';
  const title = `GTA 6 Release Time in ${name} (${zone.city}): Unlocked ${local} — Out Now`;
  const description = `GTA 6 is out in ${name}. It unlocked in ${zone.city} at ${local} local time (${fmtUtc(at)}) on PS5 and Xbox Series X|S. Now: guides, fixes and the latest news.`;
  const faq = [
    [`Is GTA 6 out in ${name}?`, `Yes. GTA 6 unlocked in ${zone.city} at ${local} local time (${fmtUtc(at)}) on PS5 and Xbox Series X|S, at midnight local time as Rockstar said.`],
    [`Was ${name} early or late in the GTA 6 unlock?`, `${name} was #${order} of the 30 time zones we tracked. It unlocked ${relGap(at, nz)} New Zealand and ${relGap(at, ny)} New York.`],
    ['Did changing the PS5 time zone unlock GTA 6 early?', 'No. PlayStation Store unlocks followed your PSN account region, not the console clock.'],
  ];
  const faqHtml = faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
  const head = [
    headCommon({ title, description, path, ogType: 'article', keywords: `GTA 6 release time ${name}, GTA 6 ${zone.city}, GTA 6 out ${name}, GTA VI ${name}` }),
    breadcrumbJsonLd([['Home', '/home/'], ['GTA 6 release times', '/gta-6-release-time/'], [`GTA 6 release time in ${name}`, path]]),
    faqJsonLd(faq),
  ].join('\n');
  const main = `
<main id="main">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/home/">Home</a> <span aria-hidden="true">/</span> <a href="/gta-6-release-time/">Release times</a> <span aria-hidden="true">/</span> <span>${esc(name)}</span></nav>
  <section class="hero hero-city">
    ${SKYLINE}
    <p class="eyebrow">${zone.flag} ${esc(cities)}</p>
    <h1>GTA 6 is out in <span class="grad">${esc(name)}</span></h1>
    <p class="hero-when">It unlocked <time datetime="${new Date(at).toISOString()}">${esc(local)}</time> <span class="muted">· ${esc(fmtOffset(zone.tz, at))} · ${esc(fmtUtc(at))}</span></p>
    <p class="day-chip" data-day>${dayLabel()}</p>
    <div class="hero-actions">
      <a class="btn btn-hot" href="/guides/">GTA 6 guides</a>
      <a class="btn" href="/fixes/">Fixes</a>
      <a class="btn" href="/news/">Latest news</a>
      ${isIndia ? '<a class="btn" href="/gta-6-india/">🇮🇳 India hub</a>' : ''}
    </div>
  </section>
  <section class="facts" aria-label="Unlock facts">
    <div class="fact"><span class="fact-k">Unlocked (local)</span><span class="fact-v">${esc(local)}</span></div>
    <div class="fact"><span class="fact-k">In UTC</span><span class="fact-v">${esc(fmtUtc(at))}</span></div>
    <div class="fact"><span class="fact-k">Place in the unlock wave</span><span class="fact-v">#${order} of 30</span></div>
    <div class="fact"><span class="fact-k">vs New Zealand 🇳🇿</span><span class="fact-v">${esc(relGap(at, nz))}</span></div>
    <div class="fact"><span class="fact-k">vs New York 🇺🇸</span><span class="fact-v">${esc(relGap(at, ny))}</span></div>
    <div class="fact"><span class="fact-k">Platforms</span><span class="fact-v">PS5 · Xbox Series X|S</span></div>
  </section>
  <section class="faq" id="faq">
    <h2>GTA 6 in ${esc(name)} — quick answers</h2>
    ${faqHtml}
  </section>
  <section class="cta-row">
    <a class="btn btn-hot" href="/guides/">Just started? GTA 6 guides →</a>
    <a class="btn" href="/fixes/">Game not starting? Fixes →</a>
    <a class="btn" href="/gta-6-release-time/">All 30 release times →</a>
  </section>
</main>`;
  return shell({ head, bodyAttrs: `data-page="city" data-zone="${zone.id}"`, main });
};

const renderReleaseIndex = () => {
  const path = '/gta-6-release-time/';
  const title = 'GTA 6 Release Times by Country — When It Unlocked in All 30 Time Zones (Archive) | GTA6Info.in';
  const description = 'GTA 6 unlocked at midnight local time on 19 November 2026, starting in New Zealand. Here is when it went live in all 30 time zones we tracked, in local time and UTC.';
  const head = [
    headCommon({ title, description, path, keywords: 'GTA 6 release time, GTA 6 unlock time by country, GTA 6 release time India, GTA 6 release time USA' }),
    breadcrumbJsonLd([['Home', '/home/'], ['GTA 6 release times', path]]),
  ].join('\n');
  const main = `
<main id="main" class="guide">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/home/">Home</a> <span aria-hidden="true">/</span> <span>Release times</span></nav>
  <header class="guide-head">
    <p class="eyebrow">Archive · launch week</p>
    <h1>GTA 6 release times: <span class="grad">all 30 time zones</span></h1>
    <p class="lede">GTA 6 is out everywhere. It unlocked at midnight local time on Thursday, 19 November 2026, starting in New Zealand; India went live at 12:00 AM IST. The US PlayStation Store followed Eastern Time, so the western US played the night before.</p>
  </header>
  <div class="table-wrap">
    <table>
      <thead><tr><th scope="col">#</th><th scope="col">Where</th><th scope="col">Unlocked (local)</th><th scope="col">UTC</th></tr></thead>
      <tbody>${scheduleRowsHtml(true)}</tbody>
    </table>
  </div>
  <section class="cta-row">
    <a class="btn btn-hot" href="/guides/">GTA 6 guides →</a>
    <a class="btn" href="/news/">Latest GTA 6 news →</a>
    <a class="btn" href="/gta-6-india/">🇮🇳 GTA 6 India hub →</a>
  </section>
</main>`;
  return shell({ head, bodyAttrs: 'data-page="guide"', main });
};

const renderSitemap = (lastmod, posts = [], tags = []) => {
  const newest = posts.reduce((m, p) => (p.updated > m ? p.updated : m), '').slice(0, 10) || lastmod;
  const entry = (loc, mod, freq, prio) => `  <url><loc>__SITE_URL__${loc}</loc><lastmod>${mod}</lastmod><changefreq>${freq}</changefreq><priority>${prio}</priority></url>`;
  const rows = [
    ...STATIC_PATHS.map((u) => entry(u, HOURLY.has(u) ? newest : lastmod, HOURLY.has(u) ? 'hourly' : 'weekly', HIGH_PRIORITY.has(u) ? '1.0' : '0.6')),
    ...ZONES.map((z) => entry(`/gta-6-release-time/${z.slug}/`, lastmod, 'monthly', z.id === 'india' ? '0.5' : '0.3')),
    ...posts.map((p) => entry(`/news/${p.slug}/`, p.updated.slice(0, 10), 'daily', p.type === 'news' ? '0.8' : '0.9')),
    ...tags.map((t) => entry(`/tag/${t}/`, newest, 'daily', '0.5')),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
};

export { renderCityPage, renderReleaseIndex, renderSitemap };

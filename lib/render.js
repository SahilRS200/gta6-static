// Server-rendered pages: 30 "GTA 6 release time in <country>" pages and the sitemap.
import { ZONES } from '../public/js/zones.js';
import { unlockUtc, localMidnightUtc, fmtUnlockLocal, fmtUtc, fmtOffset, fmtHoursGap } from '../public/js/time.js';
import { sortedZones } from '../public/js/schedule.js';
import { esc, headCommon, banner, header, footer } from './partials.js';

const STATIC_PATHS = ['/', '/news/', '/gta-6-india/', '/gta-6-price-in-india/', '/guides/ps5-time-zone/', '/guides/stream-gta-6-ps5-youtube-twitch/', '/about/'];

const countryShort = (zone) => zone.country.replace(/ \(.*\)$/, '').replace(' — ', ' ');

const relGap = (a, b) => {
  if (a === b) return 'at the same moment as';
  return a < b ? `${fmtHoursGap(b - a)} before` : `${fmtHoursGap(a - b)} after`;
};

const faqJsonLd = (items) => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

const breadcrumbJsonLd = (zone, path) => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'GTA 6 Countdown', item: '__SITE_URL__/' },
    { '@type': 'ListItem', position: 2, name: `GTA 6 release time in ${countryShort(zone)}`, item: `__SITE_URL__${path}` },
  ],
});

const renderCityPage = (zone) => {
  const path = `/gta-6-release-time/${zone.slug}/`;
  const at = unlockUtc(zone, true);
  const localAt = localMidnightUtc(zone.tz);
  const order = sortedZones(true).findIndex((r) => r.zone.id === zone.id) + 1;
  const nz = unlockUtc(ZONES[0], true);
  const ny = unlockUtc(ZONES.find((z) => z.id === 'newyork'), true);
  const name = countryShort(zone);
  const local = fmtUnlockLocal(at, zone.tz);
  const cities = [zone.city, ...zone.also].join(', ');
  const title = `GTA 6 Release Time in ${name} (${zone.city}): Unlocks ${local} | Live Countdown`;
  const description = `GTA 6 unlocks in ${zone.city} at ${local} local time (${fmtUtc(at)}). Live countdown, preload date, and how far ${name} is from New Zealand and the US.`;
  const usNote = zone.us
    ? `<p class="callout callout-us">🇺🇸 <b>Night-before alert:</b> reports say the US PlayStation Store unlocks the whole country at midnight <b>Eastern</b>, so in ${esc(zone.city)} that's <b>${esc(local)}</b>. If your store follows local midnight instead, it's <b>${esc(fmtUnlockLocal(localAt, zone.tz))}</b>. Flip the "US store rule" switch on the <a href="/#zones">main countdown</a> to compare.</p>`
    : '';
  const faq = [
    [`What time does GTA 6 unlock in ${name}?`, `GTA 6 unlocks in ${zone.city} at ${local} local time, which is ${fmtUtc(at)}. Rockstar says the game releases at midnight local time on PS5 and Xbox Series X|S.`],
    [`Is ${name} early or late in the global GTA 6 unlock?`, `${name} is #${order} of the 30 time zones we track. It unlocks ${relGap(at, nz)} New Zealand and ${relGap(at, ny)} New York.`],
    [`Can I play GTA 6 early in ${name} by changing my PS5 time zone?`, 'No. PlayStation Store unlocks follow your PSN account region, not the console clock. Changing the PS5 time zone does not unlock the game early.'],
    ['When did the GTA 6 preload start?', 'Pre-orders have been open for a long time; the pre-load (the actual download) opened on November 10, 2026. The game stays locked until your region unlocks.'],
  ];
  const faqHtml = faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');

  return `<!doctype html>
<html lang="en-IN">
<head>
${headCommon({ title, description, path, ogType: 'article', keywords: `GTA 6 release time ${name}, GTA 6 ${zone.city} unlock time, GTA 6 countdown ${name}, GTA VI release ${name}` })}
<script type="application/ld+json">${breadcrumbJsonLd(zone, path)}</script>
<script type="application/ld+json">${faqJsonLd(faq)}</script>
</head>
<body data-page="city" data-zone="${zone.id}">
${banner()}
${header()}
<main id="main">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">GTA 6 Countdown</a> <span aria-hidden="true">/</span> <span>${esc(name)}</span></nav>
  <section class="hero hero-city">
    <svg class="skyline" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="104" width="1200" height="16" fill="currentColor"/><path fill="currentColor" d="M0 120V92h40V70h22v22h18V58h30v34h16V80h24V48h12V36h10v12h12v44h20V66h34v26h14V54h26v38h22V74h18V40h8V28h6v12h8v52h26V84h30V62h22v30h16V50h38v42h12V72h28V58h14v34h22V44h10V32h12v12h10v48h26V76h20V60h30v32h18V68h24v24h16V52h28v40h22V80h18V46h14V36h8v10h12v46h24V70h32v22h16V56h22v36h20V74h26v18h18V62h30v30h14V82h40v38z"/><path fill="currentColor" d="M96 92c-2-16-1-30 3-44m0 0c-9-6-22-6-30 0 9-1 18 1 26 6-10 0-18 4-23 10 8-4 17-6 27-4m0-12c6-8 17-11 26-8-9 0-17 3-22 9 9-2 18-1 25 4-9-1-18 0-26 4M1086 92c-2-18-1-34 4-50m0 0c-10-7-24-7-33 0 10-1 20 1 29 7-11 0-20 4-26 11 9-5 19-7 30-5m0-13c7-9 19-12 29-9-10 0-19 3-25 10 10-2 20-1 28 5-10-1-20 0-29 4" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/></svg>
    <p class="eyebrow">${zone.flag} ${esc(cities)}</p>
    <h1>GTA 6 release time in <span class="grad">${esc(name)}</span></h1>
    <p class="hero-when">Unlocks <time datetime="${new Date(at).toISOString()}">${esc(local)}</time> <span class="muted">· ${esc(fmtOffset(zone.tz, at))} · ${esc(fmtUtc(at))}</span></p>
    <div class="countdown countdown-xl" data-countdown="${zone.id}" aria-live="off"></div>
    <div class="hero-actions" data-actions="${zone.id}"></div>
  </section>
  ${usNote}
  <section class="facts" aria-label="Unlock facts">
    <div class="fact"><span class="fact-k">Local unlock</span><span class="fact-v">${esc(local)}</span></div>
    <div class="fact"><span class="fact-k">In UTC</span><span class="fact-v">${esc(fmtUtc(at))}</span></div>
    <div class="fact"><span class="fact-k">Place in the wave</span><span class="fact-v">#${order} of 30</span></div>
    <div class="fact"><span class="fact-k">vs New Zealand 🇳🇿</span><span class="fact-v">${esc(relGap(at, nz))}</span></div>
    <div class="fact"><span class="fact-k">vs New York 🇺🇸</span><span class="fact-v">${esc(relGap(at, ny))}</span></div>
    <div class="fact"><span class="fact-k">Platforms</span><span class="fact-v">PS5 · Xbox Series X|S</span></div>
  </section>
  <section class="faq" id="faq">
    <h2>GTA 6 in ${esc(name)} — quick answers</h2>
    ${faqHtml}
  </section>
  <section class="cta-row">
    <a class="btn btn-hot" href="/#zones">See all 30 live countdowns →</a>
    <a class="btn" href="/guides/stream-gta-6-ps5-youtube-twitch/">Stream GTA 6 on launch night →</a>
  </section>
</main>
${footer()}
</body>
</html>`;
};

const HIGH_PRIORITY = new Set(['/', '/news/', '/gta-6-india/', '/gta-6-price-in-india/', '/gta-6-release-time/india/']);

const renderSitemap = (lastmod, posts = [], tags = []) => {
  const newest = posts[0]?.updated.slice(0, 10) || lastmod;
  const entry = (loc, mod, freq, prio) => `  <url><loc>__SITE_URL__${loc}</loc><lastmod>${mod}</lastmod><changefreq>${freq}</changefreq><priority>${prio}</priority></url>`;
  const rows = [
    ...STATIC_PATHS.map((u) => entry(u, u === '/' || u === '/news/' ? newest : lastmod, u === '/' || u === '/news/' ? 'hourly' : 'daily', HIGH_PRIORITY.has(u) ? '1.0' : '0.8')),
    ...ZONES.map((z) => `/gta-6-release-time/${z.slug}/`).map((u) => entry(u, lastmod, 'daily', HIGH_PRIORITY.has(u) ? '1.0' : '0.7')),
    ...posts.map((p) => entry(`/news/${p.slug}/`, p.updated.slice(0, 10), 'hourly', '0.9')),
    ...tags.map((t) => entry(`/tag/${t}/`, newest, 'hourly', '0.6')),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
};

export { renderCityPage, renderSitemap };

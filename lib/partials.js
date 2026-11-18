// HTML partials shared by every page. `__SITE_URL__` is substituted by the server at boot.
import { ZONES } from '../public/js/zones.js';

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap';
const SITE_NAME = 'GTA6Info.in';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const headCommon = ({ title, description, path, ogType = 'website', keywords = '' }) => `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ''}
<link rel="canonical" href="__SITE_URL__${path}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="theme-color" content="#18161d">
<meta name="color-scheme" content="light">
<meta name="application-name" content="${SITE_NAME}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="__SITE_URL__${path}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="__SITE_URL__/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="GTA 6 unlock time in India and every time zone — live countdown and news">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="__SITE_URL__/og.png">
<link rel="alternate" type="application/rss+xml" title="${SITE_NAME} — GTA 6 News India" href="__SITE_URL__/news/feed.xml">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="GTA6Info">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONT_HREF}">
<link rel="preload" href="/fonts/TwemojiCountryFlags.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/site.css">
<script type="module" src="/js/app.js"></script>`;

const banner = () => `
<div class="banner" role="note" aria-label="Unlock time rule">
  <span class="banner-pulse" aria-hidden="true"></span>
  <p><strong>PS5 &amp; Xbox: GTA 6 unlocks at 12:00&nbsp;AM local time on Thu, Nov&nbsp;19, 2026 · 🇮🇳 India: unlocked at 12:00&nbsp;AM&nbsp;IST.</strong>
  <span class="banner-sub">Some folks suggest changing your time zone for early access. <a href="/guides/ps5-time-zone/">Here's how, and whether it works →</a></span></p>
</div>`;

const header = () => `
<header class="site-header">
  <a class="brand" href="/" aria-label="${SITE_NAME} home">
    <span class="brand-mark" aria-hidden="true">VI</span>
    <span class="brand-text">GTA6INFO<span>.IN</span></span>
  </a>
  <a class="psn-mini" data-psn-mini data-state="unknown" href="https://status.playstation.com/" target="_blank" rel="noopener" aria-label="PlayStation live status in India">
    <span class="psn-mini-label"><b>PS Live Status <span aria-hidden="true">🇮🇳</span></b><small data-psn-times>last --:-- · next --:--</small></span>
    <span class="psn-ico" role="img" data-psn-box="Account_Management" data-name="Account management" data-state="unknown" data-tip="Account management: checking…" aria-label="Account management: checking"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg></span>
    <span class="psn-ico" role="img" data-psn-box="Gaming_And_Social" data-name="Gaming and social" data-state="unknown" data-tip="Gaming and social: checking…" aria-label="Gaming and social: checking"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10a5 5 0 0 1 4.9 6l-.8 3.6a2.4 2.4 0 0 1-4.3.9L15 15H9l-1.8 2.5a2.4 2.4 0 0 1-4.3-.9L2.1 13A5 5 0 0 1 7 7z"/><path d="M8 10v3M6.5 11.5h3M15.5 11h.01M17.5 12.5h.01"/></svg></span>
    <span class="psn-ico" role="img" data-psn-box="PlayStation_Store" data-name="PlayStation Store" data-state="unknown" data-tip="PlayStation Store: checking…" aria-label="PlayStation Store: checking"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg></span>
  </a>
  <nav aria-label="Main">
    <a class="nav-home" href="/" aria-label="Home" title="Home"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></a>
    <button class="nav-ai" type="button" data-ai-open aria-controls="ai-pop" aria-label="AI Brief: what's hot today" title="AI Brief: what's hot today"><span aria-hidden="true">✦</span> AI</button>
    <a href="/news/">News</a>
    <a href="/gta-6-india/">GTA 6 India</a>
    <a href="/gta-6-price-in-india/">Price ₹</a>
    <a href="/#zones">Countdowns</a>
    <a href="/guides/ps5-time-zone/">PS5 Time Zone</a>
    <a href="/guides/stream-gta-6-ps5-youtube-twitch/">Stream It</a>
  </nav>
</header>`;

const QUICK_FAQ = [
  ['When does GTA 6 unlock in India?', 'It unlocked at 12:00 AM IST on Thu, 19 Nov 2026, on PS5 and Xbox Series X|S.', '/gta-6-release-time/india/', 'India countdown'],
  ['Can I play GTA 6 early in India?', 'New Zealand unlocked at 4:30 PM IST, 7.5 hours earlier. Changing your PS5 time zone does not work.', '/news/play-gta-6-early-india-new-zealand-trick/', 'The NZ trick, explained'],
  ['What is the GTA 6 price in India?', '₹5,999 Standard and ₹7,499 Ultimate on PlayStation Store India.', '/gta-6-price-in-india/', 'Full price breakdown'],
  ['Does changing the PS5 time zone help?', 'No. The unlock follows your PSN account region, not the console clock.', '/guides/ps5-time-zone/', 'PS5 time zone guide'],
  ['Is the pre-load live?', 'Yes, since 10 Nov. Download now so you can play right at midnight.', '/news/gta-6-preload-live-india/', 'Pre-load guide'],
  ['Do I need a PS5 update for GTA 6?', 'Yes. Sony says PS5 system software 26.07-14.23.00 (about 1.3 GB) is required. Install it before 12 AM IST.', '/news/gta-6-ps5-system-update-required/', 'How to update'],
  ['Does GTA 6 have online multiplayer at launch?', 'No. It launches single-player only; Rockstar has not announced a GTA 6 Online date.', '/news/gta-6-online-multiplayer-not-at-launch/', 'What we know'],
  ['Is a GTA 6 free download or APK real?', 'No. GTA 6 is only on PS5 and Xbox Series X|S. APKs and cracks are scams.', '/news/gta-6-free-download-apk-scam-warning/', 'How the scams work'],
  ['How do I stream GTA 6 from PS5?', 'Link YouTube or Twitch in Settings, then Create → Broadcast. Verify YouTube today.', '/guides/stream-gta-6-ps5-youtube-twitch/', 'Streaming guide'],
  ['Does the US get it the night before?', 'Reports say the US PS Store unlocks on Eastern Time, so the West Coast plays at 9 PM on Wed.', '/gta-6-release-time/usa-pacific-time/', 'US release times'],
];

const faqPopup = () => `
<button class="faq-fab" type="button" aria-expanded="false" aria-controls="faq-pop"><span aria-hidden="true">?</span> FAQ</button>
<div class="faq-pop" id="faq-pop" role="dialog" aria-modal="false" aria-labelledby="faq-pop-h" hidden>
  <div class="faq-pop-head">
    <h2 id="faq-pop-h">Quick answers</h2>
    <button class="faq-pop-close" type="button" aria-label="Close quick answers">✕</button>
  </div>
  ${QUICK_FAQ.map(([q, a, href, label]) => `<details><summary>${esc(q)}</summary><p>${esc(a)} <a href="${href}">${esc(label)} →</a></p></details>`).join('\n  ')}
  <p class="faq-pop-foot"><a href="/news/">All GTA 6 news →</a> · <a href="/gta-6-india/">GTA 6 India hub →</a></p>
</div>`;

const cityLinks = () => ZONES.map((z) => `<li><a href="/gta-6-release-time/${z.slug}/">GTA 6 release time ${esc(z.country.replace(/ \(.*\)$/, ''))}${z.country.includes('(') || z.country.includes('—') ? ` · ${esc(z.city)}` : ''}</a></li>`).join('');

const footer = () => `
<footer class="site-footer">
  <div class="footer-stats" data-visits hidden>
    <span><b data-visits-total>—</b> visits</span>
    <span><b data-visits-live>—</b> here right now</span>
  </div>
  <nav class="footer-cities" aria-label="GTA 6 India and news">
    <h2>GTA 6 India</h2>
    <ul>
      <li><a href="/news/">GTA 6 news India (updated every few hours)</a></li>
      <li><a href="/gta-6-india/">GTA 6 India: release time, price, FAQ</a></li>
      <li><a href="/gta-6-price-in-india/">GTA 6 price in India</a></li>
      <li><a href="/gta-6-release-time/india/">GTA 6 release time in India (IST)</a></li>
      <li><a href="/guides/ps5-time-zone/">Change PS5 time zone (myth-buster)</a></li>
      <li><a href="/guides/stream-gta-6-ps5-youtube-twitch/">Stream GTA 6 from PS5</a></li>
      <li><a href="/news/feed.xml">RSS feed</a></li>
      <li><a href="/about/">About ${SITE_NAME}</a></li>
    </ul>
  </nav>
  <nav class="footer-cities" aria-label="GTA 6 release time by country">
    <h2>GTA 6 release time by country</h2>
    <ul>${cityLinks()}</ul>
  </nav>
  <div class="footer-fine">
    <p><b>Unofficial fan site.</b> Not affiliated with, endorsed by, or sponsored by Rockstar Games, Take-Two Interactive, Sony Interactive Entertainment or Microsoft. Grand Theft Auto, GTA and GTA VI are trademarks of Take-Two Interactive. Unlock times and prices come from public reporting and can change — always check your own store.</p>
    <p>Sources: <a href="https://www.rockstargames.com/VI" rel="noopener" target="_blank">Rockstar Games — GTA VI</a> ·
      <a href="https://www.forbes.com/sites/erikkain/2026/11/16/gta-6-release-date-time-ps5-xbox-series-x-download-size-day-one-update/" rel="noopener" target="_blank">Forbes — release date &amp; time</a> ·
      <a href="https://www.forbes.com/sites/brianmazique/2026/11/12/gta-6-unlocks-at-midnight-on-november-19-but-millions-of-americans-can-start-playing-the-night-before/" rel="noopener" target="_blank">Forbes — US time zones</a> ·
      <a href="https://allthings.how/gta-6-release-date/" rel="noopener" target="_blank">AllThings.How — launch times by region</a> ·
      <a href="https://www.businesstoday.in/latest/trends/photo/gta-6-arrives-at-midnight-on-19-november-india-price-preload-and-editions-565630-2026-11-04" rel="noopener" target="_blank">Business Today — India price</a></p>
    <p class="muted">Flag emoji on Windows: <a href="https://github.com/jdecked/twemoji" rel="noopener" target="_blank">Twemoji</a> (CC-BY 4.0) via country-flag-emoji-polyfill (MIT). Pins and settings are stored only in your browser. The visit counter stores a single number — no cookies, no tracking.</p>
  </div>
</footer>
${faqPopup()}
<!--SSR:BRIEF-->
<div class="toast-stack" aria-live="polite" aria-atomic="false"></div>
<canvas class="confetti" aria-hidden="true"></canvas>`;

const applyPartials = (html) => html
  .replace('<!--SSR:BANNER-->', banner())
  .replace('<!--SSR:HEADER-->', header())
  .replace('<!--SSR:FOOTER-->', footer());

export { esc, headCommon, banner, header, footer, applyPartials, SITE_NAME };

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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONT_HREF}">
<link rel="preload" href="/fonts/TwemojiCountryFlags.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/site.css">
<script type="module" src="/js/app.js"></script>`;

const banner = () => `
<div class="banner" role="note" aria-label="Unlock time rule">
  <span class="banner-pulse" aria-hidden="true"></span>
  <p><strong>PS5 &amp; Xbox: GTA 6 unlocks at 12:00&nbsp;AM local time on Thu, Nov&nbsp;19, 2026 · 🇮🇳 India: 12:00&nbsp;AM&nbsp;IST.</strong>
  <span class="banner-sub">Some folks suggest changing your time zone for early access. <a href="/guides/ps5-time-zone/">Here's how, and whether it works →</a></span></p>
</div>`;

const header = () => `
<header class="site-header">
  <a class="brand" href="/" aria-label="${SITE_NAME} home">
    <span class="brand-mark" aria-hidden="true">VI</span>
    <span class="brand-text">GTA6INFO<span>.IN</span></span>
  </a>
  <nav aria-label="Main">
    <a href="/news/">News</a>
    <a href="/gta-6-india/">GTA 6 India</a>
    <a href="/gta-6-price-in-india/">Price ₹</a>
    <a href="/#zones">Countdowns</a>
    <a href="/guides/ps5-time-zone/">PS5 Time Zone</a>
    <a href="/guides/stream-gta-6-ps5-youtube-twitch/">Stream It</a>
  </nav>
</header>`;

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
<div class="toast-stack" aria-live="polite" aria-atomic="false"></div>
<canvas class="confetti" aria-hidden="true"></canvas>`;

const applyPartials = (html) => html
  .replace('<!--SSR:BANNER-->', banner())
  .replace('<!--SSR:HEADER-->', header())
  .replace('<!--SSR:FOOTER-->', footer());

export { esc, headCommon, banner, header, footer, applyPartials, SITE_NAME };

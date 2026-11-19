// HTML partials shared by every page. `__SITE_URL__` is substituted by the server at boot.
// The alert banner and the AI brief are tokens here; the server fills them from content/ at boot.
import { QUICK_FAQ } from './faq.js';

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
<meta property="og:image:alt" content="GTA6Info.in: GTA 6 news, guides and fixes for India, updated every hour">
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

// The thin banner on top of every page: one agent-written line from content/alert.md. Empty → no banner.
const banner = () => '<!--SSR:ALERT-->';

const alertHtml = (alert) => {
  const text = alert?.data?.text?.trim();
  if (!text) return '';
  const link = alert.data.link?.trim();
  const label = alert.data.label?.trim() || 'Read more';
  return `
<div class="banner" role="note" aria-label="Latest alert">
  <span class="banner-pulse" aria-hidden="true"></span>
  <p><strong>${esc(text)}</strong>${link && link.startsWith('/') ? ` <a href="${esc(link)}">${esc(label)} →</a>` : ''}</p>
</div>`;
};

const ICON_SEARCH = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 16 4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

const header = () => `
<header class="site-header">
  <a class="brand" href="/ai/" aria-label="${SITE_NAME}: front page, the AI Brief">
    <span class="brand-mark" aria-hidden="true">VI</span>
    <span class="brand-text">GTA6INFO<span>.IN</span></span>
  </a>
  <a class="x-follow" href="https://x.com/gamerinfo_in" target="_blank" rel="noopener me" aria-label="Follow GTA6Info.in on X (Twitter): @gamerinfo_in" title="Follow us on X (Twitter)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg><span class="x-follow-word">Follow</span> <b>@gamerinfo_in</b></a>
  <a class="psn-mini" data-psn-mini data-state="unknown" href="https://status.playstation.com/" target="_blank" rel="noopener" aria-label="PlayStation live status in India">
    <span class="psn-mini-label"><b>PS Live Status <span aria-hidden="true">🇮🇳</span></b><small data-psn-times>last --:-- · next --:--</small></span>
    <span class="psn-ico" role="img" data-psn-box="Account_Management" data-name="Account management" data-state="unknown" data-tip="Account management: checking…" aria-label="Account management: checking"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg></span>
    <span class="psn-ico" role="img" data-psn-box="Gaming_And_Social" data-name="Gaming and social" data-state="unknown" data-tip="Gaming and social: checking…" aria-label="Gaming and social: checking"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10a5 5 0 0 1 4.9 6l-.8 3.6a2.4 2.4 0 0 1-4.3.9L15 15H9l-1.8 2.5a2.4 2.4 0 0 1-4.3-.9L2.1 13A5 5 0 0 1 7 7z"/><path d="M8 10v3M6.5 11.5h3M15.5 11h.01M17.5 12.5h.01"/></svg></span>
    <span class="psn-ico" role="img" data-psn-box="PlayStation_Store" data-name="PlayStation Store" data-state="unknown" data-tip="PlayStation Store: checking…" aria-label="PlayStation Store: checking"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg></span>
  </a>
  <div class="site-search" role="search">
    <div class="site-search-field">
      <label class="sr-only" for="site-search-input">Search GTA 6 news, guides and fixes</label>
      <span class="site-search-icon">${ICON_SEARCH}</span>
      <input id="site-search-input" type="search" autocomplete="off" enterkeyhint="search" spellcheck="false" placeholder="__SEARCH_PLACEHOLDER__" data-search-input data-hints="__SEARCH_HINTS__" aria-controls="search-panel" aria-expanded="false">
      <kbd class="site-search-key" aria-hidden="true">/</kbd>
      <div class="search-panel" id="search-panel" hidden>
        <div class="search-trending" data-search-trending></div>
        <ul class="search-results" data-search-results aria-live="polite"></ul>
        <p class="search-note muted" data-search-note></p>
      </div>
    </div>
  </div>
  <nav aria-label="Main">
    <a class="nav-home" href="/home/" aria-label="Home: everything on one page" title="Home: everything on one page"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></a>
    <a class="nav-ai" href="/ai/" aria-label="AI Brief: what's hot today" title="AI Brief: what's hot today"><span aria-hidden="true">✦</span> AI</a>
    <a href="/news/">News</a>
    <a href="/guides/">Guides</a>
    <a href="/fixes/">Fixes</a>
    <a href="/whats-next/">What's next</a>
    <a class="nav-india" href="/gta-6-india/"><span aria-hidden="true">🇮🇳</span> GTA 6 India</a>
  </nav>
</header>`;

const faqPopup = () => `
<button class="faq-fab" type="button" aria-expanded="false" aria-controls="faq-pop"><span aria-hidden="true">?</span> FAQ</button>
<div class="faq-pop" id="faq-pop" role="dialog" aria-modal="false" aria-labelledby="faq-pop-h" hidden>
  <div class="faq-pop-head">
    <h2 id="faq-pop-h">Quick answers</h2>
    <button class="faq-pop-close" type="button" aria-label="Close quick answers">✕</button>
  </div>
  ${QUICK_FAQ.map(([q, a, href, label]) => `<details><summary>${esc(q)}</summary><p>${esc(a)} <a href="${href}">${esc(label)} →</a></p></details>`).join('\n  ')}
  <p class="faq-pop-foot"><a href="/guides/">All guides →</a> · <a href="/fixes/">All fixes →</a> · <a href="/gta-6-india/">GTA 6 India →</a></p>
</div>`;

// The spoiler switch: on by default, remembered in this browser only. Used in the footer, news bar and home.
const spoilerToggle = (label = 'Hide spoiler posts') => `<label class="switch spoiler-switch"><input type="checkbox" data-spoiler-toggle checked><span class="switch-ui" aria-hidden="true"></span><span>${esc(label)}</span></label>`;

const footer = () => `
<footer class="site-footer">
  <div class="footer-stats" data-visits hidden>
    <span><b data-visits-total>—</b> visits</span>
    <span><b data-visits-live>—</b> here right now</span>
  </div>
  <nav class="footer-cities" aria-label="GTA6Info.in sections">
    <h2>GTA6Info.in</h2>
    <ul>
      <li><a href="/ai/">GTA 6 AI Brief: what's hot right now</a></li>
      <li><a href="/home/">Home: news, guides, fixes and India in one place</a></li>
      <li><a href="/news/">GTA 6 news India (updated every hour)</a></li>
      <li><a href="/guides/">GTA 6 guides and tips</a></li>
      <li><a href="/fixes/">GTA 6 fixes: errors, bugs, PSN status</a></li>
      <li><a href="/whats-next/">What's next: GTA 6 Online, PC, patches</a></li>
      <li><a href="/gta-6-india/">GTA 6 India hub</a></li>
      <li><a href="/gta-6-price-in-india/">GTA 6 price in India and where to buy</a></li>
      <li><a href="/guides/stream-gta-6-ps5-youtube-twitch/">Stream GTA 6 from PS5</a></li>
      <li><a href="/gta-6-release-time/">GTA 6 release times by country (archive)</a></li>
      <li><a href="/news/feed.xml">RSS feed</a></li>
      <li><a href="/about/">About ${SITE_NAME}</a></li>
      <li><a href="/privacy/">Privacy policy</a></li>
      <li><a href="/terms/">Terms of service</a></li>
    </ul>
  </nav>
  <div class="footer-fine">
    <p class="footer-prefs">${spoilerToggle()} <span class="muted">Spoiler posts stay out of lists, the ticker and search until you switch this off.</span></p>
    <p><b>Unofficial fan site.</b> Not affiliated with, endorsed by, or sponsored by Rockstar Games, Take-Two Interactive, Sony Interactive Entertainment or Microsoft. Grand Theft Auto, GTA and GTA VI are trademarks of Take-Two Interactive. Prices and facts come from public reporting and can change — every story links its sources, and you should check your own store.</p>
    <p>Useful official pages: <a href="https://www.rockstargames.com/VI" rel="noopener" target="_blank">Rockstar Games — GTA VI</a> ·
      <a href="https://www.playstation.com/en-in/support/games/gta-vi-support/" rel="noopener" target="_blank">PlayStation India — GTA VI support</a> ·
      <a href="https://status.playstation.com/" rel="noopener" target="_blank">PlayStation Network status</a></p>
    <p class="muted">Flag emoji on Windows: <a href="https://github.com/jdecked/twemoji" rel="noopener" target="_blank">Twemoji</a> (CC-BY 4.0) via country-flag-emoji-polyfill (MIT). Settings are stored only in your browser. The visit counter stores a single number — no cookies, no tracking.</p>
  </div>
</footer>
${faqPopup()}
<!--SSR:BRIEF-->
<div class="toast-stack" aria-live="polite" aria-atomic="false"></div>`;

const applyPartials = (html) => html
  .replace('<!--SSR:BANNER-->', banner())
  .replace('<!--SSR:HEADER-->', header())
  .replace('<!--SSR:FOOTER-->', footer());

export { esc, headCommon, banner, alertHtml, header, footer, spoilerToggle, applyPartials, SITE_NAME };

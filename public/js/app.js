import { splitDuration, pad2 } from './time.js';
import { dayLabel } from './day.js';

const KEYS = { sid: 'u6.sid', showSpoilers: 'u6.showSpoilers', lastVisit: 'u6.lastVisit', prevVisit: 'u6.prevVisit' };
const MUTE_WORDS = ['GTA 6 ending', 'GTA 6 spoilers', 'GTA VI ending', 'GTA 6 final mission', 'GTA 6 twist'];
const SEGMENTS = [['d', 'days'], ['h', 'hrs'], ['m', 'mins'], ['s', 'secs']];

// ---------- storage (never throws) ----------
const store = {
  get: (k, fallback) => {
    try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ---------- toasts ----------
const toast = (msg) => {
  const stack = $('.toast-stack');
  if (!stack) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  stack.append(t);
  setTimeout(() => t.remove(), 4200);
};

// ---------- same-origin API calls (the server rejects requests without this header) ----------
const api = (path, opts = {}) => fetch(path, {
  ...opts,
  credentials: 'same-origin',
  headers: { 'X-GTA6-Client': '1', ...(opts.headers || {}) },
});

// ---------- "Day N since launch" chips (server renders the first value; this keeps it current) ----------
const renderDay = () => { for (const el of $$('[data-day]')) el.textContent = dayLabel(); };

// ---------- countdowns: only for confirmed dates on the What's next tracker ----------
const mountCountdown = (el) => {
  el.innerHTML = SEGMENTS.map(([k, lbl], i) => `${i ? '<span class="cd-colon" aria-hidden="true">:</span>' : ''}<span class="cd-seg"><span class="cd-num" data-k="${k}">00</span><span class="cd-lbl">${lbl}</span></span>`).join('');
};

const tickCountdowns = () => {
  for (const el of $$('[data-countdown-to]')) {
    const left = Date.parse(el.dataset.countdownTo) - Date.now();
    if (left <= 0) {
      if (!el.classList.contains('is-live')) { el.classList.add('is-live'); el.innerHTML = '<div class="unlocked-shout">Out now</div>'; }
      continue;
    }
    const parts = splitDuration(left);
    for (const [k] of SEGMENTS) {
      const node = $(`[data-k="${k}"]`, el);
      const next = pad2(parts[k]);
      if (node && node.textContent !== next) node.textContent = next;
    }
  }
};

const startCountdowns = () => {
  const els = $$('[data-countdown-to]');
  if (!els.length) return;
  els.forEach(mountCountdown);
  const loop = () => { tickCountdowns(); setTimeout(loop, 1000 - (Date.now() % 1000) + 8); };
  loop();
};

// ---------- spoiler switch: spoiler posts stay out of lists until the visitor turns this off ----------
const applySpoilers = (show) => {
  document.documentElement.classList.toggle('show-spoilers', show);
  for (const box of $$('[data-spoiler-toggle]')) box.checked = !show;
};

const wireSpoilers = () => {
  applySpoilers(store.get(KEYS.showSpoilers, false) === true);
  document.addEventListener('change', (e) => {
    const box = e.target.closest('[data-spoiler-toggle]');
    if (!box) return;
    const show = !box.checked;
    store.set(KEYS.showSpoilers, show);
    applySpoilers(show);
    toast(show ? 'Spoiler posts are now shown' : 'Spoiler posts are hidden');
    dispatchEvent(new Event('hero:content'));
  });
};

const wireMute = () => {
  for (const btn of $$('[data-copy-mute]')) {
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(MUTE_WORDS.join('\n')); toast('Mute list copied'); } catch { toast('Copy failed. Select the words instead.'); }
    });
  }
};

// ---------- "new since your last visit" dots ----------
// The first page of a browser session remembers when the previous visit was; every page in the session
// compares against that, so the dots don't vanish on the next click.
let lastVisitAt = 0;

const markNew = () => {
  if (!lastVisitAt) return;
  for (const el of $$('[data-ts]')) el.classList.toggle('is-new', Date.parse(el.dataset.ts) > lastVisitAt);
};

const startNewDots = () => {
  let prev = null;
  try { prev = sessionStorage.getItem(KEYS.prevVisit); } catch { /* blocked */ }
  if (prev === null) {
    prev = String(store.get(KEYS.lastVisit, 0) || 0);
    try { sessionStorage.setItem(KEYS.prevVisit, prev); } catch { /* blocked */ }
  }
  store.set(KEYS.lastVisit, Date.now());
  lastVisitAt = Number(prev) || 0;
  markNew();
};

// ---------- /news/ type chips: All · News · Guides · Fixes ----------
const wireTypeChips = () => {
  const wrap = $('[data-type-chips]');
  if (!wrap) return;
  wrap.addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    const type = b.dataset.type;
    for (const c of $$('[data-type]', wrap)) c.setAttribute('aria-pressed', String(c === b));
    for (const card of $$('.news-list .news-card')) card.hidden = type !== 'all' && card.dataset.type !== type;
  });
};

const markCurrentNav = () => {
  for (const a of $$('.site-header nav a')) {
    if (a.pathname !== '/' && a.pathname === location.pathname) a.setAttribute('aria-current', 'page');
  }
};

// ---------- PSN status: shared fetch (server proxies + caches Sony's feed), slide, line + header boxes ----------
const PSN_LINK = '<a href="https://status.playstation.com/" rel="noopener" target="_blank">status.playstation.com</a>';
const PSN_REFRESH_MS = 300_000;
let psnData = null;
let psnAt = 0;

const fetchPsn = async () => {
  if (psnData && Date.now() - psnAt < PSN_REFRESH_MS - 10_000) return psnData;
  psnAt = Date.now();
  try {
    const res = await api('/api/psn-status');
    psnData = res.ok ? await res.json() : { ok: false };
  } catch {
    psnData = { ok: false };
  }
  return psnData;
};

const psnIssues = (d) => (d.ok ? [...d.countryIncidents, ...d.services.flatMap((x) => x.incidents)] : []);
const istTime = (iso) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

const renderPsnMini = (d) => {
  for (const box of $$('[data-psn-box]')) {
    const svc = d.ok ? d.services.find((x) => x.id === box.dataset.psnBox) : null;
    const issue = svc?.incidents[0];
    box.dataset.state = !svc ? 'unknown' : issue ? 'issue' : 'ok';
    box.dataset.tip = svc ? `${svc.name}: ${issue ? issue.type : 'Up'}` : `${box.dataset.name}: status unavailable`;
    box.setAttribute('aria-label', box.dataset.tip);
  }
  for (const wrap of $$('[data-psn-mini]')) {
    const issues = psnIssues(d).length > 0;
    wrap.dataset.state = !d.ok ? 'unknown' : issues ? 'issue' : 'ok';
    wrap.setAttribute('aria-label', !d.ok ? 'PlayStation live status unavailable' : issues ? 'PlayStation is reporting problems in India' : 'All PlayStation services are up in India');
  }
  const hhmm = (ms) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ms));
  for (const el of $$('[data-psn-times]')) {
    el.textContent = `last ${d.checkedAt ? hhmm(Date.parse(d.checkedAt)) : '--:--'} · next ${hhmm(psnAt + PSN_REFRESH_MS)}`;
  }
};

const renderPsnBoxes = (d) => {
  for (const box of $$('[data-psn]')) {
    if (!d.ok) { box.innerHTML = `<p class="psn-overall psn-unknown">Couldn't reach the PlayStation status page. Check ${PSN_LINK} directly.</p>`; continue; }
    const issues = psnIssues(d);
    box.innerHTML = `
      <p class="psn-overall ${issues.length ? 'psn-issue' : 'psn-ok'}">${issues.length ? '⚠️ PlayStation is reporting problems in India' : '✅ All PlayStation services are up in India'}</p>
      <ul class="psn-services">${d.services.map((x) => `<li class="${x.incidents.length ? 'is-issue' : 'is-ok'}"><span>${escHtml(x.name)}</span><b>${x.incidents.length ? escHtml(x.incidents[0].type) : 'Up'}</b></li>`).join('')}</ul>
      ${issues[0]?.message ? `<p class="psn-msg">${escHtml(issues[0].message)}</p>` : ''}
      <p class="psn-src">Checked ${escHtml(istTime(d.checkedAt))} IST${d.stale ? ' (cached)' : ''} · source: ${PSN_LINK}</p>`;
  }
};

const renderPsnLine = (d) => {
  for (const el of $$('[data-psn-line]')) {
    const issues = psnIssues(d).length > 0;
    el.dataset.state = !d.ok ? 'unknown' : issues ? 'issue' : 'ok';
    el.innerHTML = !d.ok
      ? `Couldn't reach the PlayStation status page. Check ${PSN_LINK}.`
      : issues
        ? '⚠️ PlayStation is reporting problems in India. <a href="/fixes/">Live status and what to do →</a>'
        : `✅ All PlayStation services are up in India · checked ${escHtml(istTime(d.checkedAt))} IST`;
  }
};

const loadPsn = async () => {
  const d = await fetchPsn();
  renderPsnMini(d);
  renderPsnBoxes(d);
  renderPsnLine(d);
};

const startPsn = () => {
  if (!$('[data-psn-mini], [data-psn], [data-psn-line]')) return;
  loadPsn();
  setInterval(() => { if (!document.hidden) loadPsn(); }, PSN_REFRESH_MS);
};

// ---------- hero carousel: 5 s circular auto-advance, pausable; tabs, arrows, swipe, keys ----------
const AUTO_MS = 5000;
const TICK_MS = 100;

const wireCarousel = () => {
  const root = $('.hero-carousel');
  if (!root) return;
  const track = $('[data-carousel]', root);
  const slides = $$('.car-slide', track);
  const tabs = $$('[role="tab"]', root);
  const prev = $('.car-prev', root);
  const next = $('.car-next', root);
  const toggle = $('.car-pause', root);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const last = slides.length - 1;
  let index = 0;
  let animating = 0;
  let elapsed = 0;
  let stopped = reduce; // the visitor pressed pause, or prefers reduced motion
  let focused = false; // keyboard focus only — a mouse click must not freeze the slideshow
  let nudgeTick = 0;

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);

  const setProgress = () => {
    tabs.forEach((t, k) => t.style.setProperty('--p', k === index ? String(Math.min(1, elapsed / AUTO_MS)) : '0'));
  };

  // The hero is locked to the tallest slide (+ breathing room) so it never jumps between slides.
  // Measured with the lock released (all in one frame, nothing paints in between); only re-measured
  // when the viewport, fonts or content change, and only applied when the result actually differs.
  const HERO_SLACK = 28;
  let lockedHeight = 0;
  const fitHeight = () => {
    track.style.height = '';
    const tallest = Math.max(...slides.map((sl) => sl.offsetHeight));
    const target = tallest + HERO_SLACK;
    if (Math.abs(target - lockedHeight) > 1) lockedHeight = target;
    track.style.height = `${lockedHeight}px`;
  };
  const setActive = (i2) => {
    index = i2;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i2)); t.tabIndex = k === i2 ? 0 : -1; });
    slides.forEach((sl, k) => { sl.inert = k !== i2; sl.setAttribute('aria-hidden', String(k !== i2)); });
    if (slides[i2].id === 'slide-fixes') loadPsn();
    setProgress();
  };

  const glideTo = (left, done) => {
    cancelAnimationFrame(animating);
    const from = track.scrollLeft;
    if (reduce || Math.abs(left - from) < 2) { track.scrollLeft = left; animating = 0; done?.(); return; }
    track.classList.add('is-gliding');
    const t0 = performance.now();
    const dur = 850;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      track.scrollLeft = from + (left - from) * ease(p);
      if (p < 1) { animating = requestAnimationFrame(step); return; }
      animating = 0;
      track.classList.remove('is-gliding');
      done?.();
    };
    animating = requestAnimationFrame(step);
  };

  // Last → first: glide forward into a throwaway copy of slide 1, then snap back to the real one.
  const wrapToFirst = () => {
    const clone = slides[0].cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    clone.inert = true;
    clone.setAttribute('aria-hidden', 'true');
    track.append(clone);
    setActive(0);
    glideTo(clone.offsetLeft, () => { track.scrollLeft = 0; clone.remove(); });
  };

  const go = (i2) => {
    const n = (i2 + slides.length) % slides.length;
    elapsed = 0;
    if (index === last && n === 0 && i2 > last) { wrapToFirst(); return; }
    setActive(n);
    glideTo(slides[n].offsetLeft);
  };

  const setStopped = (value) => {
    stopped = value;
    root.classList.toggle('is-stopped', stopped);
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(stopped));
      toggle.setAttribute('aria-label', stopped ? 'Play slideshow' : 'Pause slideshow');
      toggle.innerHTML = stopped ? '<span aria-hidden="true">▶</span>' : '<span aria-hidden="true">❚❚</span>';
    }
    elapsed = 0;
    setProgress();
  };

  tabs.forEach((t) => t.addEventListener('click', () => go(Number(t.dataset.go))));
  prev.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));
  toggle?.addEventListener('click', () => setStopped(!stopped));
  root.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
  });
  root.addEventListener('focusin', (e) => { focused = e.target.matches(':focus-visible'); });
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) focused = false; });
  root.addEventListener('pointerdown', () => { focused = false; });

  // Swipe / trackpad: follow the native scroll once it settles, and restart the clock.
  let settle = 0;
  track.addEventListener('scroll', () => {
    if (animating) return;
    clearTimeout(settle);
    settle = setTimeout(() => {
      const i2 = Math.max(0, Math.min(last, Math.round(track.scrollLeft / track.clientWidth)));
      if (i2 !== index) { elapsed = 0; setActive(i2); }
    }, 120);
  }, { passive: true });
  let lastWidth = 0;
  addEventListener('hero:content', () => fitHeight());
  addEventListener('resize', () => {
    track.scrollLeft = slides[index].offsetLeft;
    if (Math.abs(innerWidth - lastWidth) > 1) { lastWidth = innerWidth; fitHeight(); }
  });
  document.fonts?.ready.then(fitHeight);
  lastWidth = innerWidth;
  requestAnimationFrame(fitHeight);

  // The clock: advances every 5 s unless paused; the active tab fills up as it runs.
  setInterval(() => {
    const paused = stopped || focused || document.hidden || animating;
    root.classList.toggle('is-paused', !!paused);
    if (paused) return;
    elapsed += TICK_MS;
    if (elapsed >= AUTO_MS) { go(index + 1); return; }
    setProgress();
  }, TICK_MS);

  // When the slideshow is stopped, the next arrow and tab still give an occasional nudge.
  setInterval(() => {
    nudgeTick += 1;
    if (!stopped || reduce || document.hidden || animating || nudgeTick % 2 !== 0) return;
    const arrow = index < last ? next : prev;
    const tab = tabs[index < last ? index + 1 : index - 1];
    for (const el of [arrow, tab]) {
      el.classList.remove('nudge');
      void el.offsetWidth;
      el.classList.add('nudge');
      setTimeout(() => el.classList.remove('nudge'), 1600);
    }
  }, 7000);

  setStopped(stopped);
  setActive(0);

  // ?slide=guides opens that slide; with ?fs=1 the slideshow also starts paused.
  const params = new URLSearchParams(location.search);
  const wanted = params.get('slide') || '';
  const target = wanted ? slides.findIndex((sl) => sl.id === `slide-${wanted}`) : -1;
  if (params.get('fs') === '1' && wanted) setStopped(true);
  if (target > 0) {
    setActive(target);
    requestAnimationFrame(() => { track.scrollLeft = slides[target].offsetLeft; });
  }
};

// ---------- "Around the web" headlines merged into the news ticker (refreshed hourly) ----------
const HEADLINES_MS = 60 * 60 * 1000;

const tickerItem = (h, hidden) => {
  const when = h.date ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(h.date)) : '';
  return `<li class="is-ext"><a href="${escHtml(h.url)}" rel="noopener nofollow" target="_blank"${hidden ? ' tabindex="-1"' : ''}><time>${escHtml(when)}</time><span>${escHtml(h.title)} <em class="src">${escHtml(h.source)} ↗</em></span></a></li>`;
};

const loadHeadlines = async () => {
  const lists = $$('.ticker-list');
  if (!lists.length) return;
  try {
    const res = await api('/api/headlines');
    if (!res.ok) return;
    const { items } = await res.json();
    if (!items?.length) return;
    lists.forEach((ul, k) => {
      ul.querySelectorAll('.is-ext').forEach((li) => li.remove());
      ul.insertAdjacentHTML('beforeend', items.map((h) => tickerItem(h, k > 0)).join(''));
    });
    const viewport = $('.ticker-viewport');
    if (viewport) viewport.style.setProperty('--dur', `${Math.max(30, lists[0].children.length * 5)}s`);
  } catch { /* the ticker still shows our own posts */ }
};

const startHeadlines = () => {
  if (!$('.ticker-list')) return;
  loadHeadlines();
  setInterval(() => { if (!document.hidden) loadHeadlines(); }, HEADLINES_MS);
};

// ---------- PWA ----------
const registerServiceWorker = () => {
  const secure = location.protocol === 'https:' || location.hostname === 'localhost';
  if (!('serviceWorker' in navigator) || !secure) return;
  addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => { /* offline support is optional */ }); });
};

// ---------- visit counter ----------
const newSid = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 24);

const showVisits = ({ total, live }) => {
  const nf = new Intl.NumberFormat('en-US');
  for (const el of $$('[data-visits-total]')) el.textContent = nf.format(total);
  for (const el of $$('[data-visits-live]')) el.textContent = nf.format(live);
  for (const el of $$('[data-visits]')) el.hidden = false;
};

const startVisits = async () => {
  let sid = null;
  let first = false;
  try { sid = sessionStorage.getItem(KEYS.sid); } catch { /* blocked */ }
  if (!sid) {
    sid = newSid();
    first = true;
    try { sessionStorage.setItem(KEYS.sid, sid); } catch { /* blocked */ }
  }
  const hit = async (isFirst) => {
    try {
      const res = await api('/api/hit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid, first: isFirst }), keepalive: true });
      if (res.ok) showVisits(await res.json());
    } catch { /* offline — counter just stays hidden */ }
  };
  await hit(first);
  setInterval(() => { if (document.visibilityState === 'visible') hit(false); }, 30_000);
};

// ---------- floating panels: quick answers, AI brief, search — only one open at a time ----------
const panels = new Map(); // id → close()
const closeOthers = (id) => { for (const [other, close] of panels) if (other !== id) close(); };

// Floating quick-answers panel: toggle, Esc, click outside, focus back to the button.
const wireFaqPopup = () => {
  const fab = $('.faq-fab');
  const pop = $('#faq-pop');
  if (!fab || !pop) return;
  const set = (open) => {
    if (open) closeOthers('faq');
    pop.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    if (open) $('.faq-pop-close', pop)?.focus();
  };
  panels.set('faq', () => { if (!pop.hidden) set(false); });
  fab.addEventListener('click', () => set(pop.hidden));
  $('.faq-pop-close', pop)?.addEventListener('click', () => { set(false); fab.focus(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { set(false); fab.focus(); } });
  document.addEventListener('click', (e) => { if (!pop.hidden && !pop.contains(e.target) && !fab.contains(e.target)) set(false); });
};

// Floating AI brief: opened by the floating button, the header chip or the carousel button.
const wireAiBrief = () => {
  const pop = $('#ai-pop');
  if (!pop) return;
  let lastOpener = null;
  // Don't hand focus back into the carousel: keyboard focus there pauses autoplay.
  const restoreFocus = () => (lastOpener?.closest('.hero-carousel') ? $('.ai-fab') : lastOpener)?.focus();
  const set = (open) => {
    if (open) closeOthers('ai');
    pop.hidden = !open;
    $$('[data-ai-open]').forEach((b) => b.setAttribute('aria-expanded', String(open)));
    if (open) $('[data-ai-close]', pop)?.focus();
  };
  panels.set('ai', () => { if (!pop.hidden) set(false); });
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-ai-open]');
    if (opener) { lastOpener = opener; set(pop.hidden); return; }
    if (e.target.closest('[data-ai-close]')) { set(false); restoreFocus(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { set(false); restoreFocus(); } });
  document.addEventListener('click', (e) => { if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('[data-ai-open]')) set(false); });
};

// Search: a small JSON index (titles, descriptions, tags) fetched on first use, filtered in the browser.
const wireSearch = () => {
  const pop = $('#search-pop');
  const opener = $('[data-search-open]');
  if (!pop || !opener) return;
  const input = $('[data-search-input]', pop);
  const list = $('[data-search-results]', pop);
  const note = $('[data-search-note]', pop);
  const hint = note.textContent;
  let index = null;
  let loading = null;
  const load = () => {
    if (!loading) {
      loading = fetch('/search-index.json', { credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => { index = d; return d; })
        .catch(() => { loading = null; return []; });
    }
    return loading;
  };
  const run = async () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { list.innerHTML = ''; note.textContent = hint; return; }
    const data = index || await load();
    const terms = q.split(/\s+/).filter(Boolean);
    const showSpoilers = document.documentElement.classList.contains('show-spoilers');
    const hits = data
      .filter((it) => showSpoilers || !it.s)
      .map((it) => {
        const title = it.t.toLowerCase();
        const hay = `${title} ${(it.d || '').toLowerCase()} ${it.g || ''}`;
        if (!terms.every((t) => hay.includes(t))) return null;
        return { it, score: terms.reduce((n, t) => n + (title.includes(t) ? 3 : 1), 0) + (it.y === 'Guide' || it.y === 'Fix' ? 1 : 0) };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || String(b.it.ts || '').localeCompare(String(a.it.ts || '')))
      .slice(0, 12);
    list.innerHTML = hits.map(({ it }) => `<li><a href="${escHtml(it.u)}"><span class="badge badge-${escHtml(it.y.toLowerCase())}">${escHtml(it.y)}</span> <b>${escHtml(it.t)}</b><small>${escHtml(it.d || '')}</small></a></li>`).join('');
    note.textContent = hits.length ? `${hits.length} result${hits.length > 1 ? 's' : ''}` : 'No matches. Try fewer or different words.';
  };
  const set = (open) => {
    if (open) closeOthers('search');
    pop.hidden = !open;
    opener.setAttribute('aria-expanded', String(open));
    if (open) { load(); input.focus(); input.select(); }
  };
  panels.set('search', () => { if (!pop.hidden) set(false); });
  let timer = 0;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 120); });
  opener.addEventListener('click', () => set(pop.hidden));
  $('[data-search-close]', pop).addEventListener('click', () => { set(false); opener.focus(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !pop.hidden) { set(false); opener.focus(); }
    if (e.key === '/' && pop.hidden && !e.target.closest('input, textarea, select, [contenteditable]')) { e.preventDefault(); set(true); }
  });
  document.addEventListener('click', (e) => { if (!pop.hidden && !pop.contains(e.target) && !opener.contains(e.target)) set(false); });
};

// ---------- full-screen live board (home carousel only) ----------
// Native Fullscreen API where the browser allows it on an element, otherwise (iPhone Safari) a fixed
// full-viewport overlay that looks the same.
const FS_ENTER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const FS_EXIT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
const FS_LINK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';
const fsShareUrl = () => `${location.origin}${location.pathname}?fs=1`;

const shareFsLink = async (btn) => {
  const url = fsShareUrl();
  const label = $('span', btn);
  const flash = (text) => { label.textContent = text; setTimeout(() => { label.textContent = 'Share full-screen link'; }, 2200); };
  try {
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ title: document.title, text: 'GTA 6 India live board, full screen:', url });
      return;
    }
    await navigator.clipboard.writeText(url);
    flash('Link copied ✓');
  } catch {
    flash(url.replace(/^https?:\/\//, ''));
  }
};

const wireFullscreen = () => {
  const hero = $('.hero-carousel');
  if (!hero) return;
  const native = !!(document.fullscreenEnabled && Element.prototype.requestFullscreen);
  let pseudo = false;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'hero-fs-btn';
  const share = document.createElement('button');
  share.type = 'button';
  share.className = 'hero-fs-share';
  share.hidden = true;
  share.innerHTML = `${FS_LINK_ICON}<span>Share full-screen link</span>`;
  share.setAttribute('aria-label', 'Share a link that opens this live board in full screen');
  hero.append(btn, share);

  const isOn = () => document.fullscreenElement === hero || pseudo;
  const sync = () => {
    const on = isOn();
    hero.classList.toggle('is-fs', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
    btn.title = on ? 'Exit full screen (Esc)' : 'Full screen';
    btn.innerHTML = on ? FS_EXIT : FS_ENTER;
    share.hidden = !on;
    share.title = fsShareUrl();
    document.documentElement.classList.toggle('has-pseudo-fs', pseudo);
    dispatchEvent(new Event('resize'));
  };
  const exit = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (pseudo) { pseudo = false; sync(); }
  };
  const enter = async () => {
    if (native) {
      try { await hero.requestFullscreen({ navigationUI: 'hide' }); return; } catch { /* fall back below */ }
    }
    pseudo = true;
    sync();
  };

  btn.addEventListener('click', () => (isOn() ? exit() : enter()));
  share.addEventListener('click', () => shareFsLink(share));
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pseudo) exit(); });
  sync();

  // Deep link: ?fs=1 opens the board full screen. Browsers only grant real fullscreen after a user
  // gesture, so start with the overlay and upgrade on the first tap where it's supported.
  if (new URLSearchParams(location.search).get('fs') === '1') {
    pseudo = true;
    sync();
    if (native) {
      const upgrade = (e) => {
        if (!pseudo || e.target.closest('.hero-fs-btn, .hero-fs-share')) return;
        pseudo = false;
        document.removeEventListener('pointerdown', upgrade, true);
        hero.requestFullscreen({ navigationUI: 'hide' }).catch(() => { pseudo = true; }).finally(sync);
      };
      document.addEventListener('pointerdown', upgrade, true);
    }
  }
};

// Full screen refetches the page quietly, swaps in new content and flags what's new.
const LIVE_REFRESH_MS = 120_000;
const LIVE_TABS = { ai: 'New AI Brief', news: 'New news' };

const liveSignature = (doc) => ({
  ai: doc.querySelector('#ai-pop .ai-meta time')?.getAttribute('datetime') || '',
  news: doc.querySelector('#slide-news .hero-news a')?.getAttribute('href') || '',
  sig: doc.querySelector('.hero-carousel')?.getAttribute('data-sig') || '',
});

const wireLiveRefresh = () => {
  const hero = $('.hero-carousel');
  if (!hero) return;
  const bubble = document.createElement('button');
  bubble.type = 'button';
  bubble.className = 'fs-new-bubble';
  bubble.hidden = true;
  hero.append(bubble);
  let seen = liveSignature(document);

  const tabFor = (key) => $(`#tab-${key}`);
  const pending = () => Object.keys(LIVE_TABS).filter((k) => tabFor(k)?.classList.contains('has-new'));
  const renderBubble = () => {
    const keys = pending();
    bubble.hidden = !keys.length;
    bubble.innerHTML = keys.length ? `<span class="dot" aria-hidden="true"></span>${keys.length > 1 ? `${keys.length} new updates` : LIVE_TABS[keys[0]]}` : '';
  };
  bubble.addEventListener('click', () => tabFor(pending()[0])?.click());
  // A tab's dot clears once its slide has been on screen for a few seconds (not the instant autoplay passes it).
  let activeId = '';
  let activeFor = 0;
  setInterval(() => {
    const active = $('.car-tabs [aria-selected="true"]');
    if (!active) return;
    activeFor = active.id === activeId ? activeFor + 1 : 0;
    activeId = active.id;
    if (activeFor >= 4 && active.classList.contains('has-new')) { active.classList.remove('has-new'); renderBubble(); }
  }, 1000);

  const swap = (doc, sel) => {
    const fresh = doc.querySelector(sel);
    const here = $(sel);
    if (fresh && here) here.innerHTML = fresh.innerHTML;
  };

  const refresh = async () => {
    if (!hero.classList.contains('is-fs') || document.hidden) return;
    let doc;
    try {
      const res = await fetch(location.pathname, { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) return;
      doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    } catch { return; }
    const next = liveSignature(doc);
    if (next.ai && next.ai !== seen.ai) {
      swap(doc, '#slide-ai');
      for (const part of ['.ai-meta', '.ai-headline', '.ai-body']) swap(doc, `#ai-pop ${part}`);
      tabFor('ai')?.classList.add('has-new');
    }
    if (next.news && next.news !== seen.news) {
      swap(doc, '#slide-news');
      const lists = $$('.ticker-list');
      const freshLists = doc.querySelectorAll('.ticker-list');
      lists.forEach((ul, k) => { if (freshLists[k]) ul.innerHTML = freshLists[k].innerHTML; });
      loadHeadlines();
      tabFor('news')?.classList.add('has-new');
    }
    if (next.sig && next.sig !== seen.sig) {
      for (const id of ['#slide-guides', '#slide-fixes', '#slide-india']) swap(doc, id);
      hero.setAttribute('data-sig', next.sig);
    }
    seen = next;
    activeFor = 0; // fresh content: the current slide must be seen again before its dot clears
    markNew();
    loadPsn();
    renderBubble();
    dispatchEvent(new Event('hero:content'));
  };

  setInterval(refresh, LIVE_REFRESH_MS);
  document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement) refresh(); });
};

// "More below" cue: visible only at the top of a page that actually has more below.
const wireScrollCue = () => {
  const cue = $('.scroll-cue');
  if (!cue) return;
  const update = () => cue.classList.toggle('is-hidden', scrollY > 120 || document.documentElement.scrollHeight <= innerHeight + 40);
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
};

// ---------- boot ----------
const init = () => {
  renderDay();
  wireSpoilers();
  startNewDots();
  markCurrentNav();
  wireTypeChips();
  wireMute();
  wireFaqPopup();
  wireAiBrief();
  wireSearch();
  wireScrollCue();
  wireFullscreen();
  wireLiveRefresh();
  wireCarousel();
  startCountdowns();
  startPsn();
  startHeadlines();
  registerServiceWorker();
  startVisits();
};

init();

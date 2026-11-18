import { ZONES, REGIONS, isUsTz } from './zones.js';
import { unlockUtc, fmt, fmtUnlockLocal, fmtUtc, splitDuration, pad2, fmtCompact, fmtHoursGap } from './time.js';
import { scheduleRowsHtml } from './schedule.js';

const MAX_PINS = 5;
const PRELOAD_START = Date.UTC(2026, 10, 10);
const KEYS = { pins: 'u6.pins', usRule: 'u6.usRule', sid: 'u6.sid' };
const MUTE_WORDS = ['GTA 6 ending', 'GTA 6 spoilers', 'GTA VI ending', 'GTA 6 final mission', 'GTA 6 twist', 'GTA 6 leak'];
const SEGMENTS = [['d', 'days'], ['h', 'hrs'], ['m', 'mins'], ['s', 'secs']];
const FALLBACK_ME = 'dubai';
const TZ_ALIASES = {
  'Asia/Calcutta': 'Asia/Kolkata', 'Asia/Saigon': 'Asia/Bangkok', 'Asia/Ho_Chi_Minh': 'Asia/Bangkok',
  'Asia/Kuala_Lumpur': 'Asia/Singapore', 'Asia/Taipei': 'Asia/Hong_Kong', 'Asia/Qatar': 'Asia/Riyadh',
  'Asia/Kuwait': 'Asia/Riyadh', 'Asia/Bahrain': 'Asia/Riyadh', 'Asia/Muscat': 'Asia/Dubai',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires', 'America/Lima': 'America/Bogota',
  'America/Montreal': 'America/Toronto', 'America/Detroit': 'America/New_York', 'America/Phoenix': 'America/Denver',
  'America/Vancouver': 'America/Los_Angeles', 'America/Tijuana': 'America/Los_Angeles',
  'Australia/Melbourne': 'Australia/Sydney', 'Australia/Canberra': 'Australia/Sydney', 'Australia/Hobart': 'Australia/Sydney',
  'Australia/ACT': 'Australia/Sydney', 'Australia/NSW': 'Australia/Sydney', 'Australia/Victoria': 'Australia/Sydney',
  'Europe/Paris': 'Europe/Berlin', 'Europe/Madrid': 'Europe/Berlin', 'Europe/Rome': 'Europe/Berlin',
  'Europe/Amsterdam': 'Europe/Berlin', 'Europe/Warsaw': 'Europe/Berlin', 'Europe/Stockholm': 'Europe/Berlin',
  'Europe/Brussels': 'Europe/Berlin', 'Europe/Vienna': 'Europe/Berlin', 'Europe/Zurich': 'Europe/Berlin',
  'Europe/Prague': 'Europe/Berlin', 'Europe/Copenhagen': 'Europe/Berlin', 'Europe/Oslo': 'Europe/Berlin',
  'Europe/Dublin': 'Europe/London', 'Europe/Lisbon': 'Europe/London',
};
const TZ_RENAMES = { Calcutta: 'Kolkata', Saigon: 'Ho Chi Minh City', Kiev: 'Kyiv', Katmandu: 'Kathmandu', Rangoon: 'Yangon' };

// ---------- storage (never throws) ----------
const store = {
  get: (k, fallback) => {
    try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const byId = new Map(ZONES.map((z) => [z.id, z]));

const state = {
  usRule: store.get(KEYS.usRule, true) !== false,
  pins: (store.get(KEYS.pins, []) || []).filter((id) => byId.has(id)).slice(0, MAX_PINS),
  region: 'all',
  query: '',
  liveIds: null,
  gridOrder: '',
  slotSig: '',
  local: null,
};

const atOf = (z) => unlockUtc(z, state.usRule);
const shortCountry = (z) => z.country.replace(/ \(.*\)$/, '');

// Nearest upcoming unlock first (ties by city), then unlocked zones, most recent first.
const orderedZones = (now) => {
  const rows = ZONES.map((z) => ({ z, at: atOf(z) }));
  const upcoming = rows.filter((r) => r.at > now).sort((a, b) => a.at - b.at || a.z.city.localeCompare(b.z.city));
  const live = rows.filter((r) => r.at <= now).sort((a, b) => b.at - a.at || a.z.city.localeCompare(b.z.city));
  return { upcoming, live };
};

const nextZone = (now) => orderedZones(now).upcoming[0]?.z || null;

// 'next' resolves to the nearest upcoming unlock; after the last one, to the last zone.
const zoneFor = (key, now) => {
  if (key === 'local') return state.local;
  if (key !== 'next') return byId.get(key);
  return nextZone(now) || orderedZones(now).live[0]?.z;
};

// ---------- countdown widget ----------
const mountCountdown = (el) => {
  el.innerHTML = SEGMENTS.map(([k, lbl], i) => `${i ? '<span class="cd-colon" aria-hidden="true">:</span>' : ''}<span class="cd-seg"><span class="cd-num" data-k="${k}">00</span><span class="cd-lbl">${lbl}</span></span>`).join('');
  el.dataset.mode = 'count';
  el.classList.remove('is-live');
};

const updateCountdown = (el, zone, now) => {
  const at = atOf(zone);
  const left = at - now;
  if (left <= 0) {
    if (el.dataset.mode !== 'live') {
      el.dataset.mode = 'live';
      el.classList.add('is-live');
      el.innerHTML = '<div class="unlocked-shout">Unlocked</div><div class="unlocked-sub" data-ago></div>';
    }
    $('[data-ago]', el).textContent = `Live in ${zone.city} for ${fmtCompact(now - at)}`;
    return;
  }
  if (el.dataset.mode !== 'count') mountCountdown(el);
  const parts = splitDuration(left);
  for (const [k] of SEGMENTS) {
    const node = $(`[data-k="${k}"]`, el);
    const next = pad2(parts[k]);
    if (node.textContent !== next) node.textContent = next;
  }
  el.setAttribute('aria-label', `${parts.d} days ${parts.h} hours ${parts.m} minutes until GTA 6 unlocks in ${zone.city}`);
};

// ---------- toasts ----------
const toast = (msg, live = false) => {
  const stack = $('.toast-stack');
  if (!stack) return;
  const t = document.createElement('div');
  t.className = `toast${live ? ' is-live' : ''}`;
  t.textContent = msg;
  stack.append(t);
  setTimeout(() => t.remove(), 4200);
};

// ---------- actions: pin / calendar / share ----------
const isPinned = (id) => state.pins.includes(id);

const togglePin = (id) => {
  if (isPinned(id)) {
    state.pins = state.pins.filter((p) => p !== id);
  } else {
    if (state.pins.length >= MAX_PINS) { toast(`You can pin up to ${MAX_PINS} zones. Unpin one first.`); return; }
    state.pins = [...state.pins, id];
    toast(`Pinned ${byId.get(id).city}`);
  }
  store.set(KEYS.pins, state.pins);
  state.slotSig = '';
  renderSlots();
  renderWave(Date.now());
  syncPinButtons();
  applyFilter();
};

const syncPinButtons = () => {
  for (const b of $$('[data-pin]')) {
    if (b.classList.contains('slot-unpin')) continue;
    const on = isPinned(b.dataset.pin);
    b.setAttribute('aria-pressed', String(on));
    if (b.classList.contains('pin-btn')) b.textContent = on ? '★' : '☆';
    else b.textContent = on ? '★ Pinned' : '☆ Pin';
  }
  const count = $('[data-pin-count]');
  if (count) count.textContent = `${state.pins.length} / ${MAX_PINS}`;
};

const icsStamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const downloadIcs = (zone) => {
  const at = atOf(zone);
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Unlock OClock//GTA 6 Countdown//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:gta6-${zone.id}-${at}@unlock-oclock`,
    `DTSTAMP:${icsStamp(Date.now())}`,
    `DTSTART:${icsStamp(at)}`,
    'DURATION:PT2H',
    `SUMMARY:GTA 6 unlocks (${zone.city})`,
    `DESCRIPTION:GTA 6 unlocks now in ${zone.city}. Countdown: ${location.origin}/`,
    'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:GTA 6 unlocks in 15 minutes', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `gta6-unlock-${zone.id}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Calendar reminder downloaded');
};

const shareZone = async (zone) => {
  const left = atOf(zone) - Date.now();
  const text = left > 0
    ? `GTA 6 unlocks in ${zone.city} in ${fmtCompact(left)}. Live countdown for every time zone:`
    : `GTA 6 is live in ${zone.city}. When does it unlock for you?`;
  const url = `${location.origin}/gta-6-release-time/${zone.slug}/`;
  try {
    if (navigator.share) { await navigator.share({ title: 'GTA 6 Countdown', text, url }); return; }
    await navigator.clipboard.writeText(`${text} ${url}`);
    toast('Link copied');
  } catch { /* share sheet dismissed */ }
};

const renderActions = (el, zone, withPin) => {
  el.innerHTML = `
    ${withPin ? `<button class="btn" type="button" data-pin="${zone.id}" aria-pressed="false">☆ Pin</button>` : ''}
    <button class="btn" type="button" data-ics>📅 Add to calendar</button>
    <button class="btn btn-hot" type="button" data-share>Share</button>`;
  $('[data-ics]', el).addEventListener('click', () => downloadIcs(zone));
  $('[data-share]', el).addEventListener('click', () => shareZone(zone));
  syncPinButtons();
};

// ---------- zone cards ----------
const cardHtml = (zone, big) => `
<article class="zcard${big ? ' zcard-big' : ''}" data-card="${zone.id}">
  <div class="zcard-top">
    <span class="zcard-flag" aria-hidden="true">${zone.flag}</span>
    <div class="zcard-name">
      <a class="zcard-city" href="/gta-6-release-time/${zone.slug}/">${zone.city}</a>
      <span class="zcard-country">${zone.country}${zone.also.length ? ` · ${zone.also.slice(0, 3).join(', ')}` : ''}</span>
    </div>
    <button class="pin-btn" type="button" data-pin="${zone.id}" aria-pressed="false" aria-label="Pin ${zone.city}">☆</button>
  </div>
  ${big ? `<span class="status" data-status>Locked</span><div class="countdown countdown-sm" data-countdown="${zone.id}"></div>` : '<div class="zcard-row"><span class="zcard-count" data-count>—</span><span class="status" data-status>Locked</span></div>'}
  <div class="zcard-bar" aria-hidden="true"><i data-bar></i></div>
  <div class="zcard-meta"><span data-unlock></span><span data-now></span></div>
</article>`;

const renderGrid = (now) => {
  const grid = $('[data-zones]');
  if (!grid) return;
  const { upcoming, live } = orderedZones(now);
  const signature = [...upcoming, ...live].map((r) => r.z.id).join(',');
  if (signature === state.gridOrder) return;
  state.gridOrder = signature;
  grid.innerHTML = upcoming.map((r) => cardHtml(r.z, false)).join('')
    + (live.length ? `<p class="group-label">Unlocked · ${live.length}</p>${live.map((r) => cardHtml(r.z, false)).join('')}` : '');
  syncPinButtons();
  applyFilter();
};

const applyFilter = () => {
  const q = state.query.trim().toLowerCase();
  let shown = 0;
  for (const card of $$('[data-zones] [data-card]')) {
    const z = byId.get(card.dataset.card);
    const hay = `${z.city} ${z.country} ${z.also.join(' ')} ${z.tz}`.toLowerCase();
    const okRegion = state.region === 'all' || (state.region === 'pinned' ? isPinned(z.id) : z.region === state.region);
    const ok = okRegion && (!q || hay.includes(q));
    card.hidden = !ok;
    if (ok) shown += 1;
  }
  const label = $('[data-zones] .group-label');
  if (label) label.hidden = !$$('[data-zones] .group-label ~ [data-card]').some((c) => !c.hidden);
  const empty = $('[data-empty]');
  if (empty) empty.hidden = shown > 0;
};

const renderChips = () => {
  const wrap = $('[data-chips]');
  if (!wrap) return;
  const chips = [['all', 'All'], ['pinned', '★ Pinned'], ...Object.entries(REGIONS)];
  wrap.innerHTML = chips.map(([k, l]) => `<button class="chip" type="button" data-region="${k}" aria-pressed="${state.region === k}">${l}</button>`).join('');
  wrap.addEventListener('click', (e) => {
    const b = e.target.closest('[data-region]');
    if (!b) return;
    state.region = b.dataset.region;
    for (const c of $$('[data-region]', wrap)) c.setAttribute('aria-pressed', String(c === b));
    applyFilter();
  });
};

// ---------- unlock wave: night fill creeping right, smooth valley at the next unlock ----------
// x is piecewise: the 24 h before the first unlock map onto the left lead-in (0 → FIRST_X), and the
// unlock window maps onto FIRST_X → END_X. The night fill ends at "now", so it moves with the time left.
const WAVE_LEAD_MS = 24 * 3600 * 1000;
const WAVE_FIRST_X = 0.14;
const WAVE_END_X = 0.95;
const WAVE_H = 132;
const WAVE_BASE = 30;
const WAVE_DEPTH = 34;
const WAVE_SIGMA = 0.075;
const WAVE_SAMPLES = 120;
const TZ_ABBR = {
  auckland: 'NZDT', sydney: 'AEDT', adelaide: 'ACDT', brisbane: 'AEST', tokyo: 'JST', seoul: 'KST', perth: 'AWST',
  singapore: 'SGT', hongkong: 'HKT', manila: 'PHT', bangkok: 'ICT', jakarta: 'WIB', india: 'IST', karachi: 'PKT',
  dubai: 'GST', riyadh: 'AST', istanbul: 'TRT', johannesburg: 'SAST', berlin: 'CET', london: 'GMT', saopaulo: 'BRT',
  buenosaires: 'ART', bogota: 'COT', newyork: 'EST', toronto: 'EST', chicago: 'CST', mexico: 'CST', denver: 'MST',
  losangeles: 'PST', honolulu: 'HST',
};
const waveGeom = { min: 0, max: 0 };

const waveFx = (t) => {
  const { min, max } = waveGeom;
  if (t <= min) return Math.max(0, 1 - (min - t) / WAVE_LEAD_MS) * WAVE_FIRST_X;
  return WAVE_FIRST_X + Math.min(1, (t - min) / (max - min || 1)) * (WAVE_END_X - WAVE_FIRST_X);
};

const waveY = (fx, valley) => {
  const d = (fx - valley) / WAVE_SIGMA;
  return WAVE_BASE + WAVE_DEPTH * Math.exp(-(d * d) / 2) + 3 * Math.sin(fx * Math.PI * 4);
};

// Full zone names for one unlock instant: "🇯🇵 Tokyo — Japan Standard Time".
const longTzName = (tz, at) => {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'long' }).formatToParts(new Date(at)).find((p) => p.type === 'timeZoneName')?.value || tz;
  } catch { return tz; }
};
const tipFor = (at, rows) => {
  const zones = rows.filter((r) => r.at === at).map(({ z }) => `${z.flag} ${z.city} — ${longTzName(z.tz, at)}`);
  return `${zones.join('\n')}\nUnlocks ${fmtUtc(at)}`;
};

const wireWaveTip = (track) => {
  if (track.dataset.tipWired) return;
  track.dataset.tipWired = '1';
  const card = track.parentElement;
  const tip = document.createElement('div');
  tip.className = 'wave-tip';
  tip.hidden = true;
  tip.setAttribute('role', 'tooltip');
  card.append(tip);
  const show = (dot) => {
    tip.textContent = dot.dataset.tip;
    tip.hidden = false;
    const c = card.getBoundingClientRect();
    const d = dot.getBoundingClientRect();
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const left = Math.min(Math.max(8, d.left - c.left + d.width / 2 - w / 2), c.width - w - 8);
    const above = d.top - c.top - h - 10;
    tip.style.left = `${left}px`;
    tip.style.top = `${above > 4 ? above : d.bottom - c.top + 10}px`;
  };
  track.addEventListener('pointerover', (e) => { const dot = e.target.closest('.wave-dot'); if (dot) show(dot); });
  track.addEventListener('pointerout', (e) => { if (e.target.closest('.wave-dot')) tip.hidden = true; });
  track.addEventListener('pointerdown', (e) => { const dot = e.target.closest('.wave-dot'); if (dot) show(dot); else tip.hidden = true; });
};

const renderWave = (now) => {
  const track = $('[data-wave]');
  if (!track) return;
  const rows = ZONES.map((z) => ({ z, at: atOf(z) }));
  waveGeom.min = Math.min(...rows.map((r) => r.at));
  waveGeom.max = Math.max(...rows.map((r) => r.at));
  // One TZ label per distinct unlock instant ("JST·KST", or "EST +5" for a crowd).
  const groups = new Map();
  for (const { z, at } of rows) {
    if (!groups.has(at)) groups.set(at, []);
    const abbr = TZ_ABBR[z.id] || z.city.slice(0, 3).toUpperCase();
    if (!groups.get(at).includes(abbr)) groups.get(at).push(abbr);
  }
  const important = new Set([waveGeom.min, waveGeom.max, state.local ? atOf(state.local) : -1]);
  const labels = [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([at, abbrs], k) => {
    const text = abbrs.length <= 2 ? abbrs.join('·') : `${abbrs[0]} +${abbrs.length - 1}`;
    return `<span class="wave-tz${important.has(at) ? '' : ' minor'}" data-at="${at}" data-row="${k % 2}" title="${abbrs.join(', ')}">${text}</span>`;
  }).join('');
  track.innerHTML = `<svg class="wave-svg" aria-hidden="true" preserveAspectRatio="none"><defs><linearGradient id="wave-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0" data-wave-grad></linearGradient></defs><path class="wave-curve" data-wave-curve stroke="url(#wave-grad)"/></svg>
    ${rows.map(({ z, at }) => `<span class="wave-dot" data-dot="${z.id}" data-at="${at}" data-tip="${escHtml(tipFor(at, rows))}"></span>`).join('')}
    ${labels}
    <span class="wave-label top next" data-wave-next></span>
    <div class="wave-now" data-wave-now><span>now</span></div>`;
  wireWaveTip(track);
  updateWave(now);
};

const updateWave = (now) => {
  const track = $('[data-wave]');
  if (!track || !waveGeom.max || !$('[data-wave-curve]', track)) return;
  const width = track.clientWidth || 1;
  const { upcoming } = orderedZones(now);
  const next = upcoming[0];
  const valley = next ? waveFx(next.at) : WAVE_END_X;
  const nowFx = waveFx(now);

  const pts = [];
  for (let k = 0; k <= WAVE_SAMPLES; k += 1) {
    const fx = k / WAVE_SAMPLES;
    pts.push([fx * width, waveY(fx, valley)]);
  }
  const line = pts.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  // Gradient along the line: neutral up to "now" (live), dawn navy for pending, orange around the next valley.
  const LIVE = '#8b93a1';
  const NAVY = '#1c2a4f';
  const ORANGE = '#f08a24';
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const stops = [[0, LIVE], [nowFx, LIVE], [nowFx, NAVY]];
  if (next) {
    const a = clamp01(Math.max(nowFx, valley - 1.6 * WAVE_SIGMA));
    const b = clamp01(Math.max(nowFx, valley - 0.6 * WAVE_SIGMA));
    const c = clamp01(valley + 0.6 * WAVE_SIGMA);
    const d = clamp01(valley + 1.6 * WAVE_SIGMA);
    stops.push([a, NAVY], [b, ORANGE], [c, ORANGE], [d, NAVY]);
  }
  stops.push([1, NAVY]);
  const grad = $('[data-wave-grad]', track);
  grad.setAttribute('x2', String(width));
  grad.innerHTML = stops.map(([o, col]) => `<stop offset="${clamp01(o).toFixed(4)}" stop-color="${col}"/>`).join('');
  const svg = $('.wave-svg', track);
  svg.setAttribute('viewBox', `0 0 ${width} ${WAVE_H}`);
  $('[data-wave-curve]', track).setAttribute('d', line);

  const rank = new Map(upcoming.map((r, k) => [r.z.id, k]));
  const span = Math.max(1, upcoming.length - 1);
  for (const dot of $$('[data-dot]', track)) {
    const at = Number(dot.dataset.at);
    const fx = waveFx(at);
    const isPast = !rank.has(dot.dataset.dot);
    const isNext = !!next && at === next.at;
    dot.style.left = `${(fx * 100).toFixed(3)}%`;
    dot.style.top = `${waveY(fx, valley).toFixed(1)}px`;
    dot.classList.toggle('is-on', isPast);
    dot.classList.toggle('is-next', isNext);
    dot.style.setProperty('--t', isPast || isNext ? '0' : String(Math.min(1, 0.25 + (0.75 * rank.get(dot.dataset.dot)) / span)));
  }
  // Labels: greedy placement into up to 3 rows; hidden only when there is truly no room (dots keep a tooltip).
  const rowEnd = [-Infinity, -Infinity, -Infinity];
  for (const tz of $$('.wave-tz', track)) {
    const at = Number(tz.dataset.at);
    const fx = waveFx(at);
    const x = fx * width;
    const half = (tz.offsetWidth || tz.textContent.length * 6) / 2 + 3;
    const row = rowEnd.findIndex((end) => end < x - half);
    tz.hidden = row < 0;
    if (row >= 0) rowEnd[row] = x + half;
    tz.style.left = `${(fx * 100).toFixed(3)}%`;
    tz.style.top = `${(waveY(fx, valley) + 12 + Math.max(0, row) * 11).toFixed(1)}px`;
    tz.classList.toggle('on-night', fx <= nowFx);
    tz.classList.toggle('is-next', !!next && at === next.at);
  }
  const marker = $('[data-wave-now]', track);
  marker.style.left = `${(nowFx * 100).toFixed(3)}%`;
  marker.hidden = true; // the colour change along the line marks "now"
  const label = $('[data-wave-next]', track);
  label.hidden = !next;
  if (next) {
    label.style.left = `${(valley * 100).toFixed(3)}%`;
    label.classList.toggle('flip-left', valley > 0.75);
    label.classList.toggle('flip-right', valley < 0.25);
    label.textContent = `Next: ${next.z.flag} ${next.z.city} · in ${fmtCompact(next.at - now)}`;
  }
};

// ---------- hero: five zones side by side ----------
// The visitor's own zone: a tracked zone when the browser's tz maps to one, else an ad-hoc zone.
const detectLocal = () => {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* old browser */ }
  if (!tz || tz === 'UTC' || tz === 'Etc/UTC') return null;
  const known = ZONES.find((z) => z.tz === (TZ_ALIASES[tz] || tz));
  if (known) return known;
  const raw = tz.split('/').pop().replace(/_/g, ' ');
  return { id: 'local', tz, city: TZ_RENAMES[raw] || raw, country: 'Your time zone', flag: '📍', region: '', slug: '', also: [], us: isUsTz(tz) };
};

const earliestZone = () => ZONES.reduce((a, b) => (atOf(b) < atOf(a) ? b : a));

// A earliest · B the visitor (else Middle East) · C London · D New York · E US West Coast.
// Each pin replaces the default slot nearest to it in unlock time; ties go to the earlier slot.
const buildSlots = () => {
  const slots = [
    { role: 'First on Earth', zone: earliestZone() },
    { role: 'Your time zone', zone: state.local, you: true },
    { role: 'London', zone: byId.get('london') },
    { role: 'New York', zone: byId.get('newyork') },
    { role: 'US West Coast', zone: byId.get('losangeles') },
  ];
  const dupe = slots[1].zone && slots.some((s, i) => i !== 1 && s.zone.id === slots[1].zone.id);
  if (!slots[1].zone || dupe) slots[1] = { role: 'Middle East', zone: byId.get(FALLBACK_ME) };
  for (const id of state.pins) {
    const zone = byId.get(id);
    const same = slots.find((s) => s.zone.id === id);
    if (same) { same.pinned = true; continue; }
    const at = atOf(zone);
    let best = -1;
    slots.forEach((s, i) => {
      if (s.pinned) return;
      if (best < 0 || Math.abs(atOf(s.zone) - at) < Math.abs(atOf(slots[best].zone) - at)) best = i;
    });
    if (best >= 0) slots[best] = { role: '★ Pinned', zone, pinned: true };
  }
  return slots;
};

const slotHtml = ({ role, zone, you, pinned }) => {
  const name = zone.slug
    ? `<a class="slot-city" href="/gta-6-release-time/${zone.slug}/">${zone.flag} ${zone.city}</a>`
    : `<span class="slot-city">${zone.flag} ${zone.city}</span>`;
  return `<article class="slot${you ? ' is-you' : ''}${pinned ? ' is-pinned' : ''}" data-slot="${zone.id}">
    <span class="slot-role">${role}</span>
    ${name}
    <div class="countdown" data-countdown="${zone.id}" aria-live="off"></div>
    <p class="slot-when">${fmtUnlockLocal(atOf(zone), zone.tz)}${zone.us && state.usRule ? ' · ET store' : ''}</p>
    ${pinned ? `<button class="slot-unpin" type="button" data-pin="${zone.id}" aria-label="Unpin ${zone.city}" title="Unpin">✕</button>` : ''}
  </article>`;
};

const renderSlots = () => {
  const wrap = $('[data-slots]');
  if (!wrap) return;
  const slots = buildSlots();
  const sig = `${state.usRule}|${slots.map((s) => `${s.zone.id}:${s.role}:${!!s.pinned}`).join(',')}`;
  if (sig === state.slotSig) return;
  state.slotSig = sig;
  wrap.innerHTML = slots.map(slotHtml).join('');
  for (const el of $$('[data-countdown]', wrap)) mountCountdown(el);
};

// ---------- the 1-second heartbeat ----------
const tick = () => {
  const now = Date.now();
  renderGrid(now);
  renderSlots();
  for (const el of $$('[data-slot]')) el.classList.toggle('is-live', atOf(zoneFor(el.dataset.slot, now)) <= now);
  for (const el of $$('[data-next-where]')) {
    const z = nextZone(now);
    el.textContent = z ? `Next to unlock: ${z.flag} ${z.city}, ${shortCountry(z)}` : 'GTA 6 is live in every time zone';
  }

  for (const el of $$('[data-countdown]')) {
    const zone = zoneFor(el.dataset.countdown, now);
    if (zone) updateCountdown(el, zone, now);
  }

  const { upcoming, live } = orderedZones(now);
  const liveSet = new Set(live.map((r) => r.z.id));
  const nextId = upcoming[0]?.z.id;

  for (const card of $$('[data-card]')) {
    const z = byId.get(card.dataset.card);
    const at = atOf(z);
    const left = at - now;
    const isLive = left <= 0;
    card.classList.toggle('is-live', isLive);
    card.classList.toggle('is-next', z.id === nextId);
    card.classList.toggle('is-you', state.local?.id === z.id);
    card.classList.toggle('is-soon', !isLive && z.id !== nextId && left < 3600_000);
    $('[data-status]', card).textContent = isLive ? 'Unlocked' : z.id === nextId ? 'Next up' : left < 3600_000 ? 'Under 1 hour' : 'Locked';
    const count = $('[data-count]', card);
    if (count) count.textContent = isLive ? `Live for ${fmtCompact(-left)}` : fmtCompact(left);
    $('[data-bar]', card).style.width = `${Math.min(100, Math.max(0, ((now - PRELOAD_START) / (at - PRELOAD_START)) * 100))}%`;
    $('[data-unlock]', card).textContent = `${fmtUnlockLocal(at, z.tz)}${z.us && state.usRule ? ' · ET store' : ''}`;
    $('[data-now]', card).textContent = `Now ${fmt(now, z.tz, { hour: 'numeric', minute: '2-digit' })}`;
  }

  for (const tr of $$('[data-schedule] tr')) tr.classList.toggle('is-live', liveSet.has(tr.dataset.zone));

  const set = (k, v) => { for (const el of $$(`[data-stat="${k}"]`)) el.textContent = v; };
  const rows = ZONES.map((z) => ({ z, at: atOf(z) }));
  const first = rows.reduce((a, b) => (b.at < a.at ? b : a));
  const last = rows.reduce((a, b) => (b.at > a.at ? b : a));
  set('first', `${first.z.flag} ${first.z.city}`);
  set('first-in', first.at > now ? `in ${fmtCompact(first.at - now)}` : `live for ${fmtCompact(now - first.at)}`);
  set('last', `${last.z.flag} ${last.z.city}`);
  set('last-in', last.at > now ? `in ${fmtCompact(last.at - now)}` : `live for ${fmtCompact(now - last.at)}`);
  set('unlocked', `${liveSet.size} / ${ZONES.length}`);
  set('gap', fmtHoursGap(last.at - first.at));
  set('gap-inline', fmtHoursGap(last.at - first.at));

  updateWave(now);

  if (state.liveIds) {
    for (const id of liveSet) {
      if (!state.liveIds.has(id)) {
        const z = byId.get(id);
        toast(`GTA 6 just unlocked in ${z.flag} ${z.city}`, true);
      }
    }
  }
  state.liveIds = liveSet;
};

const startHeartbeat = () => {
  const loop = () => {
    tick();
    setTimeout(loop, 1000 - (Date.now() % 1000) + 8);
  };
  loop();
};

// ---------- city pages ----------
const renderCityActions = () => {
  for (const el of $$('[data-actions]')) {
    if (el.dataset.actions === 'next') continue;
    const z = byId.get(el.dataset.actions);
    if (z) renderActions(el, z, true);
  }
};

// ---------- schedule + US rule switch ----------
const renderSchedule = () => {
  const body = $('[data-schedule]');
  if (body) body.innerHTML = scheduleRowsHtml(state.usRule);
};

const rerenderAll = () => {
  state.gridOrder = '';
  state.slotSig = '';
  state.liveIds = null;
  for (const el of $$('[data-countdown]')) mountCountdown(el);
  renderSchedule();
  renderWave(Date.now());
  tick();
};

const wireUsRule = () => {
  const input = $('[data-usrule]');
  if (!input) return;
  const label = $('[data-usrule-label]');
  const sync = () => { if (label) label.textContent = state.usRule ? 'Eastern Time' : 'Local midnight'; };
  input.checked = state.usRule;
  sync();
  input.addEventListener('change', () => {
    state.usRule = input.checked;
    store.set(KEYS.usRule, state.usRule);
    sync();
    rerenderAll();
    toast(state.usRule ? 'US zones follow the Eastern-Time PS Store' : 'US zones unlock at strict local midnight');
  });
};

// ---------- misc wiring ----------
const wireSearch = () => {
  const input = $('[data-search]');
  if (!input) return;
  input.addEventListener('input', () => { state.query = input.value; applyFilter(); });
};

const wireMute = () => {
  for (const btn of $$('[data-copy-mute]')) {
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(MUTE_WORDS.join('\n')); toast('Mute list copied'); } catch { toast('Copy failed. Select the words instead.'); }
    });
  }
};

// ---------- same-origin API calls (the server rejects requests without this header) ----------
const api = (path, opts = {}) => fetch(path, {
  ...opts,
  credentials: 'same-origin',
  headers: { 'X-GTA6-Client': '1', ...(opts.headers || {}) },
});

const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ---------- PSN status: shared fetch (server proxies + caches Sony's feed), slide + header boxes ----------
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

const renderPsnMini = (d) => {
  for (const box of $$('[data-psn-box]')) {
    const svc = d.ok ? d.services.find((x) => x.id === box.dataset.psnBox) : null;
    const issue = svc?.incidents[0];
    box.dataset.state = !svc ? 'unknown' : issue ? 'issue' : 'ok';
    box.dataset.tip = svc ? `${svc.name}: ${issue ? issue.type : 'Up'}` : `${box.dataset.name}: status unavailable`;
    box.setAttribute('aria-label', box.dataset.tip);
  }
  for (const wrap of $$('[data-psn-mini]')) {
    const issues = d.ok ? d.services.some((x) => x.incidents.length) || d.countryIncidents.length > 0 : false;
    wrap.dataset.state = !d.ok ? 'unknown' : issues ? 'issue' : 'ok';
    wrap.setAttribute('aria-label', !d.ok ? 'PlayStation live status unavailable' : issues ? 'PlayStation is reporting problems in India' : 'All PlayStation services are up in India');
  }
  const hhmm = (ms) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ms));
  for (const el of $$('[data-psn-times]')) {
    el.textContent = `last ${d.checkedAt ? hhmm(Date.parse(d.checkedAt)) : '--:--'} · next ${hhmm(psnAt + PSN_REFRESH_MS)}`;
  }
};

const renderPsnSlide = (d) => {
  const box = $('[data-psn]');
  if (!box) return;
  if (!d.ok) { box.innerHTML = `<p class="psn-overall psn-unknown">Couldn't reach the PlayStation status page. Check ${PSN_LINK} directly.</p>`; return; }
  const issues = [...d.countryIncidents, ...d.services.flatMap((x) => x.incidents)];
  const checked = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }).format(new Date(d.checkedAt));
  box.innerHTML = `
    <p class="psn-overall ${issues.length ? 'psn-issue' : 'psn-ok'}">${issues.length ? '⚠️ PlayStation is reporting problems in India' : '✅ All PlayStation services are up in India'}</p>
    <ul class="psn-services">${d.services.map((x) => `<li class="${x.incidents.length ? 'is-issue' : 'is-ok'}"><span>${escHtml(x.name)}</span><b>${x.incidents.length ? escHtml(x.incidents[0].type) : 'Up'}</b></li>`).join('')}</ul>
    ${issues[0]?.message ? `<p class="psn-msg">${escHtml(issues[0].message)}</p>` : ''}
    <p class="psn-src">Checked ${escHtml(checked)} IST${d.stale ? ' (cached)' : ''} · source: ${PSN_LINK}</p>`;
};

const loadPsn = async () => {
  const d = await fetchPsn();
  renderPsnMini(d);
  renderPsnSlide(d);
};

const startPsn = () => {
  if (!$('[data-psn-mini]') && !$('[data-psn]')) return;
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
  // when the viewport or fonts change, and only applied when the result actually differs.
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
    if (i2 === 2) loadPsn();
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
    clone.querySelectorAll('[data-slots]').forEach((n) => n.removeAttribute('data-slots'));
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

const wirePins = () => {
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pin]');
    if (b) togglePin(b.dataset.pin);
  });
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

// Floating quick-answers panel: toggle, Esc, click outside, focus back to the button.
const wireFaqPopup = () => {
  const fab = $('.faq-fab');
  const pop = $('#faq-pop');
  if (!fab || !pop) return;
  const set = (open) => {
    pop.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    if (open) $('.faq-pop-close', pop)?.focus();
  };
  fab.addEventListener('click', () => set(pop.hidden));
  $('.faq-pop-close', pop)?.addEventListener('click', () => { set(false); fab.focus(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { set(false); fab.focus(); } });
  document.addEventListener('click', (e) => { if (!pop.hidden && !pop.contains(e.target) && !fab.contains(e.target)) set(false); });
};

// Floating AI brief: opened by the floating button or the header icon.
const wireAiBrief = () => {
  const pop = $('#ai-pop');
  const openers = $$('[data-ai-open]');
  if (!pop || !openers.length) return;
  let lastOpener = null;
  const set = (open) => {
    pop.hidden = !open;
    openers.forEach((b) => b.setAttribute('aria-expanded', String(open)));
    if (open) { const faq = $('#faq-pop'); if (faq && !faq.hidden) $('.faq-fab')?.click(); $('[data-ai-close]', pop)?.focus(); }
  };
  openers.forEach((b) => b.addEventListener('click', () => { lastOpener = b; set(pop.hidden); }));
  $('[data-ai-close]', pop)?.addEventListener('click', () => { set(false); lastOpener?.focus(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { set(false); lastOpener?.focus(); } });
  document.addEventListener('click', (e) => { if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('[data-ai-open]')) set(false); });
  $('.faq-fab')?.addEventListener('click', () => { if (!pop.hidden) set(false); });
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

// A link to #zones or #schedule opens that section's collapsed toggle (also on repeat clicks).
const wireToggleLinks = () => {
  const openFor = (hash) => {
    if (!hash || hash.length < 2) return;
    const toggle = document.getElementById(decodeURIComponent(hash.slice(1)))?.querySelector('details.sched-toggle');
    if (toggle) toggle.open = true;
  };
  window.addEventListener('hashchange', () => openFor(location.hash));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (a && a.pathname === location.pathname) openFor(a.hash);
  });
  openFor(location.hash);
};

// ---------- boot ----------
const init = () => {
  state.local = detectLocal();
  for (const el of $$('[data-countdown]')) mountCountdown(el);
  renderChips();
  renderCityActions();
  renderSchedule();
  renderWave(Date.now());
  wireUsRule();
  wireSearch();
  wireMute();
  wirePins();
  wireToggleLinks();
  wireFaqPopup();
  wireAiBrief();
  wireScrollCue();
  wireCarousel();
  startPsn();
  startHeadlines();
  registerServiceWorker();
  startHeartbeat();
  startVisits();
};

init();

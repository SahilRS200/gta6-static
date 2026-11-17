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

// ---------- wave ----------
// Past unlocks are pale, the next one is highlighted, later ones get darker the further out they are.
const renderWave = (now) => {
  const track = $('[data-wave]');
  if (!track) return;
  const rows = ZONES.map((z) => ({ z, at: atOf(z) }));
  const min = Math.min(...rows.map((r) => r.at));
  const max = Math.max(...rows.map((r) => r.at));
  const pos = (t) => 3 + ((t - min) / (max - min || 1)) * 94;
  const first = rows.find((r) => r.at === min).z;
  const last = rows.find((r) => r.at === max).z;
  track.innerHTML = `<div class="wave-line" data-wave-line></div>${rows.map(({ z, at }) => `<span class="wave-dot" data-dot="${z.id}" style="left:${pos(at)}%" title="${z.flag} ${z.city} — ${fmtUtc(at)}"></span>`).join('')}
    <span class="wave-label bottom is-first" data-label-for="${first.id}" style="left:${pos(min)}%">${first.flag} ${first.city} · first</span>
    <span class="wave-label bottom is-last" data-label-for="${last.id}" style="left:${pos(max)}%">${last.flag} ${last.city} · last</span>
    <span class="wave-label top next" data-wave-next></span>
    <div class="wave-now" data-wave-now><span></span></div>`;
  track.dataset.min = min;
  track.dataset.max = max;
  updateWave(now);
};

const updateWave = (now) => {
  const track = $('[data-wave]');
  if (!track || !track.dataset.min) return;
  const min = +track.dataset.min;
  const max = +track.dataset.max;
  const pos = (t) => 3 + ((t - min) / (max - min || 1)) * 94;
  const pct = now <= min ? 0 : now >= max ? 100 : pos(now);
  $('[data-wave-line]', track).style.background = `linear-gradient(90deg, var(--wave-past) 0%, var(--wave-past) ${pct}%, var(--accent) ${pct}%, var(--ink) 100%)`;
  const marker = $('[data-wave-now]', track);
  marker.style.left = `${pct}%`;
  marker.hidden = now < min || now >= max;
  marker.classList.toggle('flip', pct > 70);
  $('span', marker).textContent = 'now';

  const { upcoming } = orderedZones(now);
  const next = upcoming[0];
  const rank = new Map(upcoming.map((r, k) => [r.z.id, k]));
  const span = Math.max(1, upcoming.length - 1);
  for (const dot of $$('[data-dot]', track)) {
    const id = dot.dataset.dot;
    const isPast = !rank.has(id);
    const isNext = next && atOf(byId.get(id)) === next.at;
    dot.classList.toggle('is-on', isPast);
    dot.classList.toggle('is-next', !!isNext);
    dot.style.setProperty('--t', isPast || isNext ? '0' : String(Math.min(1, 0.25 + (0.75 * rank.get(id)) / span)));
  }
  const label = $('[data-wave-next]', track);
  if (next) {
    label.hidden = false;
    label.style.left = `${pos(next.at)}%`;
    label.classList.toggle('flip-left', pos(next.at) > 80);
    label.classList.toggle('flip-right', pos(next.at) < 12);
    label.textContent = `Next: ${next.z.flag} ${next.z.city} · in ${fmtCompact(next.at - now)}`;
  } else {
    label.hidden = true;
  }
  for (const l of $$('[data-label-for]', track)) l.hidden = !!next && l.dataset.labelFor === next.z.id;
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
  const btn = $('[data-copy-mute]');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(MUTE_WORDS.join('\n')); toast('Mute list copied'); } catch { toast('Copy failed. Select the words instead.'); }
  });
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
      const res = await fetch('/api/hit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid, first: isFirst }), keepalive: true });
      if (res.ok) showVisits(await res.json());
    } catch { /* offline — counter just stays hidden */ }
  };
  await hit(first);
  setInterval(() => { if (document.visibilityState === 'visible') hit(false); }, 30_000);
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
  startHeartbeat();
  startVisits();
};

init();

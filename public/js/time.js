// Time-zone math with nothing but Intl — shared by the browser and the Node server.
import { RELEASE, US_STORE_TZ } from './zones.js';

const formatterCache = new Map();

const partsFormatter = (tz) => {
  if (!formatterCache.has(tz)) {
    formatterCache.set(tz, new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
    }));
  }
  return formatterCache.get(tz);
};

// Offset of `tz` from UTC (ms) at the instant `utcMs`.
const tzOffsetMs = (tz, utcMs) => {
  const p = {};
  for (const { type, value } of partsFormatter(tz).formatToParts(new Date(utcMs))) p[type] = value;
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
};

// The UTC instant at which the wall clock in `tz` reads 00:00 on the release date.
const localMidnightUtc = (tz) => {
  const wall = Date.UTC(RELEASE.y, RELEASE.m - 1, RELEASE.d);
  const first = wall - tzOffsetMs(tz, wall);
  return wall - tzOffsetMs(tz, first);
};

// `usRule` true → US zones unlock with the Eastern-Time US PlayStation Store.
const unlockUtc = (zone, usRule) => localMidnightUtc(zone.us && usRule ? US_STORE_TZ : zone.tz);

const fmt = (utcMs, tz, opts) => new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }).format(new Date(utcMs));

const fmtUnlockLocal = (utcMs, tz) => fmt(utcMs, tz, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const fmtUtc = (utcMs) => `${fmt(utcMs, 'UTC', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} UTC`;

const fmtOffset = (tz, utcMs) => {
  const mins = Math.round(tzOffsetMs(tz, utcMs) / 60000);
  const sign = mins >= 0 ? '+' : '−';
  const abs = Math.abs(mins);
  const mm = abs % 60;
  return `UTC${sign}${Math.floor(abs / 60)}${mm ? `:${String(mm).padStart(2, '0')}` : ''}`;
};

const splitDuration = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
};

const pad2 = (n) => String(n).padStart(2, '0');

const fmtCompact = (ms) => {
  const { d, h, m, s } = splitDuration(ms);
  return d > 0 ? `${d}d ${pad2(h)}h ${pad2(m)}m ${pad2(s)}s` : `${pad2(h)}h ${pad2(m)}m ${pad2(s)}s`;
};

const fmtHoursGap = (ms) => {
  const totalMin = Math.round(Math.abs(ms) / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

export { tzOffsetMs, localMidnightUtc, unlockUtc, fmt, fmtUnlockLocal, fmtUtc, fmtOffset, splitDuration, pad2, fmtCompact, fmtHoursGap };

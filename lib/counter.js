// Visit counter: one durable number (total visits) plus an in-memory "here right now" count.
// Persisted to DATA_DIR/counter.json — mount a Railway volume there so it survives deploys.
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const LIVE_WINDOW_MS = 75_000;
const FLUSH_EVERY_MS = 10_000;
const NEW_SESSIONS_PER_IP = 30;
const IP_WINDOW_MS = 10 * 60_000;
const MAX_TRACKED = 200_000;
const SID_RE = /^[a-z0-9]{10,40}$/i;

const createCounter = async (dataDir) => {
  const file = join(dataDir, 'counter.json');
  const state = { total: 0, dirty: false };
  const seen = new Map(); // sid → lastSeen
  const ipBuckets = new Map(); // ip → { n, since }

  await mkdir(dataDir, { recursive: true });
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    if (Number.isSafeInteger(parsed.total) && parsed.total >= 0) state.total = parsed.total;
  } catch {
    // first boot or unreadable file — start from zero
  }

  const flush = async () => {
    if (!state.dirty) return;
    state.dirty = false;
    const tmp = `${file}.tmp`;
    try {
      await writeFile(tmp, JSON.stringify({ total: state.total, savedAt: new Date().toISOString() }));
      await rename(tmp, file);
    } catch (err) {
      state.dirty = true;
      console.error('counter flush failed:', err.message);
    }
  };

  const prune = () => {
    const now = Date.now();
    for (const [sid, t] of seen) if (now - t > LIVE_WINDOW_MS) seen.delete(sid);
    for (const [ip, b] of ipBuckets) if (now - b.since > IP_WINDOW_MS) ipBuckets.delete(ip);
  };

  const allowNewSession = (ip) => {
    const now = Date.now();
    const b = ipBuckets.get(ip);
    if (!b || now - b.since > IP_WINDOW_MS) {
      ipBuckets.set(ip, { n: 1, since: now });
      return true;
    }
    b.n += 1;
    return b.n <= NEW_SESSIONS_PER_IP;
  };

  const live = () => {
    const now = Date.now();
    let n = 0;
    for (const t of seen.values()) if (now - t <= LIVE_WINDOW_MS) n += 1;
    return n;
  };

  // `first` → the browser's first hit this session; counts toward the total once.
  const hit = (sid, first, ip) => {
    if (typeof sid === 'string' && SID_RE.test(sid) && seen.size < MAX_TRACKED) {
      const known = seen.has(sid);
      seen.set(sid, Date.now());
      if (first && !known && allowNewSession(ip)) {
        state.total += 1;
        state.dirty = true;
      }
    }
    return stats();
  };

  const stats = () => ({ total: state.total, live: Math.max(1, live()) });

  const timer = setInterval(() => { prune(); flush(); }, FLUSH_EVERY_MS);
  timer.unref();

  return { hit, stats, flush };
};

export { createCounter };

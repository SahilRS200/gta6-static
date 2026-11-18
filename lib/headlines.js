// "Around the web": GTA 6 headlines from trusted gaming RSS/Atom feeds, refreshed hourly and cached.
// Only titles that are actually about GTA 6 are kept; links go straight to the publisher.
const FEEDS = [
  { name: 'IGN', url: 'https://www.ign.com/rss/articles/feed' },
  { name: 'GameSpot', url: 'https://www.gamespot.com/feeds/news/' },
  { name: 'PC Gamer', url: 'https://www.pcgamer.com/rss/' },
  { name: 'GamesRadar+', url: 'https://www.gamesradar.com/feeds/all/' },
  { name: 'Eurogamer', url: 'https://www.eurogamer.net/feed' },
  { name: 'VGC', url: 'https://www.videogameschronicle.com/feed/' },
  { name: 'Kotaku', url: 'https://kotaku.com/rss' },
  { name: 'Rock Paper Shotgun', url: 'https://www.rockpapershotgun.com/feed' },
];
const REFRESH_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 8000;
const MAX_BYTES = 2_500_000;
const MAX_AGE_MS = 5 * 24 * 3600 * 1000;
const KEEP = 15;
const ABOUT_GTA6 = /\bGTA\s?(6|VI)\b|Grand Theft Auto\s(VI|6)\b/i;
const USER_AGENT = 'GTA6Info.in headlines (+https://www.gta6info.in/about/)';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };

const decode = (s) => String(s)
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, '')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
  .replace(/\s+/g, ' ')
  .trim();

const tag = (block, name) => block.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i'))?.[1];

const linkOf = (block) => {
  const text = tag(block, 'link');
  if (text && /^\s*https?:/.test(decode(text))) return decode(text);
  const href = block.match(/<link\b[^>]*href="([^"]+)"[^>]*\/?>/i)?.[1];
  return href ? decode(href) : '';
};

const parseFeed = (xml, source) => {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>|<entry\b[\s\S]*?<\/entry>/gi) || [];
  return blocks.map((b) => {
    const title = decode(tag(b, 'title') || '').slice(0, 180);
    const url = linkOf(b);
    const when = Date.parse(decode(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date') || ''));
    return { title, url, source, date: Number.isFinite(when) ? new Date(when).toISOString() : null };
  }).filter((h) => h.title && /^https:\/\//.test(h.url) && ABOUT_GTA6.test(h.title));
};

const fetchFeed = async ({ name, url }) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return parseFeed(text.slice(0, MAX_BYTES), name);
  } catch (err) {
    console.error(`headlines: ${name} failed: ${err.message}`);
    return [];
  } finally {
    clearTimeout(timer);
  }
};

const dedupeKey = (h) => h.title.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 60);

const createHeadlines = () => {
  let state = { items: [], updatedAt: null };

  const refresh = async () => {
    const all = (await Promise.all(FEEDS.map(fetchFeed))).flat();
    const now = Date.now();
    const seen = new Set();
    const items = all
      .filter((h) => !h.date || now - Date.parse(h.date) <= MAX_AGE_MS)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .filter((h) => {
        const k = dedupeKey(h);
        if (seen.has(k) || seen.has(h.url)) return false;
        seen.add(k);
        seen.add(h.url);
        return true;
      })
      .slice(0, KEEP);
    // Keep the previous list if every feed failed this round.
    if (items.length || !state.items.length) state = { items, updatedAt: new Date().toISOString() };
    console.log(`headlines: ${items.length} GTA 6 items from ${FEEDS.length} feeds`);
  };

  refresh();
  setInterval(refresh, REFRESH_MS).unref();

  return { get: () => state };
};

export { createHeadlines };

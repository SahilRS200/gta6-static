// PlayStation Network status for India, read from Sony's public status feed and cached.
// India sits in the SCEE region feed; each service carries its own list of active incidents.
const FEED_URL = 'https://status.playstation.com/data/statuses/region/SCEE.json';
const COUNTRY = 'IN';
const CACHE_MS = 120_000;
const TIMEOUT_MS = 6000;
const PREFERRED_LOCALES = ['en-GB', 'en-US', 'en-IN'];

const pickMessage = (status) => {
  const messages = status?.message?.messages || {};
  const key = PREFERRED_LOCALES.find((l) => messages[l]) || Object.keys(messages)[0];
  return key ? String(messages[key]).slice(0, 280) : '';
};

const summarize = (feed) => {
  const country = (feed.countries || []).find((c) => c.countryCode === COUNTRY);
  if (!country) return { ok: false, reason: 'India not found in the status feed' };
  const incidents = (list) => (list || []).map((s) => ({ type: s.statusType, since: s.startDate, message: pickMessage(s) }));
  return {
    ok: true,
    country: country.countryName,
    countryIncidents: incidents(country.status),
    services: (country.services || []).map((s) => ({
      id: s.serviceId,
      name: s.i18n?.['en-GB'] || s.serviceName,
      incidents: incidents(s.status),
    })),
  };
};

const createPsnStatus = () => {
  let cache = null;
  let inflight = null;

  const refresh = async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(FEED_URL, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      cache = { at: Date.now(), body: { ...summarize(await res.json()), checkedAt: new Date().toISOString(), source: 'https://status.playstation.com/' } };
    } catch (err) {
      const stale = cache?.body;
      cache = { at: Date.now(), body: stale ? { ...stale, stale: true } : { ok: false, reason: 'Status feed unreachable', checkedAt: new Date().toISOString(), source: 'https://status.playstation.com/' } };
      console.error('PSN status fetch failed:', err.message);
    } finally {
      clearTimeout(timer);
    }
    return cache.body;
  };

  const get = async () => {
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.body;
    inflight ||= refresh().finally(() => { inflight = null; });
    return inflight;
  };

  return { get };
};

export { createPsnStatus };

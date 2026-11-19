// "Day N since launch", shared by the server (first paint) and the browser (kept current).
// GTA 6 launched in India on Thu 19 Nov 2026 (IST), which counts as Day 1.
const LAUNCH_DAY_UTC = Date.UTC(2026, 10, 19);
const DAY_MS = 24 * 3600 * 1000;

const istDateParts = (ms) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(ms));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return Date.UTC(get('year'), get('month') - 1, get('day'));
};

const dayNumber = (now = Date.now()) => Math.max(1, Math.round((istDateParts(now) - LAUNCH_DAY_UTC) / DAY_MS) + 1);

const dayLabel = (now = Date.now()) => `Day ${dayNumber(now)} since launch`;

export { dayNumber, dayLabel };

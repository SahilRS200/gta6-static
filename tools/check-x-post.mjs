// The news agent's gate for X posts. The GitHub Action that posts social/x-post.md has no checks of its
// own (owner decision), so everything is checked here, before the agent commits. Zero dependencies.
//
//   node tools/check-x-post.mjs --slot   Is now a posting slot? Exit 0: yes, write the post (and it prints
//                                        the recently posted sources so the agent doesn't repeat one).
//                                        Exit 3: not a slot — leave social/x-post.md alone this run.
//   node tools/check-x-post.mjs          Is social/x-post.md ready to post? Exit 0: yes. Exit 1: no, with
//                                        every reason listed.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const FILE = 'social/x-post.md';
const NEWS_DIR = 'content/news';
const FIRST_HOUR = 6; // 06:xx IST
const LAST_HOUR = 22; // 22:xx IST — the last slot before 23:59 (the agent runs at :35 IST)
const MAX_WEIGHT = 280;
const MAX_TAGS = 6;
const REQUIRED_TAGS = ['#GTA6', '#GTAVI', '#ViceCity'];
const BANNED_TAGS = ['#RockstarGames', '#GrandTheftAuto', '#GTA6Trailer', '#LuciaAndJason'];
const SIGN_OFF = 'gta6info (link in bio)';
const FRESH_MS = 90 * 60 * 1000;
const CLOCK_SKEW_MS = 2 * 60 * 1000;
const RECENT = 12;
// Anything X would turn into a link and bill as a link post ($0.20 instead of $0.015): a scheme, "www.", or any
// domain shape — a word, a dot, then two or more letters (gta6info.in, x.ai, rockstar.games, bit.ly …). X links
// every real top-level domain, so this blocks them all rather than listing some. Numbers like 1.02 or $1.65 pass.
const URL_RE = /https?:\/\/|www\.|\b[a-z0-9-]+\.[a-z]{2,}\b/i;
const NOT_SLOT = 3;

const istParts = (ms) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
};

const isSlotHour = (hour) => hour % 2 === 0 && hour >= FIRST_HOUR && hour <= LAST_HOUR;

const git = (...args) => {
  try { return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; }
};

// A shallow clone (as cloud sandboxes often make) would hide earlier posts from the repeat checks, so fetch the
// full history first. Best effort: if it fails, the checks still see whatever history is there.
const ensureHistory = () => {
  if (git('rev-parse', '--is-shallow-repository') === 'true') git('fetch', '--unshallow', '--quiet');
};

const parse = (raw) => {
  const m = String(raw).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const data = Object.fromEntries(m[1].split(/\r?\n/).map((l) => l.match(/^(\w+):\s*(.*)$/)).filter(Boolean).map((x) => [x[1], x[2].trim()]));
  return { data, body: m[2].trim() };
};

// Length the way X counts it: an emoji (or flag) is 2, U+FE0F is 0, Latin and common punctuation are 1,
// other scripts (CJK and similar) are 2.
const weightOf = (text) => {
  let weight = 0;
  for (const { segment } of new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text.normalize('NFC'))) {
    if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(segment)) { weight += 2; continue; }
    for (const ch of segment) {
      const cp = ch.codePointAt(0);
      if (cp === 0xfe0f) continue;
      weight += cp <= 4351 || (cp >= 8192 && cp <= 8205) || (cp >= 8208 && cp <= 8223) || (cp >= 8242 && cp <= 8247) ? 1 : 2;
    }
  }
  return weight;
};

// Sources of the most recent posts, newest first, from the file's own git history.
const recentSources = () => git('log', `-${RECENT}`, '--format=%H %cI', '--', FILE).split('\n').filter(Boolean).map((line) => {
  const [hash, when] = line.split(' ');
  return { when, source: parse(git('show', `${hash}:${FILE}`))?.data.source || '?' };
});

const slotCheck = () => {
  const now = istParts(Date.now());
  if (!isSlotHour(now.hour)) {
    console.log(`NOT A SLOT: it is ${String(now.hour).padStart(2, '0')}:xx IST. Posts go out only in even IST hours 06–22. Leave ${FILE} alone.`);
    return NOT_SLOT;
  }
  const last = git('log', '-1', '--format=%cI', '--', FILE);
  if (last) {
    const prev = istParts(Date.parse(last));
    if (prev.date === now.date && prev.hour === now.hour) {
      console.log(`NOT A SLOT: ${FILE} was already committed in this hour (${last}). Leave it alone.`);
      return NOT_SLOT;
    }
  }
  console.log(`POSTING SLOT (${String(now.hour).padStart(2, '0')}:xx IST): write ${FILE} if there is something new; otherwise skip.`);
  const recent = recentSources();
  console.log(recent.length ? `Recently posted (newest first), don't repeat these:\n${recent.map((r) => `  ${r.when}  ${r.source}`).join('\n')}` : 'Nothing posted yet.');
  return 0;
};

const postCheck = () => {
  if (!existsSync(FILE)) { console.log(`FAIL: ${FILE} does not exist.`); return 1; }
  const post = parse(readFileSync(FILE, 'utf8'));
  if (!post) { console.log(`FAIL: ${FILE} needs a front-matter block (slot, source) and then the post text.`); return 1; }
  const problems = [];
  const { slot = '', source = '' } = post.data;
  const text = post.body;
  const now = Date.now();

  // schedule
  const at = Date.parse(slot);
  if (!/\+05:30$/.test(slot) || Number.isNaN(at)) problems.push('slot: must be the IST clock, e.g. 2026-11-19T18:35:00+05:30');
  else {
    if (at > now + CLOCK_SKEW_MS) problems.push('slot: is in the future; take it from the clock');
    if (now - at > FRESH_MS) problems.push('slot: is more than 90 minutes old');
    if (!isSlotHour(istParts(at).hour)) problems.push('slot: is not in an even IST hour between 06 and 22');
  }
  const nowIst = istParts(now);
  if (!isSlotHour(nowIst.hour)) problems.push(`now is ${nowIst.hour}:xx IST, outside the posting slots: don't commit ${FILE} now`);

  // source
  const slug = source.match(/^\/news\/([a-z0-9-]+)\/$/)?.[1];
  if (!source.startsWith('/')) problems.push('source: must be the site path the post is built from, e.g. /news/<slug>/');
  else if (slug && !readdirSync(NEWS_DIR).some((f) => f.endsWith(`-${slug}.md`))) problems.push(`source: no post in ${NEWS_DIR} has the slug "${slug}"`);

  // text
  const weight = weightOf(text);
  const tags = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  const lower = tags.map((t) => t.toLowerCase());
  if (!text) problems.push('text: empty');
  if (weight > MAX_WEIGHT) problems.push(`text: ${weight} characters as X counts them (limit ${MAX_WEIGHT}); trim the text, not the wanted tags`);
  const link = text.match(URL_RE);
  if (link) problems.push(`text: contains a URL or domain ("${link[0]}"); write "gta6info" without the dot`);
  if (tags.length > MAX_TAGS) problems.push(`hashtags: ${tags.length} (max ${MAX_TAGS})`);
  for (const t of REQUIRED_TAGS) if (!lower.includes(t.toLowerCase())) problems.push(`hashtags: missing ${t}`);
  for (const t of BANNED_TAGS) if (lower.includes(t.toLowerCase())) problems.push(`hashtags: ${t} is not allowed`);
  if (new Set(lower).size !== lower.length) problems.push('hashtags: a tag is repeated');
  if (!text.includes(SIGN_OFF)) problems.push(`text: must include "${SIGN_OFF}"`);

  // repeats: never the same text as the last post, never the same source as a recent one
  const prev = parse(git('show', `HEAD:${FILE}`));
  if (prev && prev.body === text) problems.push('text: identical to the previous post');
  const recent = recentSources().map((r) => r.source);
  if (recent.includes(source) && prev?.data.source !== source) problems.push(`source: ${source} was posted recently; pick something new or skip the slot`);
  if (prev?.data.source === source && prev.body !== text) problems.push(`source: ${source} is the same story as the previous post; pick something new or skip the slot`);

  console.log(`${problems.length ? 'FAIL' : 'OK'}: ${weight}/${MAX_WEIGHT} characters, ${tags.length} hashtags, source ${source || '(none)'}`);
  for (const p of problems) console.log(`  - ${p}`);
  return problems.length ? 1 : 0;
};

export { weightOf, parse, isSlotHour, URL_RE };

const run = () => { ensureHistory(); process.exitCode = process.argv.includes('--slot') ? slotCheck() : postCheck(); };
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run();

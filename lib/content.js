// News posts: Markdown files with a small front-matter block, rendered at boot. Zero dependencies.
//
// content/news/2026-11-17-some-slug.md
// ---
// title: Headline (keep it under ~100 characters)
// description: One-sentence summary for search results and share cards
// date: 2026-11-17T19:00:00+05:30
// updated: 2026-11-17T21:00:00+05:30        (optional)
// tags: [india, release-time, ps5]
// type: guide                                 (optional: news (default) | guide | fix — decides which hubs list it)
// status: workaround                          (fixes only: open | workaround | fixed in patch 1.02)
// spoiler: true                               (optional: the post discusses story events)
// sources:
//   - Business Today | https://www.businesstoday.in/...
// ---
// Markdown body: ## headings, - lists, 1. lists, > quotes, **bold**, *italic*, `code`, [links](https://…)
//
// Files starting with "_" are drafts and are skipped.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const FRONT_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const FILE_RE = /^(\d{4}-\d{2}-\d{2})-([a-z0-9-]+)\.md$/;
const WORDS_PER_MIN = 220;
const POST_TYPES = new Set(['news', 'guide', 'fix']);
// A timestamp later than "now" (an agent guessing or rounding up the time) is shown as the moment the
// server loaded it, so the site never claims an update from the future.
const notFuture = (d) => (d.getTime() > Date.now() ? new Date() : d);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const slugify = (s) => String(s).toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const unquote = (s) => s.trim().replace(/^["']|["']$/g, '');

const parseValue = (raw) => {
  const v = raw.trim();
  if (v.startsWith('[') && v.endsWith(']')) return v.slice(1, -1).split(',').map(unquote).filter(Boolean);
  return unquote(v);
};

const parseFrontMatter = (text) => {
  const m = text.match(FRONT_RE);
  if (!m) return null;
  const data = {};
  let listKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && listKey) { data[listKey].push(item[1].trim()); continue; }
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!kv) continue;
    if (kv[2].trim() === '') { listKey = kv[1]; data[listKey] = []; } else { listKey = null; data[kv[1]] = parseValue(kv[2]); }
  }
  return { data, body: m[2] };
};

const inline = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>')
  .replace(/`(.+?)`/g, '<code>$1</code>')
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
    const external = /^https?:\/\//.test(url);
    return `<a href="${url}"${external ? ' rel="noopener" target="_blank"' : ''}>${text}</a>`;
  });

const BLOCK_START = /^(#{2,3}\s|\s*[-*]\s+|\s*\d+\.\s+|>)/;

const renderMarkdown = (md) => {
  const lines = md.replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  const collect = (re) => {
    const items = [];
    while (i < lines.length && re.test(lines[i])) { items.push(lines[i].replace(re, '')); i += 1; }
    return items;
  };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }
    const h = line.match(/^(#{2,3})\s+(.*)$/);
    if (h) {
      out.push(`<h${h[1].length} id="${slugify(h[2])}">${inline(h[2])}</h${h[1].length}>`);
      i += 1;
    } else if (/^\s*[-*]\s+/.test(line)) {
      out.push(`<ul>${collect(/^\s*[-*]\s+/).map((t) => `<li>${inline(t)}</li>`).join('')}</ul>`);
    } else if (/^\s*\d+\.\s+/.test(line)) {
      out.push(`<ol>${collect(/^\s*\d+\.\s+/).map((t) => `<li>${inline(t)}</li>`).join('')}</ol>`);
    } else if (/^>\s?/.test(line)) {
      out.push(`<blockquote><p>${inline(collect(/^>\s?/).join(' '))}</p></blockquote>`);
    } else {
      const para = [];
      while (i < lines.length && lines[i].trim() && !BLOCK_START.test(lines[i])) { para.push(lines[i].trim()); i += 1; }
      out.push(`<p>${inline(para.join(' '))}</p>`);
    }
  }
  return out.join('\n');
};

const parseSource = (line) => {
  const [label, url] = line.split('|').map((s) => s.trim());
  return url && /^https?:\/\//.test(url) ? { label, url } : null;
};

const toPost = (file, text) => {
  const name = file.match(FILE_RE);
  const parsed = parseFrontMatter(text);
  if (!name || !parsed) throw new Error(`${file}: expected YYYY-MM-DD-slug.md with a front-matter block`);
  const { data, body } = parsed;
  for (const key of ['title', 'description', 'date']) if (!data[key]) throw new Error(`${file}: missing "${key}"`);
  const date = notFuture(new Date(data.date));
  const updated = data.updated ? notFuture(new Date(data.updated)) : date;
  if (Number.isNaN(date.getTime()) || Number.isNaN(updated.getTime())) throw new Error(`${file}: bad date`);
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    slug: name[2],
    title: data.title,
    description: data.description,
    date: date.toISOString(),
    updated: updated.toISOString(),
    tags: (Array.isArray(data.tags) ? data.tags : [data.tags]).filter(Boolean).map(slugify),
    type: POST_TYPES.has(data.type) ? data.type : 'news',
    status: data.type === 'fix' && typeof data.status === 'string' ? data.status.trim() : '',
    spoiler: data.spoiler === 'true',
    sources: (data.sources || []).map(parseSource).filter(Boolean),
    html: renderMarkdown(body),
    minutes: Math.max(1, Math.round(words / WORDS_PER_MIN)),
  };
};

const loadPosts = async (dir) => {
  let files = [];
  try { files = await readdir(dir); } catch { return []; }
  const posts = [];
  for (const file of files) {
    if (file.startsWith('_') || !file.endsWith('.md')) continue;
    posts.push(toPost(file, await readFile(join(dir, file), 'utf8')));
  }
  const slugs = new Set();
  for (const p of posts) {
    if (slugs.has(p.slug)) throw new Error(`duplicate post slug "${p.slug}"`);
    slugs.add(p.slug);
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date));
};

// The AI brief: one Markdown file the news agent rewrites every run.
const loadBrief = async (file) => {
  try {
    const parsed = parseFrontMatter(await readFile(file, 'utf8'));
    if (!parsed) return null;
    const updated = notFuture(new Date(parsed.data.updated));
    return {
      updated: Number.isNaN(updated.getTime()) ? null : updated.toISOString(),
      headline: parsed.data.headline || '',
      html: renderMarkdown(parsed.body),
    };
  } catch {
    return null;
  }
};

// Small agent-maintained content files (alert line, India hub blocks, What's next tracker):
// front matter as data, Markdown body as HTML. Missing or broken file → null, never a crash.
const loadDoc = async (file) => {
  try {
    const parsed = parseFrontMatter(await readFile(file, 'utf8'));
    if (!parsed) return null;
    const updated = parsed.data.updated ? notFuture(new Date(parsed.data.updated)) : null;
    return {
      data: parsed.data,
      updated: updated && !Number.isNaN(updated.getTime()) ? updated.toISOString() : null,
      html: renderMarkdown(parsed.body),
    };
  } catch {
    return null;
  }
};

const tagsOf = (posts) => {
  const counts = new Map();
  for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag, count]) => ({ tag, count }));
};

export { loadPosts, loadBrief, loadDoc, tagsOf, renderMarkdown, inline, slugify, esc };

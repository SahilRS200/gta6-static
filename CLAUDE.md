# GTA6Info.in — agent guide

Fan-run GTA 6 news + countdown site for India. Zero-dependency Node server (`server.js`), deployed on
Railway from `main` (every push redeploys in ~30 s). Live at https://www.gta6info.in.

## Hourly news agent — standing authorization (owner, 2026-11-18)

The scheduled news agent may **commit and push to `main` without asking**, within these rules.

### Every run
1. `git pull --rebase origin main`.
2. Search the web for GTA 6 news from the **last few hours** (launch status, patches, server/PSN issues,
   reviews, India price or availability, records, Rockstar announcements).
3. Read `content/news/` first. **Never repeat a story already covered** — update the existing post
   instead (bump `updated:`) when there is a real development.
4. Write **0–2 posts**. If nothing new and verifiable happened, **commit nothing**. An empty hour is fine.
5. Run the checks below, then commit and push.

### Posts (`content/news/YYYY-MM-DD-slug.md`)
Front matter: `title`, `description`, `date` (ISO with `+05:30`), optional `updated`, `tags: [a, b]`,
`sources:` as `  - Label | https://url`. Body is simple Markdown (`##`, lists, `**bold**`, links).
- **Every factual claim needs a linked source.** At least one source per post, from a real outlet.
- Label rumours and leaks as rumours in the headline or first paragraph. Say "reported" when it is.
- Headlines can be punchy, but must be true and delivered by the article. No fake urgency.
- India-first: times in IST, prices in ₹, link to `/gta-6-india/`, `/gta-6-release-time/india/`.
- Title must not start with a quote character. Keep titles under ~110 characters.
- Never copy text from other sites; write original summaries. Never link piracy, APKs, cracks,
  or grey-market account/code sellers. No story spoilers in titles or descriptions.

### Code changes
Allowed when they serve the news (e.g. updating the quick-FAQ answers in `lib/partials.js`, the
"What India is asking" list in `public/index.html`, facts on `/gta-6-india/` or the price page).
Do **not** redesign the layout, touch `server.js` security (API guard, CSP, rate limit), add
dependencies, or change Railway/Docker config. Use fat-arrow functions, no `any`-style shortcuts.

### Checks before every push (all must pass, otherwise do not push)
```sh
for f in server.js lib/*.js public/js/*.js public/sw.js; do node --check "$f" || exit 1; done
PORT=8099 DATA_DIR=/tmp/gta6-data node server.js &   # must print "gta6 site on :8099"
sleep 3 && curl -sf http://localhost:8099/ >/dev/null && curl -sf http://localhost:8099/news/ >/dev/null \
  && curl -sf http://localhost:8099/sitemap.xml >/dev/null; kill %1
```
Also open each new post URL locally and confirm it returns 200.

### Commits
One commit per run: `content: <what changed>` (or `fix:` / `feat:` for code). Never force-push,
never rewrite history, never commit secrets or `data/`. If `git push` is rejected, pull --rebase once
and retry; if it fails again, stop.

## Layout
`content/news/*.md` posts · `lib/` server renderers (news, partials, psn, headlines, counter) ·
`public/` static site (`js/app.js`, `css/site.css`) · `server.js` routes, API guard, sitemaps.

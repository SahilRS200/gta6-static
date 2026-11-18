# GTA6Info.in — agent guide

Fan-run GTA 6 news + countdown site for India. Zero-dependency Node server (`server.js`), deployed on
Railway from `main` (every push redeploys in ~30 s). Live at https://www.gta6info.in.

## Hourly news agent — standing authorization (owner, 2026-11-18)

The scheduled news agent may **commit and push to `main` without asking**, within these rules.

### Every run
1. `git pull --rebase origin main`.
2. **Research, India first, then global.** Run several searches, not one:
   - **India angle (priority during launch week):** quick-commerce and retail (Blinkit, Zepto, Instamart,
     Amazon/Flipkart, Croma, Sony Center, Games The Shop), ₹ prices and offers, stock, midnight store
     openings, Indian streamers and creators, Indian ISPs/download speeds, PS Store India issues, UPI or
     payment problems, Hindi/Hinglish queries ("GTA 6 kab aayega", "GTA 6 price").
   - **What is trending on social:** search for what people are posting about GTA 6 on X/Twitter, Reddit
     (r/GTA6, r/IndianGaming), Instagram and YouTube — memes, viral clips, brand stunts, outages.
     Social posts are **leads, not sources**: publish only what a real outlet or the official account
     confirms, and link that.
   - **Global:** unlock status by region, patches, PSN/Xbox outages, reviews and scores, sales records,
     Rockstar/Take-Two/Sony statements. Sites worth checking: IGN, Eurogamer, VGC, Kotaku, GameSpot,
     Beebom, Digit, Gizbot, Business Standard, Business Today, NDTV Gadgets 360, IGN India.
3. Read `content/news/` first. **Never repeat a story already covered** — update the existing post
   instead (bump `updated:`) when there is a real development.
4. Write **0–3 posts**. Aim for at least one India-angle story per run while launch week lasts
   (through 25 Nov 2026), then balance India and global. If nothing new and verifiable happened,
   write no post.
5. **Rewrite the AI Brief** (`content/brief.md`) — see below. Do this every run, even with no new post,
   unless nothing at all changed since the last brief.
6. **SEO pass** — see below.
7. Run the checks, then commit and push.

### AI Brief (`content/brief.md`) — the floating "✦ AI Brief" panel on every page
A tight, skimmable answer to "what's hot right now and what should I do?" for an Indian player.
- Front matter: `updated:` (ISO, `+05:30`, the time of this run) and `headline:` (one sentence, under
  ~110 characters, the single most important thing right now).
- Body: 2–3 `##` sections with emoji headings, e.g. `## 🔥 Hot in India right now`,
  `## ✅ Do this now` (only while it is actionable), `## 🌍 Around the world`. 2–4 bullets each.
- Each bullet: a **bold lead**, one or two plain sentences, then a link — to our own post or page when
  one exists (`[What to know →](/news/slug/)`), otherwise to the source outlet by name.
- Keep the whole brief under ~170 words of body text. Lead with India. Drop items older than a day
  unless still the top story. No rumours without the word "rumoured". No spoilers.
- After launch, shift it from "prepare" to "what's happening": server status, first reactions, scores,
  India sales/stock, tips for the first hours.

### SEO pass (every run, small and safe)
- New posts: title leads with the keyword people search ("GTA 6 …"), description 120–190 characters
  with the answer in it, 3–6 lowercase tags reusing existing ones where they fit.
- Link new posts from one or two older related posts, and from the brief.
- Keep facts current across the site when something changes: quick-FAQ answers in `lib/partials.js`,
  the homepage FAQ and "What India is asking" list in `public/index.html`, `/gta-6-india/`,
  `/gta-6-price-in-india/`. If you change a visible FAQ, change its JSON-LD twin to match.
- Bump `dateModified` in the homepage JSON-LD to today when the homepage changed.
- After launch, fix stale tense ("unlocks at" → "unlocked at") on the pages you touch.
- Never keyword-stuff, never write a headline the article does not deliver, never invent a fact.

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
`content/news/*.md` posts · `content/brief.md` AI brief · `lib/` server renderers (news, partials, psn, headlines, counter) ·
`public/` static site (`js/app.js`, `css/site.css`) · `server.js` routes, API guard, sitemaps.

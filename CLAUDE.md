# GTA6Info.in — agent guide

Fan-run GTA 6 companion for players in India: hourly news, spoiler-free guides, fixes, a "What's next"
tracker and a separate India hub. **The front page is the AI Brief at `/ai/`** — the root URL 301s there —
and the old homepage (carousel, blocks, FAQ) lives at `/home/`. GTA 6 launched on 19 Nov 2026; the countdown is gone (product spec:
`docs/POST_LAUNCH_REVAMP.md`). Zero-dependency Node server (`server.js`), deployed on Railway from
`main` (every push redeploys in ~30 s). Live at https://www.gta6info.in.

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
     confirms, and link that. **Don't drop a lead just because it came from social:** when a trend shows
     up (viral clips, "first driving clips", a meme, an outage), run one follow-up search for outlet
     coverage of it before deciding.
   - **The game itself (every run from launch day, 18 Nov 2026, onward; owner rule):** at least one
     search on how the game plays — gameplay and first impressions, player reactions, performance and
     frame rate (PS5 / PS5 Pro / Xbox), graphics, features and systems players are discovering, tips for
     the first hours, Rockstar developer interviews. This is what players care about most once they are
     in the game; don't let logistics and business news crowd it out. No story spoilers.
   - **Global:** unlock status by region, patches, PSN/Xbox outages, reviews and scores, sales records,
     Rockstar/Take-Two/Sony statements. Sites worth checking: IGN, Eurogamer, VGC, Kotaku, GameSpot,
     Beebom, Digit, Gizbot, Business Standard, Business Today, NDTV Gadgets 360, IGN India.
3. Read `content/news/` first. **Never repeat a story already covered** — update the existing post
   instead (bump `updated:`) when there is a real development.
4. Write **0–3 posts**. Aim for at least one India-angle story per run while launch week lasts
   (through 25 Nov 2026), then balance India and global. If nothing new and verifiable happened,
   write no post.
   **Pick posts by player relevance (owner rule, 2026-11-18):** with only 3 slots, choose the stories
   players will care about most. From launch day onward, at least one post per run should be about the
   player experience (gameplay, performance, reactions, tips) when such news exists, rather than filling
   every slot with business or logistics news (stock prices, analyst forecasts). Finding two passable
   stories is not a reason to stop researching; finish all the search categories first.
5. **Rewrite the AI Brief** (`content/brief.md`) — see below. Do this every run, even with no new post,
   unless nothing at all changed since the last brief.
6. **Keep the site content files current** (`content/alert.md`, `content/india.md`,
   `content/whats-next.md`) and the status of every fix — see "Site content files" below.
7. **X post, only in a posting slot** — run `node tools/check-x-post.mjs --slot`; follow "X posts"
   below. Outside a slot, leave `social/x-post.md` alone.
8. **SEO pass** — see below.
9. Run the checks, then commit and push.

### Post types: news, guides, fixes
Every post is a Markdown file in `content/news/` and keeps its `/news/<slug>/` URL whatever its type.
The `type:` front-matter field only decides which hubs list it.
- `type: news` (or no `type:`) — a story that happened. Listed on `/news/`.
- `type: guide` — answers "how do I…?" (save, lose the cops, cheats, settings, camera, streaming). Listed
  on `/guides/`, grouped into sections **by tag**; give every guide one section tag:
  `police` / `wanted-level` / `combat` / `weapons` → Police and combat · `camera` / `controls` →
  Controls and camera · `cheats` / `money` / `progress` → Money and progress · `performance` /
  `settings` → Settings and performance · `streaming` / `youtube` → Streaming · `tips` /
  `first-hours` / `saving` / `beginner` → First hours. A guide with none of these lands in "More guides".
- `type: fix` — answers "why is it broken?" (padlock, won't start, PSN errors, crashes, lost saves, bugs).
  Listed on `/fixes/`. **Needs `status:`**: `open` (no fix yet), `workaround` (something the player can
  do now), or `fixed: <how>` / `fixed in patch 1.02`. Change the status, with a source, when it changes.
- **Guides and fixes are living posts.** When there's a development (a patch fixes a bug, a better
  workaround appears), **update the existing guide or fix** and bump its `updated:` instead of writing a
  new post. Write a new one only for a new question or a new problem.
- `spoiler: true` — only for a post that discusses story events. Its title and description must still be
  spoiler-free; the body is hidden behind a "Show it" button and the post is hidden from lists, the
  ticker, search and AI Brief links until a reader switches spoilers on. Prefer not to write these.

### Site content files (news agent)
Small Markdown files the site reads at every deploy. Timestamps follow the same clock rule as posts.
- `content/alert.md` — the one-line banner on top of every page. `text:` (one sentence: the most
  urgent thing right now — a patch, an outage, a common gotcha), `link:` (a path on this site),
  `label:` (link text), `updated:`. Leave `text:` empty to hide the banner. Change it only when
  something more urgent than the current line exists.
- `content/india.md` — the India hub (`/gta-6-india/`) and the India slide/block on `/home/`.
  `headline:` (the India story of the hour, one sentence), `price:` (the one-line price shown under
  it), `updated:`. Body: `##` sections, each becomes a card — keep **🛒 Buy it**, **🎮 PS5 and Xbox**,
  **📺 Indian creators and streams**, **🇮🇳 Playing from India**. 2–4 bullets each, bold lead plus a link
  to our post (which carries the source). Prices only with a source; stock and offers go stale fast —
  remove a bullet rather than leave it wrong. Plain store links only, no affiliate links.
- `content/whats-next.md` — the `/whats-next/` tracker. `items:` rows are
  `Name | Status | Date | Link | Note`; `patches:` rows are `Date | Version | Platforms and size | Link`.
  Status is exactly one of **Confirmed · Reported · Rumoured · Not announced**; "Confirmed" only when
  Rockstar or the platform said so, with a linked post. A row with status Confirmed **and** a full
  date-time (`2027-03-01T00:00:00+05:30`) gets a live countdown automatically; never invent a date.
  Every new patch gets a `patches:` row. **Never put a `|` inside a field** (it splits the row); write
  "Xbox Series X/S".
- FAQs live in `lib/faq.js` (the `/home/` FAQ, Hinglish India FAQ, the floating quick answers). One entry
  feeds both the visible FAQ and its JSON-LD, so they can't drift; every answer must link a post or page
  that carries its source.

### AI Brief (`content/brief.md`) — the `/ai/` page, the floating "✦ AI Brief" panel and the home slide
A tight, skimmable answer to "what's hot right now and what should I do?" for an Indian player.
- Front matter: `updated:` (the output of `TZ=Asia/Kolkata date +%Y-%m-%dT%H:%M:00+05:30`, never a guessed or rounded time) and `headline:` (one sentence, under
  ~110 characters, the single most important thing right now).
- `search: [a, b, c, d]` — 2–4 short search terms (1–3 words, what a player would type) for the hottest
  topics this hour, **India first**, in the same order as the brief, e.g. `search: [PM Modi, fuel, save]`.
  They become the always-visible header search's placeholder ("Search GTA 6 — try “PM Modi”") and its
  "Trending in India" chips. Each term must appear in the title, description or tags of one of our posts —
  the site silently drops a term that finds nothing. Refresh it every run with the brief.
- Body: 2–4 `##` sections with emoji headings, chosen from `## 🔥 Hot in India`,
  `## ✅ Try this today` (a tip or guide worth doing now), `## 🛠️ Fix of the day` (only when a real
  problem is hitting players; link the fix) and `## 🌍 Around the world`. 2–4 bullets each; skip a
  section that has nothing.
- Each bullet: a **bold lead**, one or two plain sentences, then a link — to our own post or page when
  one exists (`[What to know →](/news/slug/)`), otherwise to the source outlet by name.
- Keep the whole brief under ~170 words of body text. Lead with India. Drop items older than a day
  unless still the top story. No rumours without the word "rumoured". No spoilers.
- The game is out: no "prepare" or "unlocks at" items. Write about what's happening and what to do:
  problems and fixes, patches, tips, reactions, India sales/stock and creators.
- **Rank by impact, then write (owner rule, 2026-11-18).** Build the brief from scratch each run; don't
  reshuffle last hour's bullets. List every candidate (this run's new posts, still-live older stories,
  actions) and judge each on: how many Indian players it reaches, how new it is (new this run wins ties),
  and whether it needs action or a decision soon. The **top item becomes the `headline:` and the first
  bullet**. The `headline:` is the **giant headline of the front page** (`/ai/`, where every visit to the root URL lands) and the bold box in the `/home/` hero, so it carries the **most bombastic
  verified news in the whole brief**: the record, the outage, the shock number, the thing people will
  share. Make it punchy and lead with the number or the superlative, but it must stay true and sourced.
  Never spend the headline on a routine reminder ("unlocks at midnight") when bigger news exists. The `/home/` carousel shows only the headline and the first 3 bullets, so those 4 lines
  must carry the most important news.
- **Headline freshness (owner rule, 2026-11-18).** Rank candidates against each other, not against
  last hour's headline. The `headline:` may not stay on the same story for more than **2 runs in a row**
  if this run found any verified new story; check `git log -p content/brief.md` to see how long the
  current headline has been up. At least one of the headline and first 3 bullets must be new this run
  whenever this run published a post. A big old number (a record from hours ago) can move to
  "Around the world" instead of being dropped.
- **Every India-relevant post published this run goes in the brief.** A big new India story (top Indian
  creators, India price/stock/delivery, India outages or payment problems, Indian brand stunts) goes in
  the headline or first bullet, not lower down.
- The bold lead names the **thing**, not just the people ("YouTube's 24-hour GTA 6 stream, with 4 Indian
  creators", not "Ajju Bhai, Payal, Mythpat"), so a skimmer gets the story from the bold text alone.

### SEO pass (every run, small and safe)
- New posts: title leads with the keyword people search ("GTA 6 …"), description 120–190 characters
  with the answer in it, 3–6 lowercase tags reusing existing ones where they fit.
- Link new posts from one or two older related posts, and from the brief.
- Keep facts current across the site when something changes: the FAQs in `lib/faq.js`,
  `content/india.md`, `content/whats-next.md`, `content/alert.md`, the price page
  (`public/gta-6-price-in-india/`) and fix statuses. The `dateModified` on `/ai/` and `/home/` is set automatically
  from the newest post — don't edit it.
- Fix stale tense ("unlocks at" → "unlocked at") and launch-week wording on the pages you touch.
- Never keyword-stuff, never write a headline the article does not deliver, never invent a fact.

### Posts (`content/news/YYYY-MM-DD-slug.md`)
**Timestamps: read the clock, never type a time.** Get the current IST time with
`TZ=Asia/Kolkata date +%Y-%m-%dT%H:%M:00+05:30` and use exactly that for `date:`, `updated:` and the brief's
`updated:`. Never round up, never estimate when the commit will land, never use a future time.

Front matter: `title`, `description`, `date` (ISO with `+05:30`), optional `updated`, `tags: [a, b]`,
optional `type: news | guide | fix`, `status:` (fixes only), optional `spoiler: true`,
`sources:` as `  - Label | https://url`. Body is simple Markdown (`##`, lists, `**bold**`, links).
- **Every factual claim needs a linked source.** At least one source per post, from a real outlet.
- Label rumours and leaks as rumours in the headline or first paragraph. Say "reported" when it is.
- Headlines can be punchy, but must be true and delivered by the article. No fake urgency.
- India-first: times in IST, prices in ₹, link to `/gta-6-india/` and the relevant guide or fix. The
  `/gta-6-release-time/*` pages are a launch archive now; don't link them as countdowns.
- Title must not start with a quote character. Keep titles under ~110 characters.
- Never copy text from other sites; write original summaries. Never link piracy, APKs, cracks,
  or grey-market account/code sellers. No story spoilers in titles or descriptions.

### Code changes
Allowed when they serve the news (e.g. updating FAQ answers in `lib/faq.js`, facts on the price page,
the content files above).
Do **not** redesign the layout, touch `server.js` security (API guard, CSP, rate limit), add
dependencies, or change Railway/Docker config. Use fat-arrow functions, no `any`-style shortcuts.

### Checks before every push (all must pass, otherwise do not push)
```sh
for f in server.js lib/*.js public/js/*.js public/sw.js; do node --check "$f" || exit 1; done
PORT=8099 DATA_DIR=/tmp/gta6-data node server.js &   # must print "gta6 site on :8099"
sleep 3 && for u in /ai/ /home/ /news/ /guides/ /fixes/ /whats-next/ /gta-6-india/ /sitemap.xml /search-index.json; do
  curl -sf "http://localhost:8099$u" >/dev/null || { echo "FAIL $u"; exit 1; }; done; kill %1
# only when this commit changes social/x-post.md (news agent, posting slot):
node tools/check-x-post.mjs || exit 1
```
Also open each new post URL locally and confirm it returns 200.

### Commits
One commit per run: `content: <what changed>` (or `fix:` / `feat:` for code). Never force-push,
never rewrite history, never commit secrets or `data/`. If `git push` is rejected, pull --rebase once
and retry; if it fails again, stop.

## Hourly SEO agent — standing authorization (owner, 2026-11-18)

A second scheduled agent runs at **:35** past each hour (the news agent runs at :05). It may commit and
push to `main` without asking, within these rules. **It does not write news and does not rewrite the
AI Brief** — that is the news agent's job.

### Every run
1. `git pull --rebase origin main`. If the latest commit is under 10 minutes old and starts with
   `content:`, the news agent may still be deploying — that is fine, just work on top of it.
2. Start the site locally and run the audit:
   ```sh
   PORT=8099 DATA_DIR=/tmp/gta6-data node server.js &   # wait for "gta6 site on :8099"
   node tools/seo-audit.mjs http://localhost:8099
   ```
3. Also audit production: `node tools/seo-audit.mjs https://www.gta6info.in` (read-only). A difference
   between local and production usually means a deploy is still rolling out — note it, don't "fix" it.
4. Fix every ERROR. Fix WARNINGs when the fix is clearly an improvement.
5. Then do **one improvement pass** (pick the highest-value items, small and safe):
   - **Titles and descriptions:** keyword first ("GTA 6 …"), true, 120–190 character descriptions that
     contain the answer. No two pages may share a title or description.
   - **Internal links:** every post should be linked from at least one related post body (not only from
     listings). Add a natural "Related:" sentence or link where it helps the reader.
   - **Tags:** merge near-duplicates (e.g. `pre-orders` vs `preload`, `launch` vs `launch-day`) by editing
     the posts' tags; keep tags lowercase and meaningful.
   - **Freshness:** fix stale wording on evergreen pages (`/gta-6-india/` via `content/india.md`,
     `/gta-6-price-in-india/`, `/guides/`, `/fixes/`, `/whats-next/`, the FAQs in `lib/faq.js`),
     e.g. "unlocks at" → "unlocked at". FAQ JSON-LD is generated from the same entry as the visible FAQ.
   - **Hubs:** every guide should carry a section tag (see "Post types") so it isn't stuck in "More
     guides"; every fix needs a `status:`. Adding a tag is fine; changing a fix's status is the news
     agent's job (it needs a source) — flag it in the commit message instead.
   - **Structured data:** keep JSON-LD valid and truthful. `dateModified` on `/ai/` and `/home/` is automatic.
   - **Search demand:** look up what Indian players are searching for about GTA 6 right now
     (e.g. "GTA 6 kab aayega", "GTA 6 price", "GTA 6 download size", "GTA 6 PS4"). If an existing page
     answers it but doesn't say so plainly, improve that page's title, description or FAQ. If no page
     answers it, **leave a note in the commit message** for the news agent rather than writing a post.
6. Run the pre-push checks (below) and the audit again; it must exit 0. Commit once with message
   `seo: <what changed>` and push. If nothing needed changing, make no commit.

### SEO agent must not
- Write or delete news posts, change a post's facts or sources, or rewrite `content/brief.md`.
- Keyword-stuff, add hidden text, invent FAQ answers, or write titles the page doesn't deliver.
- Change layout, design, `server.js` security (API guard, CSP, rate limit), dependencies, or deploy config.
- Change URLs/slugs of published pages (that breaks links and rankings).
- Touch anything in `social/` (a change to `social/x-post.md` posts to X immediately).

## X (Twitter) — @gamerinfo_in

The owner's plan for the account is `docs/SOCIAL_X_PLAN.md`: vision ("India's own gamer channel. GTA 6
first. Every game next."), cadence, post format, hashtags and guardrails. Rules for the hourly agents:

- **Never call the X API tools.** `.mcp.json` loads an X API server (`xapi`, read-only) into every cloud
  session in this repo. Every X read is billed per post returned, and the plan's guardrail is "never read
  from X". Research what's trending on X with WebSearch, the same as any other site.
- **The only way anything reaches X is `social/x-post.md`.** A GitHub Action
  (`.github/workflows/post-to-x.yml`) posts that file **the moment a commit changes it**, with no checks of
  its own (owner decision). So: only the news agent writes it, only in a posting slot, only after the
  checker passes (below). The SEO agent never touches `social/`. Never call an X API any other way.

### X posts (news agent, owner decision 19 Nov 2026)
One post every 2 hours from 06:00 to 23:59 IST. You run at :35 IST, so the slots are 06:35, 08:35 …
22:35 IST (9 a day). **You are the only gate** between this file and a public post.

1. **Schedule.** Every run: `node tools/check-x-post.mjs --slot`. Exit 0 means this run is a posting slot
   (an even IST hour 06–22, not used yet); anything else means **do not touch `social/x-post.md` this run**.
   Never edit the file outside a slot, and never to fix a typo after it went out: any change is a new post.
2. **Pick.** The brief's `headline:` story by default. If that story was already posted (`--slot` lists
   the recent sources), take the newest post in `content/news/` that hasn't been posted. If neither is new,
   **skip the slot**: write nothing. Never repeat a post, never pad with filler. India stories first when
   they are the hottest.
3. **Write** `social/x-post.md` in the plan's format ("What to post" in `docs/SOCIAL_X_PLAN.md`):

   ```
   ---
   slot: <output of TZ=Asia/Kolkata date +%Y-%m-%dT%H:%M:00+05:30>
   source: /news/<slug>/
   ---
   <hook line> <emoji>

   <the key fact, with the number>

   Also:
   <emoji> <extra tip or detail>
   <emoji> <extra tip or detail>
   <emoji> <extra tip or detail>

   Full guide: gta6info (link in bio)

   #GTA6 #GTAVI #ViceCity #PS5 #Xbox #IndianGaming
   ```

   - **Every number and claim must be in the source post and its `sources:`.** Never add a fact the site
     doesn't carry. Spoiler-free; rumours labelled "rumoured".
   - **No URL and no domain anywhere** (a link costs $0.20 instead of $0.015): write `gta6info` without the
     dot, never `gta6info.in`, never tricks like `[dot]`.
   - **Hashtags (owner rules):** up to 6; always `#GTA6 #GTAVI #ViceCity`; `#PS5 #Xbox` when it applies to
     console players; `#IndianGaming`. Never invent tags (`#GTA6Tips`), never `#RockstarGames`,
     `#GrandTheftAuto`, `#GTA6Trailer`, `#LuciaAndJason`. Trim the text before dropping a wanted tag.
4. **Check.** `node tools/check-x-post.mjs` must exit 0. It counts characters the way X does (limit 280;
   emoji count 2) and checks the URL, hashtag, sign-off, schedule and repeat rules. Fix and re-run until it
   passes. If you can't make it pass, put the file back (`git checkout -- social/x-post.md`) and skip the
   slot.
5. **Commit** it in the run's single commit, and add `x: <hook line>` to the commit message.

## Layout
`tools/seo-audit.mjs` SEO audit · `content/news/*.md` posts, guides and fixes · `content/brief.md` AI brief ·
`content/alert.md`, `content/india.md`, `content/whats-next.md` site content files · `lib/` server
renderers (`news.js` posts and lists, `hubs.js` guides/fixes/what's next/home blocks, `faq.js` every FAQ,
`partials.js` header and footer, `render.js` release-time archive and sitemap, psn, headlines, counter) ·
`public/` static site (`js/app.js`, `css/site.css`) · `server.js` routes, API guard, sitemaps, search index.

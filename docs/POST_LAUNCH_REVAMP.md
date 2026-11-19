# GTA6Info.in — post-launch revamp (product + UX spec)

**Status:** proposal, awaiting owner sign-off on the open decisions in §10.
**Written:** 19 Nov 2026 (launch day), for the engineer (Opus) who will build it.
**Scope:** what the site becomes now that GTA 6 is out. This is a product and UX spec, not a code
design. Where it names files, that is to point at what exists today, not to prescribe the solution.

---

## 1. Why change

The site was built around one question: *when does GTA 6 unlock where I live?* That question died at
midnight. Everything a visitor sees first today (countdown slide, unlock wave, 30 countdowns, unlock
schedule, the "PS5 unlocks at local midnight" banner, the "Countdowns" and "PS5 Time Zone" nav
items) now answers a question nobody is asking.

What people ask after launch, and what the hourly news agent is already writing about:

| Player question | Evidence in `content/news/` today |
|---|---|
| "How do I do X?" | how to save, wanted level, cheats, first-person, tips, how long to beat |
| "Why is it broken?" | locked / not starting fix, PSN sign-in error, bugs and glitches, 30 vs 60 fps |
| "What's happening?" | reviews, sales, records, Modi post, creators, streams |
| "What about India?" | price, PS5 demand, delivery, Hindi, celebrity launch, Indian creators |
| "What's next?" | GTA Online not at launch, patches, PC (unanswered so far) |

The content already moved on. The site's structure has not. The revamp makes the structure match.

## 2. New positioning

> **GTA6Info.in is the Indian player's GTA 6 companion: what's new, how to do it, how to fix it —
> spoiler-safe, in plain language, updated every hour.**

Three things make it different from IGN or a wiki, and every feature below should serve one of them:

1. **India-first.** IST, ₹, Indian stores, Indian creators, Indian network and payment problems.
2. **Fast and light.** Text-first, no ads wall, works on a cheap phone on mobile data, installable.
3. **Spoiler-safe by default.** A player 5 hours in can browse everything without the story ruined.

## 3. Product principles

- **Answer first.** Every page opens with the answer in one or two lines, then the detail.
- **Hubs are views, not new content.** Guides, Fixes and India are curated lists over the same posts
  the agents already write. No second content system.
- **No published URL changes or dies.** Every existing URL keeps returning 200 with useful content.
- **Nothing is invented.** Same sourcing rules as today. A tracker row without a source says
  "not announced".
- **Agent-maintainable.** If a feature needs a human to keep it fresh, it is cut or simplified until
  the hourly agents can maintain it from Markdown.
- **Zero dependencies, free tier.** No database, no accounts, no build step. Same as today.

## 4. Information architecture

### 4.1 Navigation (header)

| Today | After |
|---|---|
| Home · News · GTA 6 India · Price ₹ · Countdowns · PS5 Time Zone · Stream It | Home · **News** · **Guides** · **Fixes** · **What's next** · **GTA 6 India** (visually distinct) |

- **GTA 6 India stays a first-class, visually distinct tab** (flag, accent colour, always last and
  always visible, including on mobile where other items may collapse).
- Price ₹ moves inside the India hub. Stream It moves under Guides. Countdowns and PS5 Time Zone
  leave the nav.
- PS Live Status stays in the header: it is more useful after launch than before.
- The floating AI Brief and FAQ buttons stay.

### 4.2 Page map

| URL | Status | Becomes |
|---|---|---|
| `/` | rework | Companion home (§5.1) |
| `/news/` | keep | Unchanged, plus type filter chips |
| `/guides/` | **new** | Guides hub (§5.2) |
| `/fixes/` | **new** | Fixes hub (§5.3) |
| `/whats-next/` | **new** | Tracker: Online, PC, patches, DLC (§5.4) |
| `/gta-6-india/` | rework | India hub (§5.5) |
| `/gta-6-price-in-india/` | keep | Refresh to "where to buy today", linked from India hub |
| `/gta-6-release-time/<zone>/` ×30 | convert | "It's out" archive pages (§5.6) |
| `/guides/ps5-time-zone/` | keep | Add a top note: launch is over, kept for reference. Out of nav |
| `/guides/stream-gta-6-ps5-youtube-twitch/` | keep | Listed in Guides hub |
| `/news/<slug>/`, `/tag/<tag>/`, feeds, sitemaps | keep | Unchanged URLs |

### 4.3 Content model: one new field

Add an optional `type:` to post front matter: `news` (default), `guide`, or `fix`.

- Post URLs stay `/news/<slug>/` for all types. The type only decides which hubs list the post.
- A second optional field, `spoiler: true`, marks posts that reveal story content (§6.1).
- Backfill the existing posts once (roughly: how-to, tips, wanted level, save, cheats, first-person,
  how long to beat → `guide`; locked, PSN error, bugs, system update → `fix`).
- Guides and fixes are **living posts**: the agent updates them in place and bumps `updated:`
  instead of writing a new post for each development.

## 5. Page-by-page UX

### 5.1 Home

**Removed entirely:** countdown slide, unlock wave, stats strip ("launch at a glance"), all 30
countdowns, pins, unlock schedule table, the top "PS5 unlocks at local midnight" banner copy.

**Hero carousel** (same component, same 5 s autoplay, same full-screen mode and share link):

| # | Tab | Content |
|---|---|---|
| 1 | ✦ AI Brief | As today |
| 2 | News | As today |
| 3 | **Guides** | 5–6 most recently updated guides, one line each |
| 4 | **Fixes** | Top 3–4 fixes + the PS Live Status row (merge of today's PS and Quick help slides) |
| 5 | **🇮🇳 India** | India headline of the hour, price line, 3 latest India-tagged posts |

The page `<h1>` moves from the countdown slide to the hero: something like
**"GTA 6 India: news, guides and fixes, updated every hour"**.

**Below the hero**, in this order (desktop: two columns where marked; mobile: single column):

```
┌──────────────────────────────────────────────────────────────┐
│ header: brand · PS Live Status · nav (… · 🇮🇳 GTA 6 India)      │
├──────────────────────────────────────────────────────────────┤
│ thin banner: latest patch / top alert (agent-written, 1 line) │
├──────────────────────────────────────────────────────────────┤
│ HERO CAROUSEL  [AI Brief][News][Guides][Fixes][India]         │
├──────────────────────────────────────────────────────────────┤
│ news ticker (as today, full width now the wave is gone)       │
├───────────────────────────────┬──────────────────────────────┤
│ START HERE                    │ SOMETHING BROKEN?            │
│ 6 guide cards                 │ 4 fix rows + PS status        │
├───────────────────────────────┴──────────────────────────────┤
│ 🇮🇳 GTA 6 IN INDIA  — price · where to buy · India news · hub → │
├──────────────────────────────────────────────────────────────┤
│ WHAT'S NEXT  — 4 tracker rows (Online, PC, next patch, DLC)   │
├──────────────────────────────────────────────────────────────┤
│ Spoiler shield (keep, shortened) · FAQ (rewritten, §7)        │
└──────────────────────────────────────────────────────────────┘
```

- **Top banner** becomes a one-line, agent-written alert stored in content (not hardcoded): latest
  patch, a known outage, or the day's biggest story. Empty value hides the banner.
- **"Day N" marker** replaces the countdown's emotional hook: a small "Day 3 since launch" chip in
  the hero. Cheap, always true, and gives returning visitors a sense of time.

### 5.2 Guides hub (`/guides/`)

- Answers "how do I…". Lists every `type: guide` post plus the two static guides.
- Grouped by simple, spoiler-free sections chosen by tag: **First hours · Controls and camera ·
  Money and progress · Police and combat · Settings and performance · Streaming**.
- Each row: title, one-line answer (the post description), "updated" time, spoiler badge if set.
- Empty sections are hidden. No section is created just to look complete.

### 5.3 Fixes hub (`/fixes/`)

- Answers "why is it broken". Opens with the **PS Live Status** block, because the first question
  is always "is it me or is it Sony?".
- Then `type: fix` posts as a symptom list, phrased the way people search: *"GTA 6 locked / won't
  start"*, *"PSN sign-in error"*, *"lost my save"*, *"stuck at 30 fps"*.
- Each row shows a status chip maintained by the agent in front matter: `open`, `workaround`,
  `fixed in patch X`. This is the page's main value over a search result.
- FAQPage structured data built from the rows.

### 5.4 What's next (`/whats-next/`)

The countdown's successor: the site's reason to be checked again next week.

- A short tracker table, one Markdown content file the news agent maintains:

  | Item | Status | Date | Source |
  |---|---|---|---|
  | GTA Online | Not at launch | Not announced | linked post |
  | PC version | Not announced | — | — |
  | Next patch | … | … | … |
  | Story DLC | Not announced | — | — |

- Status vocabulary is fixed: **Confirmed · Reported · Rumoured · Not announced**. Anything not
  "Confirmed" is visibly labelled.
- **If a row ever gets a confirmed date, it automatically gets a countdown** (the existing countdown
  component, reused). That is the only place a countdown survives, and only when there is a real
  date. Until then the page shows no timers.
- A "Patch notes" list under the table: every patch as one line with date, platforms, size and a
  link to the post.

### 5.5 GTA 6 India hub (`/gta-6-india/`)

The separate focus area the owner asked for. It is the home page for an Indian visitor.

| Block | Content | Maintained by |
|---|---|---|
| Hero | "GTA 6 is out in India" + Day N + India headline of the hour | agent |
| Buy it | Price ₹, editions, where to buy today (PS Store, Xbox, Amazon, Flipkart, quick commerce), stock notes | agent, sourced |
| PS5 / Xbox availability | Console stock and price pointers | agent, sourced |
| India news | Latest posts tagged `india` | automatic |
| Indian creators and streams | Who is streaming, links to the relevant posts | agent |
| Playing from India | Download size and data use, known ISP or payment (UPI) issues, Hindi/language support | agent |
| Hinglish FAQ | Rewritten for post-launch (§7) | agent |

- Remove the countdown and the full-screen extras panel from this page; the hero becomes a normal
  content hero.
- The India tab on the home carousel and the India block on the home page both link here.

### 5.6 The 30 release-time pages

These have search history and inbound links. They are converted, not deleted.

- Each becomes a short archive page: **"GTA 6 is out in <place>. It unlocked at <local time> on
  <date>."**, the Day N chip, then links to News, Guides, Fixes and (for India) the India hub.
- Remove the live countdown, full-screen button and the full-screen extras panel from them.
- Drop their sitemap priority and take them out of the footer's long link list (one "Release times
  archive" link instead, pointing to a simple index).
- Titles and descriptions change to past tense. JSON-LD must match the visible text.

### 5.7 Full-screen mode

- **Keep on the home carousel.** It becomes a "live board" (AI Brief, News, Guides, Fixes, India)
  with the existing silent refresh and new-content bubble. Useful on a second screen while playing
  or streaming.
- **Retire on single-countdown pages** (India hub, city pages), since there is no timer to show.
  `?fs=1` on those URLs should simply load the normal page.

## 6. New features

### 6.1 Spoiler-safe mode (P0)

- Posts with `spoiler: true` show a badge in every list, and their titles and descriptions must
  themselves be spoiler-free (already an agent rule).
- On the post page, the body is hidden behind a single "This post discusses story events. Show it"
  button. The choice is per post, not remembered globally.
- A site-wide toggle "Hide spoiler posts" (stored in the browser, default **on**) removes them from
  lists, ticker and AI Brief links.

### 6.2 Search (P1)

A single search box over post titles, descriptions and tags, from a small JSON index the server
builds at boot. Client-side filtering, no dependency. With 40+ posts and growing by the hour, lists
alone stop working within a week.

### 6.3 "Live now" slot for the owner's stream (P1, needs decision §10)

A config-driven hero slide and India-hub block that embeds one YouTube live stream when a stream id
is set, and disappears when it is not. Requires a CSP change for YouTube frames, which is
security-sensitive and therefore owner-approved, not agent-editable.

### 6.4 Day N and "since you last visited" (P1)

- Day N chip (see §5.1).
- On return visits, mark posts newer than the last visit with a small "new" dot (browser storage
  only). Reuses the dot style from the full-screen tabs.

### 6.5 Later (P2, do not build now)

- Hindi or Hinglish versions of the top guides.
- Progress checklist (missions, collectibles) stored in the browser. Blocked on reliable,
  spoiler-safe source data; do not attempt from guesswork.
- Weekly "what changed" digest post, agent-written.
- Share cards (per-post Open Graph images).

## 7. Copy and SEO changes

- **Home title/description:** drop "Release Time", "Live Countdown", "how to play early". Lead with
  "GTA 6 India: news, guides, fixes". Keep "price ₹" for as long as it gets searched.
- **FAQs (home, India hub, quick FAQ popup):** remove pre-launch questions (when does it unlock, can
  I play early, preload). Replace with what is being searched now, each answered from an existing
  post: how to save, is there Hindi, is Online out, 60 fps on PS5, PS4/mobile/PC availability, game
  not starting. Visible FAQ and JSON-LD twin must stay identical.
- **Tense pass:** every "unlocks at" becomes "unlocked at" across evergreen pages.
- **Structured data:** add CollectionPage for the three new hubs; keep NewsArticle on posts; add
  FAQPage on Fixes.
- **Sitemap:** new hubs at high priority; city pages lowered.
- **PWA manifest:** name, description and shortcuts change from countdown to News, Guides, Fixes,
  India. Bump the service-worker cache version so installed apps pick up the new shell.
- **`llms.txt`, About page, footer sources:** rewrite to the new positioning; footer sources become
  general (Rockstar, PlayStation status) instead of release-time articles.

## 8. Agent rulebook changes (`CLAUDE.md`)

The hourly agents keep this site alive, so the rulebook changes with the product:

- Teach `type:` and `spoiler:` front matter, and the "update the living guide/fix instead of writing
  a new post" rule.
- Fix status chips (`open`, `workaround`, `fixed in patch X`) and who may change them (news agent,
  with a source).
- New agent-maintained content: the top banner line, the What's-next tracker file, the India hub's
  buy/stock/creators blocks.
- AI Brief sections shift from launch night to steady state: **Hot in India · Try this today ·
  Fix of the day · Around the world**. Drop launch-week quotas ("at least one India story per run
  through 25 Nov") after that date.
- SEO agent: add the new hubs to its freshness list; remove the pre-launch freshness items.
- Unchanged: sourcing rules, timestamp rule, security/deploy/dependency limits, no URL changes.

## 9. Delivery plan

Ship in phases, each a separate commit that leaves the site working. Each phase passes the existing
gates: `node --check`, local smoke test, `tools/seo-audit.mjs` exit 0, Playwright pass on desktop,
tablet, phone portrait and phone landscape, secret scan.

| Phase | Contents | Why this order |
|---|---|---|
| **1. Clear the stage** | Remove countdown/wave/zones/schedule/stats from home; new H1 and title; nav change; banner becomes content-driven; tense pass; convert city pages; retire single-page full screen | Removes everything visibly stale in one go |
| **2. Hubs** | `type:` field + backfill; `/guides/`, `/fixes/`; new carousel tabs; home "Start here" and "Something broken?" blocks; news type chips | Gives the freed space a purpose |
| **3. India hub** | Rework `/gta-6-india/` per §5.5; India carousel tab and home block; price page refresh | The owner's named focus area |
| **4. What's next + spoilers** | Tracker page and home block; spoiler mode | Retention features |
| **5. Rulebook + PWA + SEO sweep** | `CLAUDE.md`, both routine prompts, manifest, sw cache, llms.txt, sitemap priorities | Must land right after 2–4 so agents maintain the new surfaces |
| **6. P1 extras** | Search, Day N / new dots, Live-now slot (if approved) | Independent, can slip |

Notes for the build:

- Dead code goes with the feature: pins, zone sorting, wave rendering, schedule rendering and their
  CSS should be deleted, not hidden. Keep the countdown component itself for §5.4.
- Agents push to `main` every hour at :05 and :35. Pull with rebase before every push, and land the
  rulebook change (phase 5) promptly so the agents do not keep "fixing" removed sections.
- Phase 1 changes agent-edited files (`public/index.html` FAQ, `lib/partials.js` quick FAQ). Expect
  merge conflicts with agent commits; keep the commit small and fast.

## 10. Open decisions for the owner

1. **City pages:** convert to archive pages (recommended, §5.6), or 301 all 30 to one page? Convert
   keeps rankings and links; redirect is tidier but throws away history.
2. **Live-now stream slot (§6.3):** build it? It needs a CSP relaxation for YouTube embeds.
3. **Affiliate links on "where to buy":** allowed (with a visible disclosure), or plain links only?
4. **Hindi/Hinglish guides (P2):** wanted, and if so who reviews the language quality?
5. **Community channel:** is there a Telegram/WhatsApp/Discord to link from the India hub, or is RSS
   the only follow option for now?

## 11. What success looks like

Measured with what exists (visit counter, Railway request logs) plus Search Console once set up:

- Share of visits landing on guide or fix posts, not only news.
- Returning visits across the first two post-launch weeks (does anyone come back without a timer?).
- Search impressions for "GTA 6 <how-to / error>" queries in India.
- India hub visits as a share of all visits.

## 12. Out of scope

Accounts, comments or a forum · interactive maps or any Rockstar-owned art · mod, cheat-tool, piracy
or account-selling content · new dependencies or a database · changing any published post URL.

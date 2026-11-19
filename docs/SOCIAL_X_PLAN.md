# X (Twitter) plan — @gamerinfo_in

Status (19 Nov 2026): **the account is live and has two posts, both published by hand from a Claude
chat through Typefully. No automation is built yet; the owner has decided how it will work (see
"Auto-posting"), and the build is planned for the weekend of 21–22 Nov.** This file records what the owner has decided,
what is still only a recommendation, and what was learned publishing the first posts (see
"Publishing playbook"), so an agent can be updated from it. Items marked
**Decided** came from the owner; items marked **Recommended** are proposals the owner has not confirmed.
Ask before building anything marked Recommended.

## Vision

- **India's own gamer channel. GTA 6 first. Every game next.** GTA6Info.in is the start; the account
  and brand will widen to other games later.
- The handle is deliberately generic (`@gamerinfo_in`) so it never needs renaming when new games arrive.
  The display name and avatar carry GTA 6 for now.
- The X account exists to send Indian players to the site and build a following that outlives the
  GTA 6 launch spike.

## The account (Decided, set up 19 Nov 2026)

| Field | Value |
|---|---|
| Handle | `@gamerinfo_in` |
| Display name | `GTA6 Info \| gta6info.in` (X's sign-up form rejected the domain; it was added afterwards in Edit profile) |
| Website field | `https://www.gta6info.in` (canonical host is `www`; the bare domain 301s there) |
| Location | India |
| Avatar | Neon sunset with palms, `gta6info.in/ai` on a dark plate, `GAMER INFO` subtext (made in a Claude chat, not in this repo) |
| Banner | 1500×500: India flag aligned with "INDIA'S OWN GAMER CHANNEL / GTA 6 first. Every game next.", Indian skyline (India Gate, Charminar), controller in a sunset (not in this repo) |

Bio (recommended text; the live profile may still show the bare `gta6info.in/ai`):

```
Unofficial GTA 6 news, tips & fixes. Updated every hour. No spoilers.
🇮🇳 GTA 6 for India: prices, stock, PS5 fixes, creators
🎮 https://www.gta6info.in/ai
```

Keep the word **Unofficial**: it guards against impersonation reports on a GTA-named account.

A second **travel account** was discussed. **Recommended: park it.** The site has no travel content to
feed it, and reposting GTA news there breaks X's duplicate-content rule (below).

## X rules that constrain this (checked Nov 2026)

- One phone number can be on **up to 10 accounts**; each account needs its own email.
- Multiple accounts must have **different, non-duplicative purposes**. Never post the same or
  near-identical content from two of the owner's accounts.
- Automated activity is the account owner's responsibility; spammy automation gets posts filtered or
  the account suspended.
- New accounts get a **cold start of roughly 2–4 weeks** with limited reach.
- X's **Plus subscription (₹759/month) does not include API access.** Recommended: skip it for now;
  revisit when link posts start, if they get poor reach.

## API pricing (from X's own pricing table, 19 Nov 2026)

Pay-per-use credits bought in the X Developer Console. No free tier, no subscription.

| Action | Cost |
|---|---|
| Post: Create (no URL) | $0.015 per request |
| Content: Create with URL | **$0.200** per request |
| Posts: Read | $0.005 per post returned |
| User: Read | $0.010 per user returned |
| Content: Create — summoned reply (replying where we were mentioned) | $0.010 per request |
| Article: Draft / Publish | $0.010 per request |

What counts as a link post (from third-party write-ups; confirm with the first real post):
- Anything shaped like a domain counts, even without `https://` (`gta6info.in/abc` bills as a URL).
- Our own domain gets no exemption. Putting the link in a reply does not avoid the fee.
- One URL or three costs the same $0.20.
- Posts made by hand in the X app are **not** billed. Profile fields (bio, website, display name) are free.

## Cadence and cost

**Decided (owner's mix):**
- **Hot-news posts every 2 hours, 06:00 to 00:00 IST** (10 a day), no URL, ending with
  `More at gta6info (link in bio)`. About $0.15 a day.
- **Two curated "flashy" link posts a day, about 12 hours apart**, with the URL embedded. About $0.40 a day.
- Total about **$0.55 a day, about $16.50 a month**.

**Recommended (not yet confirmed):** run **phase 1** (hot-news posts only, about **$5 a month**) for the
first 3–4 weeks while the account is in cold start, then switch on the link posts once posts regularly
reach a few hundred impressions. Build the link posts behind an on/off switch so this is a config change.

Start with a **$10 credit top-up** (covers about 18 days of the full mix) and check the real burn rate.

Rough traffic expectation (estimates, not data): about 50–300 site visits from X in month 1; about
300–2,000 a month by months 2–3 if the account builds a few hundred followers; spikes on big news days.

## What to post

### Hot-news posts (every 2 hours)

- **Source (Recommended):** the `headline:` in `content/brief.md`. It is already the most important
  verified line of the hour, original wording, under ~110 characters (see the AI Brief rules in
  `CLAUDE.md`). If the headline has not changed since our last post, fall back to the title of the
  newest post in `content/news/` that we have not posted yet. If neither is new, **skip the slot**;
  never repeat a post or pad with filler.
- **Format:**

  ```
  <hook line> <emoji>

  <the key fact, with the number>

  Also:
  <emoji> <extra tip or detail>
  <emoji> <extra tip or detail>
  <emoji> <extra tip or detail>

  Full guide: gta6info (link in bio)

  <hashtags, see "Hashtags" below>
  ```

  The first real news post, as published (about 274 weighted characters, with a card image):

  ```
  Broke in GTA 6? 💸

  Shipwreck dives: ~$1,400 for the first wreck, up to ~$4,000 later. Fastest money.

  Also:
  🏚️ Raid gang hideouts
  🚗 Sell cars at Pay 'n' Spray
  📬 Check your mailbox for pay

  Full guide: gta6info (link in bio)

  #GTA6 #GTAVI #ViceCity #PS5 #Xbox #IndianGaming
  ```

- **No URL and no domain anywhere in the text**, so each post bills at $0.015. Write `gta6info`
  without the dot. Avoid tricks like `gta6info[dot]in`; they read as spam on a new account.
- Hashtags follow the owner's rules in "Publishing playbook → Hashtags" (up to 6). Never stuff hashtags.
- Stay under 280 characters, counted the way X counts them (see the playbook).

### Flashy link posts (2 a day, phase 2)

- A sharper hook written for clicks, plus the **full canonical URL** of the specific post or of `/ai/`
  (`https://www.gta6info.in/news/<slug>/`). The site's Open Graph and `summary_large_image` tags make
  it unfurl as a large card.
- Spend these slots on the stories people share (trailer, date news, records, confirmed leaks,
  big India stories), not on a fixed slot with whatever is lying around.
- Punchy but **true and sourced**: the content rules in `CLAUDE.md` apply in full (no fake urgency, no
  spoilers, rumours labelled "rumoured", no piracy or grey-market links).

## Auto-posting: owner decisions (19 Nov 2026, evening) and the build

**Decided (owner):**
- **The hourly news agent decides the post.** The same agent that writes the AI Brief and the news picks
  and writes the hot-news post, following "What to post" and the "Publishing playbook" rules.
- **Every 2 hours between 06:00 and 23:59 IST.** The agent runs at :35 IST, so the slots are 06:35,
  08:35 … 22:35 IST: 9 posts a day. (This replaces the earlier "06:00 to 00:00, 10 a day".)
- **Posts go to X through the X API, not Typefully** (Typefully is too expensive). How the agent's
  decision reaches X is open (owner: "a git action, another agent, whatever"); it must actually post.
- No hosted MCP/API wrapper is needed unless the design below fails.

**Proposed build (planned for the weekend, 21–22 Nov 2026; confirm before switching on):**

1. **The agent writes the post to a file.** On news runs whose IST hour is even and between 06 and 22,
   the agent writes `social/x-post.md`: front matter `slot:` (the clock, IST), `source:` (the post path it
   is built from), then the post text. If neither the headline nor an unposted post is new since the last
   `social/x-post.md`, it **skips the slot** (writes nothing). It never writes the file at other hours.
2. **Its push triggers a GitHub Actions workflow** (`.github/workflows/post-to-x.yml`,
   `on: push` to `main`, `paths: social/x-post.md`, plus `workflow_dispatch`, one-at-a-time concurrency).
3. **A zero-dependency script** (`tools/post-to-x.mjs`, Node built-ins, fat-arrow functions) validates and
   posts. It refuses to post (and fails the job) unless: weighted length ≤ 280 (emoji 2, U+FE0F 0); no URL
   or domain in the text; ≤ 6 hashtags including `#GTA6 #GTAVI #ViceCity`; none of the banned tags; the
   `slot:` is less than 90 minutes old and inside 06:00–23:59 IST; the text differs from the previous post.
   It posts with `POST https://api.x.com/2/tweets`, signed with **OAuth 1.0a user context** (Node `crypto`).
4. **Off switch:** posts only when the repo variable `X_POSTING` is `on`; otherwise it prints the post in
   the job log (dry run). Run a day of dry runs before switching on.
5. **No retries.** Any API error (including out-of-credit) fails the job; GitHub emails the owner. X also
   rejects exact duplicates itself.
6. **Text only first.** Card images (playbook step 4) need X's media upload; add them once text posting
   is stable.

**Why not post from the Claude routine directly:** the token PR #1 set up is an app Bearer token, which can
only read. A posting token acts as `@gamerinfo_in` and belongs in GitHub's encrypted secrets, not in an AI
sandbox; OAuth 1.0a user tokens don't expire, so there is no refresh flow to maintain.

**What the owner does (about 15 minutes):**
1. X Developer Console → the app → set permissions to **Read and Write**.
2. Generate the **Access Token and Secret** for `@gamerinfo_in` (after the permission change, so they
   carry write access).
3. GitHub → repo Settings → Secrets and variables → Actions: add `X_API_KEY`, `X_API_SECRET`,
   `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`; add the variable `X_POSTING` = `off`.
4. Keep API credits topped up: 9 text posts a day × $0.015 ≈ $0.14 a day, about $4 a month.
5. After a day of dry-run logs, set `X_POSTING` = `on`.

## Recommended build (superseded by "Auto-posting" above; kept for history)

- **Do not add a third research agent.** The hourly news agent already does the research and writes
  the headline; the X job only republishes what it produced.
- **One zero-dependency script** in `tools/` (e.g. `tools/post-to-x.mjs`), Node built-ins only, fat-arrow
  functions, matching this repo's rules. It reads `content/brief.md` and `content/news/`, builds the
  post, and sends it with the X API.
- **Run it from GitHub Actions on a schedule**, not from the Claude scheduled tasks: those sandboxes
  probably cannot reach `api.x.com` (likely, not verified), and Actions is free for a public repo.
  Suggested times, after the news agent (:05) has finished: **:20 past even hours IST**
  (cron `50 0-18/2 * * *` in UTC = 06:20, 08:20 … 00:20 IST). Link posts, if on, at about
  09:50 and 21:50 IST. Actions cron can run a few minutes late; that is fine.
- **Secrets** (X API keys and tokens) go in GitHub Actions secrets. **Never commit them**: this repo is
  public.
- **Dry run by default** (`DRY_RUN=1` prints the post and does not send it). Go live only after the
  owner has seen a day of dry-run output.
- **De-duplication state must not be committed to `main`**, because every push to `main` redeploys the
  site. Keep it in the Actions cache or on a separate branch.
- **Typefully** (a scheduling app) is connected to the owner's Claude account and linked to
  `@gamerinfo_in` (social set id `367940`). **The owner used it to publish the first two posts.** It was
  first considered and not chosen for automation (it adds a subscription and a middleman); whether the
  automated posts go through Typefully or straight to the X API is now an open decision (below).

## Publishing playbook (learned from the first posts, 19 Nov 2026)

Owner-approved process from publishing the welcome post and news post #1. Follow it for every post
until automation replaces a step; anything marked **Owner rule** came from the owner directly.

### Posts published so far

| # | When (IST) | Post | URL |
|---|---|---|---|
| 0 | 19 Nov 2026, 14:08 | Welcome post ("Namaste, gamers 🇮🇳🎮 … India's own gamer channel is live"), text only | https://x.com/gamerinfo_in/status/2123335114176565324 |
| 1 | 19 Nov 2026, 14:20 | Money guide: shipwreck dives up to ~$4,000, with a card image | https://x.com/gamerinfo_in/status/2123338012134347174 |

The welcome post should be pinned to the profile (owner does this by hand in the X app).

### Steps, in order

1. **Pick the story.** `git pull`, read `content/brief.md`; the `headline:` is the default pick. Open the
   post it links to in `content/news/` and **check every number and claim against that post and its
   `sources:`** before writing. Never add a fact the site doesn't carry.
2. **Write the text** to the format in "What to post": hook line, the key fact with its number, an
   "Also:" list of 2–3 extra tips from the same post, `Full guide: gta6info (link in bio)`, then hashtags.
   No URL or domain in the text.
3. **Count characters the way X does** before saving: emoji count as 2, other characters as 1, emoji
   variation selectors (U+FE0F) as 0. The limit is 280. The first draft of post #1 was 298 and had to be
   trimmed, so always count; never eyeball it.
4. **Make a card image** (1200×675 PNG): the site's neon-sunset style (purple-pink-orange gradient,
   sunset, dark sea or skyline), a small label pill (e.g. `MONEY GUIDE`), the hook in large white type,
   the key number in yellow `#ffe14d`, a short subline, and the footer `gta6info.in · GAMER INFO`.
   Font: Poppins Bold. Render SVG → PNG (`rsvg-convert`), then **look at the PNG** and fix overlaps
   before uploading (post #1's first render had a wave line through the footer text). A domain inside
   the image is fine: only the post text is billed for URLs.
5. **Upload the image to Typefully with alt text.** Alt text describes the card and repeats the hook
   and number (X reads it as text). Upload is a presigned S3 PUT to
   `typefully-user-uploads.s3.amazonaws.com`; the owner has allowed that host for Claude sessions. If the
   upload is blocked, do not retry another way: save the draft text only and tell the owner.
6. **Save as a Typefully draft first**, never publish straight away. Put the source post path and its
   outlets in the draft's scratchpad.
7. **Show the owner the exact final text, image and hashtags, and wait for an explicit "publish".**
   Publishing cannot be undone. Any edit after approval (even adding a tag) needs a fresh "publish".
8. **Publish, then confirm** by reading the draft back until `status` is `published`, and record the
   X URL in the table above.
9. **After publishing:** reply to early comments within the first hour (author replies are a strong
   reach signal on a new account).

### Hashtags (Owner rules)

- **Up to 6 hashtags.** More reads as spam on a new account.
- Always: **`#GTA6 #GTAVI #ViceCity`** (the owner insisted `#ViceCity` stays).
- Platforms: **`#PS5 #Xbox`** when the post applies to console players (most do).
- India: **`#IndianGaming`** (the most-used Indian gaming tag; `#GamingIndia` is the smaller variant).
- **Trim the post text before dropping a wanted tag** (post #1 cut "Fastest early money." to
  "Fastest money." to fit).
- Don't invent tags (e.g. `#GTA6Tips`, `#GTA6Money`): only use tags with real, visible use. The owner
  rejected narrow made-up tags in favour of broad gaming and India tags.
- Avoid `#RockstarGames` and `#GrandTheftAuto` (they signal official announcements on an unofficial
  account) and dated trailer or story tags (`#GTA6Trailer`, `#LuciaAndJason`).
- No search tool shows live X trends; review X Analytics after a few days of posts and adjust the set
  from real impressions.

### X post fields beyond the text

X has no title, description or tag fields; the text is the metadata. The extra fields that matter:
image + alt text (use on every news post), Community posting (worth it if a good GTA 6 community
exists), reply settings (leave open to everyone), "made with AI" label (owner's call; recommended for
automated posts once they run). Link cards come from the site's Open Graph tags, already in place.

## Guardrails for whatever posts

- **Never read from X** (searching, polling trends or mentions): reads cost $0.005 per post returned and
  are the fastest way to burn credits. News comes only from this repo.
- At most **10 plain posts and 2 link posts a day**. Nothing between 00:30 and 06:00 IST.
- **No retry loops.** On any API error, log it and stop the run. On an out-of-credit error, stop until the
  owner tops up.
- Never post the same text twice, and never post this account's text from any other account.
- Everything posted must already be on the site and follow the `CLAUDE.md` content rules.

## Site follow-ups (need the owner's OK; layout changes are off-limits to the scheduled agents)

- Add the X profile link to the footer and a `twitter:site` meta tag (`@gamerinfo_in`).
- `/ai/` is now the front page (root 301s there), so `https://www.gta6info.in/` and
  `https://www.gta6info.in/ai` land on the same page. Either works in the bio.

## Tooling state after PR #1 (19 Nov 2026)

PR #1 added an X API MCP server for cloud sessions (`.mcp.json`, enabled in `.claude/settings.json`):
`https://api.x.com/mcp?read_only=true`, authenticated with an **app Bearer token** that the cloud proxy
injects (locally: `X_BEARER_TOKEN`). What that means for this plan:

- **It cannot post.** It is read-only by URL, and creating a post on X needs a token that acts as
  `@gamerinfo_in` (a user-context token with write access); an app Bearer token can only read. Automated
  posting still needs a write-capable token and one of the routes in "Open decisions".
- **It is loaded into every cloud session in this repo**, including the hourly news and SEO agents, and
  every read is billed ($0.005 per post returned). To keep the "Never read from X" guardrail, both agents'
  prompts and `CLAUDE.md` (section "X (Twitter)") now forbid calling its tools; they research X trends
  with web search instead. This is an interim measure until the owner decides what the MCP is for.
- It does settle one unknown in "Recommended build": a Claude cloud session **can** reach `api.x.com`
  through the proxy (per PR #1; not yet exercised).

## Open decisions for the owner

1. ~~Post source~~ **Decided 19 Nov:** the hourly news agent decides the post (brief `headline:` by
   default, newest unposted post as fallback, per "What to post").
2. Phase the link posts in after 3–4 weeks (recommended), or run the full mix from day one.
3. Runner: **GitHub Actions proposed** (see "Auto-posting"); owner confirms with the weekend build.
4. Travel account: park it (recommended) or define its own content source.
5. ~~Automated posting route~~ **Decided 19 Nov:** the X API, not Typefully (too expensive). Proposed
   path: news agent → `social/x-post.md` → GitHub Action → X API (see "Auto-posting").
6. What the read-only X MCP is for. Reads are billed per post returned, and the guardrail above says
   never read from X; until this is decided the hourly agents are told not to call it.

## Sources

- X authenticity / multiple accounts: https://help.x.com/rules-and-policies/platform-manipulation
- X automation rules: https://help.x.com/rules-and-policies/x-automation
- X API pricing: the pay-per-use table in the X Developer Console (screenshot shared by the owner, 19 Nov 2026)

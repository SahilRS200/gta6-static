# X (Twitter) plan — @gamerinfo_in

Status: **planning only (19 Nov 2026). Nothing is built yet.** This file records what the owner has
decided and what is still only a recommendation, so an agent can be updated from it. Items marked
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
  <headline>

  #GTA6 #GTAVI #<one tag-based hashtag>
  More at gta6info (link in bio)
  ```

  Example (153 characters):

  ```
  Broke in GTA 6? Shipwreck dives pay up to about $4,000 each — the fastest early money, no spoilers

  #GTA6 #GTAVI #GTA6Tips
  More at gta6info (link in bio)
  ```

- **No URL and no domain anywhere in the text**, so each post bills at $0.015. Write `gta6info`
  without the dot. Avoid tricks like `gta6info[dot]in`; they read as spam on a new account.
- 2–4 hashtags, built from the post's tags (`#GTA6`, `#GTAVI`, then e.g. `#GTA6Tips`,
  `#GTA6India`). Never stuff hashtags.
- Stay under 280 characters.

### Flashy link posts (2 a day, phase 2)

- A sharper hook written for clicks, plus the **full canonical URL** of the specific post or of `/ai/`
  (`https://www.gta6info.in/news/<slug>/`). The site's Open Graph and `summary_large_image` tags make
  it unfurl as a large card.
- Spend these slots on the stories people share (trailer, date news, records, confirmed leaks,
  big India stories), not on a fixed slot with whatever is lying around.
- Punchy but **true and sourced**: the content rules in `CLAUDE.md` apply in full (no fake urgency, no
  spoilers, rumours labelled "rumoured", no piracy or grey-market links).

## Recommended build (not started; needs the owner's go-ahead)

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
- Typefully (a scheduling app) is connected to the owner's Claude account. It was considered and not
  chosen for automation: it adds a subscription and a middleman. It is fine for one-off manual posts.

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

## Open decisions for the owner

1. Post source: brief `headline:` with newest-post fallback (recommended), or always the newest post.
2. Phase the link posts in after 3–4 weeks (recommended), or run the full mix from day one.
3. GitHub Actions as the runner (recommended), or somewhere else.
4. Travel account: park it (recommended) or define its own content source.

## Sources

- X authenticity / multiple accounts: https://help.x.com/rules-and-policies/platform-manipulation
- X automation rules: https://help.x.com/rules-and-policies/x-automation
- X API pricing: the pay-per-use table in the X Developer Console (screenshot shared by the owner, 19 Nov 2026)

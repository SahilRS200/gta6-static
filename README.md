# Unlock O'Clock — GTA 6 Countdown

Live GTA 6 unlock countdowns for 30 time zones, with pins, per-country SEO pages, two guides and a visit counter.
It's a zero-dependency Node server (`server.js`) that serves `public/`, renders 30 `/gta-6-release-time/<country>/`
pages and the sitemap at boot, and exposes `/api/hit` + `/api/stats` for the counter.

## Run locally

```sh
node server.js            # http://localhost:8080
PORT=8787 node server.js
```

## Environment

| Var | Default | What |
|---|---|---|
| `PORT` | `8080` | Set by Railway. |
| `SITE_URL` | `https://$RAILWAY_PUBLIC_DOMAIN` | Canonical origin used in canonical/OG/sitemap. **Set it to the custom subdomain** — then every other host 301s to it. |
| `DATA_DIR` | `./data` | Where `counter.json` lives. Mount a Railway volume here (`/data`). |

## Unlock rule

`public/js/time.js` computes 00:00 on 19 Nov 2026 in each zone with `Intl`. US zones (`us: true` in
`public/js/zones.js`) follow the Eastern-Time US PlayStation Store by default (reported, not official); users can flip
to strict local midnight.

## Images

`design/og.html` and `design/icon.html` are the sources for `og.png` and the icons (rendered with headless Edge/Chrome).

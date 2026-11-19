---
title: GTA 6 at 60fps on PS5? A Free PC App Fakes It With AI Frame Generation, but Adds About 20 ms of Lag
description: GTA 6 runs at 30fps on every console. SmoovPlay streams your PS5 to a Windows PC and inserts AI frames for 60fps, but adds about 20 ms of lag and needs a recent Nvidia GPU.
date: 2026-11-19T10:37:00+05:30
tags: [performance, ps5, how-to]
sources:
  - Notebookcheck — PC app boosts GTA 6 PS5 performance from 30 fps to 60 fps, but at a cost | https://www.notebookcheck.net/New-PC-app-boosts-GTA-6-PS5-performance-from-30-fps-to-60-fps-but-at-a-cost.1452776.0.html
  - Push Square — Rockstar explains GTA 6's frame rate decision | https://www.pushsquare.com/news/2026/11/ps5-pro-is-not-powerful-enough-to-run-gta-6-at-60fps-rockstar-explains-frame-rate-decision
---
GTA 6 is **locked at 30fps on every console**, PS5 Pro included, and Rockstar says the consoles' CPUs can't run its simulation faster ([Push Square](https://www.pushsquare.com/news/2026/11/ps5-pro-is-not-powerful-enough-to-run-gta-6-at-60fps-rockstar-explains-frame-rate-decision)). So players are now asking about **SmoovPlay**, a free, unofficial Windows app that claims to make GTA 6 on PS5 look like 60fps. Here is what it actually does, based on [Notebookcheck's report](https://www.notebookcheck.net/New-PC-app-boosts-GTA-6-PS5-performance-from-30-fps-to-60-fps-but-at-a-cost.1452776.0.html).

## How it works

- It is a **PS Remote Play client** for Windows, built on the open-source Chiaki-ng project. Your PS5 still runs the game at 30fps.
- The app streams that 1080p picture to your PC and uses **AI frame generation** to insert in-between frames, so what you see on the PC screen is smoother.
- Capture-card support (plugging the PS5 into the PC over HDMI) is listed as **experimental**.

## The catch

- **Extra input lag.** The developer estimates frame generation adds **about 20 ms at 60fps**, and more at 90fps. Notebookcheck warns that fast cars can feel sluggish and aiming less precise. Rockstar's own fix for 30fps was to cut input lag, so this works against that.
- **You need a gaming PC.** A Windows PC with, preferably, an **Nvidia RTX 30, 40 or 50-series** card, plus a stable home network. If you already have that PC, it's cheaper than a new console.
- **Streamed picture.** You're watching a 1080p Remote Play stream, not the PS5's direct output on your TV, so image quality depends on your Wi-Fi or LAN.
- **Not official.** Rockstar and Sony have not commented on it. The app does not change the game itself.

## Should you bother?

For most players in India, **no**: the extra lag and the need for a gaming PC outweigh smoother motion, and the game is built around 30fps. Better first step: read Digital Foundry's [PS5 vs PS5 Pro vs Xbox performance test](/news/gta-6-ps5-vs-ps5-pro-xbox-performance-digital-foundry/). Seeing drops to 15–20fps in fights on a base PS5? That's a known launch issue. [Bugs and fixes →](/news/gta-6-bugs-glitches-launch-falling-through-map/)

Related: [why GTA 6 is 30fps even on PS5 Pro →](/news/gta-6-30fps-ps5-pro-rockstar-explains/) · [first-hours settings →](/news/gta-6-first-hours-tips-settings/)

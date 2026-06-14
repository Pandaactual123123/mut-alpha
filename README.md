# MUT Alpha — Snipe

MUT 26 auction sniper. Compares listed/buy-now prices against live mut.gg market values and flags profitable flips after AH tax.

## Features
- **🎯 Snipe Engine** — Per-card profit & discount math (sell price minus 10% AH tax minus buy price), with ALL/ANY threshold matching.
- **mut.gg Prices** — One-tap pull of live market values from mut.gg's public price index, per platform (PS5/PS4/XBSX/XB1/PC).
- **Live Feed (read-only)** — Optional EA Companion auction poller that maps your captured search response and beeps on fresh snipes. Read-only at the proxy (no buy/bid/sell). Violates EA ToS — use at your own risk.
- **Manual Entry** — Type a market value and a listed price per card to evaluate any deal by hand.
- **Search** — Real-time filter by player name or card version.

> The full multi-tab platform (Player Rankings, scoring engines, Thresholds) is preserved on the `archive/full-app` branch.

## Deploy on Vercel
1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Vercel auto-detects Vite — click Deploy
5. Done. Auto-deploys on every push.

## Tech Stack
- React 18 + Vite 5
- Vercel serverless: `api/mutgg.js` (mut.gg price feed), `api/ah-feed.js` (read-only EA auction proxy)
- No external CSS — fully inline styled

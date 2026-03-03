# MUT Alpha v3.0

MUT 26 Ultimate Team Intelligence Platform — Live data from mut.gg with AI-powered refresh.

## Features
- **Verified mut.gg Data** — Top 5 players per position ranked by community starting %
- **Live Refresh** — Anthropic API + web search pulls fresh data on demand
- **14 Sub-Positions** — QB, HB, WR, LT, LG, C, RG, RT, LEDG, DT, REDG, CB, FS, SS
- **Engine Formulas** — QMS, WREE v2, RBVS, TBS, MVS, TCS with threshold tracking
- **50/50 Theme Team Toggle** — +2 SPD simulation
- **Search** — Real-time filter by name or card version

## Deploy on Vercel
1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Vercel auto-detects Vite — click Deploy
5. Done. Auto-deploys on every push.

## Tech Stack
- React 18 + Vite 5
- Anthropic API (web_search tool for live refresh)
- No external CSS — fully inline styled

# Panda Actual Sniper

MUT 26 auction sniper. Compares listed/buy-now prices against live mut.gg market values and flags profitable flips after AH tax.

## Features
- **🎯 Snipe Engine** — Per-card profit & discount math (sell price minus 10% AH tax minus buy price), with ALL/ANY threshold matching.
- **mut.gg Prices** — One-tap pull of live market values from mut.gg's public price index, per platform (PS5/PS4/XBSX/XB1/PC).
- **Live Feed (read-only)** — Optional EA Companion auction poller that maps your captured search response and beeps on fresh snipes. Read-only at the proxy (no buy/bid/sell). Violates EA ToS — use at your own risk.
- **Manual Entry** — Type a market value and a listed price per card to evaluate any deal by hand.
- **Search** — Real-time filter by player name or card version.

> The full multi-tab platform (Player Rankings, scoring engines, Thresholds) is preserved on the `archive/full-app` branch.

## Accounts & Billing (optional, self-host)

Phase 4 adds optional email/password accounts and a single paid "Pro" tier (Stripe subscription). It is a **scaffold**: correct and secure, but inert until you supply env vars and a persistent store. Free users can browse **page 1** of the Catalog; **Pro** unlocks page 2+. The Snipe engine and live feed stay fully free for everyone.

### How it works (no extra npm deps — Node built-ins + `fetch` only)
- **Sessions**: JWT-style `base64url(header).base64url(payload).sig`, HMAC-SHA256 via `node:crypto`, stored in an `HttpOnly; Secure; SameSite=Lax` cookie.
- **Passwords**: `scrypt` with a random 16-byte salt; verification is constant-time (`timingSafeEqual`).
- **Billing**: Stripe Checkout (subscription mode) and webhooks driven directly against Stripe's REST API over `fetch` — no `stripe` package.

### Environment variables (see `.env.example`)
| Var | Required for | Inert without it |
| --- | --- | --- |
| `AUTH_SECRET` | All auth | Signup/login/me/checkout **fail closed with HTTP 500** — there is no default signing secret. |
| `UPSTASH_REDIS_REST_URL` | Persistent users | Falls back to an **in-memory store**. |
| `UPSTASH_REDIS_REST_TOKEN` | Persistent users | Must be set together with the URL. |
| `STRIPE_SECRET_KEY` | Checkout + customers | `/api/billing/checkout` returns 500. |
| `STRIPE_PRICE_ID` | Checkout | `/api/billing/checkout` returns 500. |
| `STRIPE_WEBHOOK_SECRET` | Webhook | `/api/billing/webhook` returns 500; subscription status never updates. |

> **Ephemeral store:** Without the two `UPSTASH_*` vars the user store is an in-memory `Map`. This does **NOT** persist across serverless invocations — each cold start is empty and concurrent lambdas don't share state. It exists only for local dev/demo. Set the Upstash vars for any real deployment.

### Setup
1. Generate a signing secret and set `AUTH_SECRET`:
   `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`
2. Create an [Upstash Redis](https://upstash.com) database and set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
3. In Stripe, create a recurring **Price** for Pro and set `STRIPE_SECRET_KEY` + `STRIPE_PRICE_ID`.
4. Add a webhook endpoint pointing at `/api/billing/webhook` for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`; set `STRIPE_WEBHOOK_SECRET` to its signing secret.
5. Add all of the above in Vercel → Project → Settings → Environment Variables, then redeploy.

> **Stripe webhook raw-body caveat:** Stripe signs the *exact raw request bytes*. `api/billing/webhook.js` exports `config = { api: { bodyParser: false } }` and reads the raw stream itself so the HMAC verification matches — do not re-enable the body parser or read `req.body` there, or every webhook will fail signature verification.

## Deploy on Vercel
1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Vercel auto-detects Vite — click Deploy
5. Done. Auto-deploys on every push.

## Tech Stack
- React 18 + Vite 5
- Vercel serverless: `api/mutgg.js` (mut.gg price feed), `api/catalog.js` (catalog proxy), `api/ah-feed.js` (read-only EA auction proxy)
- Accounts/billing serverless (optional): `api/auth/*` (signup/login/logout/me), `api/billing/*` (Stripe checkout + webhook), shared helpers in `api/_lib/*` — Node built-ins + `fetch` only, no extra npm deps
- No external CSS — fully inline styled

// Read-only auction-house feed proxy.
//
// Forwards a user-supplied auction *search* request to EA's Companion backend and
// returns the raw JSON, so the browser can poll for live listings without hitting
// CORS. This is the "non-ToS-safe" data source — you must capture your own session
// token (e.g. with mitmproxy against the Madden Companion App) and pass it in.
//
// VISUAL ONLY: this proxy is a structural guardrail. It refuses any request that
// looks like a buy / bid / sell / purchase, so it can read listings but can never
// transact. Removing this guard is on you, not me.
//
// NOTE: This still violates EA's User Agreement and can get an account banned even
// when read-only. Use on an account you're willing to lose.

import { checkEAEndpoint } from "./_lib/net-guard.js";

const BLOCKED = /(purchase|checkout|\/buy\b|\bbid\b|\/sell\b|\blist\b|transfermarket\/.*\/(buy|bid))/i;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { endpoint, method = "GET", token, headers = {}, body } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: "Missing 'endpoint'." });

  // SSRF guard: https + allowed EA host only, no private/internal addresses.
  const chk = checkEAEndpoint(endpoint);
  if (!chk.ok) return res.status(400).json({ error: chk.error });
  const url = chk.url;

  const m = String(method).toUpperCase();
  if (!["GET", "POST"].includes(m)) {
    return res.status(400).json({ error: "Only GET/POST searches are allowed." });
  }

  // Structural 'no buy' guardrail — read-only traffic only.
  const bodyStr = body == null ? "" : (typeof body === "string" ? body : JSON.stringify(body));
  if (BLOCKED.test(endpoint) || BLOCKED.test(bodyStr)) {
    return res.status(403).json({ error: "Blocked: this feed is read-only (no buy/bid/sell)." });
  }

  // Build forwarded headers. EA endpoints use varying auth headers
  // (Authorization, X-BLAZE-SESSION, X-Pin, etc.) — pass whatever you captured
  // via `headers`. `token` is a convenience that fills Authorization if unset.
  const fwd = { Accept: "application/json", ...headers };
  if (token && !fwd.Authorization && !fwd.authorization) fwd.Authorization = token;

  try {
    const r = await fetch(url.toString(), {
      method: m,
      headers: fwd,
      body: m === "POST" ? (typeof body === "string" ? body : JSON.stringify(body || {})) : undefined,
    });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return res.status(200).json({ ok: r.ok, status: r.status, data });
  } catch (e) {
    return res.status(200).json({ ok: false, status: 0, error: e.message });
  }
}

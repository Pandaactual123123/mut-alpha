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
import { checkGate } from "./_lib/gate.js";

const BLOCKED = /(purchase|checkout|\/buy\b|\bbid\b|\/sell\b|\blist\b|transfermarket\/.*\/(buy|bid))/i;

// Only these caller-supplied headers are forwarded to EA — never spread arbitrary
// headers (prevents header-smuggling / using us as an arbitrary authed relay).
const FWD_HEADERS = new Set(["authorization","x-blaze-session","x-blaze-id","x-application-key","x-pin","x-pow","easw-session-data-nucleus-id","x-ut-sid","x-http-method-override","content-type","accept"]);
function pickHeaders(headers) {
  const out = { Accept: "application/json" };
  for (const [k, v] of Object.entries(headers || {})) if (FWD_HEADERS.has(String(k).toLowerCase())) out[k] = v;
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!checkGate(req).ok) return res.status(401).json({ error: "Locked — enter the access password." });

  const { endpoint, method = "GET", token, headers = {}, body } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: "Missing 'endpoint'." });

  // SSRF guard: https + allowed EA host only, no private/internal addresses.
  const chk = await checkEAEndpoint(endpoint);
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

  // Forward only whitelisted EA auth headers. `token` fills Authorization if unset.
  const fwd = pickHeaders(headers);
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
    console.error("ah-feed error:", e.message);
    return res.status(200).json({ ok: false, status: 0, error: "EA request failed" });
  }
}

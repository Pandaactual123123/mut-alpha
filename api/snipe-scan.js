// Server-side snipe scan (read-only, on-demand).
//
// This is the server-side half of the spotter: it performs ONE read-only EA
// auction *search* with the caller's own captured token, parses the listings,
// and diffs each against market values to rank snipes (profit after AH tax +
// discount + heat) — the margin math runs on the server instead of the browser.
//
// DELIBERATE LIMITS (read these):
//   • READ-ONLY. The same buy/bid/sell guardrail as /api/ah-feed applies; this
//     endpoint can never transact.
//   • ON-DEMAND ONLY. It runs once per request. There is NO background poller and
//     NO stored EA token here — the token is used for this single request and
//     discarded. A persistent server-side token farm is intentionally NOT built:
//     it's a credential-security liability and the most ban-inducing form.
//   • Using your EA session token against the Companion API violates EA's User
//     Agreement and can get the account banned. Use an account you can lose.

const BLOCKED = /(purchase|checkout|\/buy\b|\bbid\b|\/sell\b|\blist\b|transfermarket\/.*\/(buy|bid))/i;
const AH_TAX = 0.10;
const PLAT_FIELD = { pc: "pcPrice", ps5: "ps5Price", ps4: "ps4Price", xbsx: "xbsxPrice", xb1: "xb1Price" };

const readPath = (obj, path) =>
  path == null || path === "" ? obj : String(path).split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
const normName = (s) =>
  String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/\([^)]*\)/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/[^a-z0-9]/g, "");

function heatScore(profit, disc, mv) {
  if (!mv || mv <= 0) return 0;
  const marginPct = Math.max(0, (profit / mv) * 100);
  const blend = 0.6 * Math.min(100, marginPct * 2) + 0.4 * Math.min(100, Math.max(0, disc) * 2);
  return Math.max(0, Math.min(100, Math.round(blend)));
}

// Capped server-side market-value lookup via mut.gg's name endpoint, so the scan
// can value listings the caller didn't price. Bounded to avoid hammering mut.gg.
async function lookupValue(name, field) {
  const u = `https://www.mut.gg/api/26/player-items/?name=${encodeURIComponent(name)}&page_size=10`;
  const r = await fetch(u, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) return 0;
  const j = await r.json();
  const want = normName(name);
  const hit = (Array.isArray(j.data) ? j.data : [])
    .map((it) => ({ nm: normName(`${it.firstName} ${it.lastName}`), price: it[field] || 0 }))
    .filter((x) => x.nm === want && x.price > 0)
    .sort((a, b) => a.price - b.price)[0];
  return hit ? hit.price : 0;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    feed = {}, platform = "ps5", marketValues = {},
    profitMin = 5000, discountMin = 15, matchMode = "any", enrich = true,
  } = req.body || {};
  const { endpoint, method = "GET", token, headers = {}, body, arrPath = "", nameKey = "", priceKey = "" } = feed;

  if (!endpoint) return res.status(400).json({ error: "Missing feed.endpoint." });
  let url;
  try { url = new URL(endpoint); } catch { return res.status(400).json({ error: "Invalid endpoint URL." }); }
  if (url.protocol !== "https:") return res.status(400).json({ error: "Endpoint must be https." });
  const m = String(method).toUpperCase();
  if (!["GET", "POST"].includes(m)) return res.status(400).json({ error: "Only GET/POST searches are allowed." });

  // Read-only guardrail — identical to /api/ah-feed.
  const bodyStr = body == null ? "" : (typeof body === "string" ? body : JSON.stringify(body));
  if (BLOCKED.test(endpoint) || BLOCKED.test(bodyStr)) {
    return res.status(403).json({ error: "Blocked: this scan is read-only (no buy/bid/sell)." });
  }

  const field = PLAT_FIELD[platform] || PLAT_FIELD.ps5;
  const fwd = { Accept: "application/json", ...headers };
  if (token && !fwd.Authorization && !fwd.authorization) fwd.Authorization = token;

  try {
    // 1) One read-only fetch of the user's auction search (token used here only).
    const r = await fetch(url.toString(), {
      method: m, headers: fwd,
      body: m === "POST" ? (typeof body === "string" ? body : JSON.stringify(body || {})) : undefined,
    });
    const text = await r.text();
    let payload; try { payload = JSON.parse(text); } catch { payload = text; }
    if (!r.ok) return res.status(200).json({ ok: false, status: r.status, error: "EA request failed", snipes: [] });

    // 2) Parse listings via the caller-supplied JSON paths.
    const arr = readPath(payload, arrPath);
    const listings = (Array.isArray(arr) ? arr : []).map((it) => ({
      name: String(readPath(it, nameKey) ?? "").trim(),
      buyNow: Number(readPath(it, priceKey)) || 0,
    })).filter((l) => l.name && l.buyNow > 0);

    // 3) Value each listing: caller-provided map first, then a capped mut.gg lookup.
    const provided = {};
    for (const k of Object.keys(marketValues)) provided[normName(k)] = Number(marketValues[k]) || 0;
    let lookups = 0;
    const MAX_LOOKUPS = 12;
    const valued = [];
    for (const l of listings) {
      let mv = provided[normName(l.name)] || 0;
      if (!mv && enrich && lookups < MAX_LOOKUPS) { mv = await lookupValue(l.name, field); lookups++; }
      const has = mv > 0 && l.buyNow > 0;
      const profit = has ? Math.round(mv * (1 - AH_TAX) - l.buyNow) : null;
      const disc = has ? Math.round(((mv - l.buyNow) / mv) * 100) : null;
      const profitOk = profit != null && profit >= profitMin;
      const discOk = disc != null && disc >= discountMin;
      const isSnipe = has && (matchMode === "all" ? profitOk && discOk : profitOk || discOk);
      valued.push({ name: l.name, buyNow: l.buyNow, mv, profit, disc, isSnipe, heat: isSnipe ? heatScore(profit, disc, mv) : 0 });
    }

    const snipes = valued.filter((v) => v.isSnipe).sort((a, b) => b.heat - a.heat || (b.profit || 0) - (a.profit || 0));
    return res.status(200).json({
      ok: true,
      summary: { scanned: listings.length, valued: valued.filter((v) => v.mv > 0).length, snipes: snipes.length, enriched: lookups },
      snipes,
    });
  } catch (e) {
    return res.status(200).json({ ok: false, status: 0, error: e.message, snipes: [] });
  }
}

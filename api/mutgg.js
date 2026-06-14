// mut.gg market-value proxy (ToS-safe).
//
// Pulls live auction prices straight from mut.gg's public player-items API and
// matches them to the app's roster, so market values stay fresh without the slow
// Claude web-search path. mut.gg is a public price index — reading it is fine.
//
// POST { players: [{key,name,ovr,program}], platform }
//   platform ∈ pc | ps5 | ps4 | xbsx | xb1
// -> { platform, prices: [{key, price, matchedOvr, matchedProgram, matched}] }

import { checkGate } from "./_lib/gate.js";

const PLAT = { pc: "pcPrice", ps5: "ps5Price", ps4: "ps4Price", xbsx: "xbsxPrice", xb1: "xb1Price" };
const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
// Strip parentheticals and name suffixes so the search term matches mut.gg's records
const searchName = s => String(s || "").replace(/\([^)]*\)/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/gi, "").replace(/\s+/g, " ").trim();

async function lookup(name, field) {
  const u = `https://www.mut.gg/api/26/player-items/?name=${encodeURIComponent(searchName(name))}&page_size=25`;
  const r = await fetch(u, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`mut.gg HTTP ${r.status}`);
  const j = await r.json();
  return (Array.isArray(j.data) ? j.data : []).map(it => ({
    name: `${it.firstName} ${it.lastName}`,
    ovr: it.overall,
    program: it.program?.name || "",
    price: it[field] || 0,
    canAuction: !!it.canAuction,
  }));
}

// Pick the best mut.gg card for a roster entry: same name, then exact program OR
// overall within ±1, preferring auctionable cards that actually have a price.
function pickBest(cands, want) {
  const nm = norm(want.name);
  const same = cands.filter(c => norm(c.name) === nm);
  if (!same.length) return null;
  const wantProg = norm(want.program), wantOvr = Number(want.ovr) || 0;
  const qualified = same.filter(c =>
    (wantProg && norm(c.program) === wantProg) || (wantOvr && Math.abs(c.ovr - wantOvr) <= 1) || !wantOvr
  );
  const pool = qualified.length ? qualified : [];
  if (!pool.length) return null;
  pool.sort((a, b) =>
    (Number(b.canAuction) - Number(a.canAuction)) ||
    (Number(b.price > 0) - Number(a.price > 0)) ||
    (wantOvr ? Math.abs(a.ovr - wantOvr) - Math.abs(b.ovr - wantOvr) : 0) ||
    (a.price - b.price)
  );
  return pool[0];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!checkGate(req).ok) return res.status(401).json({ error: "Locked — enter the access password." });
  const { players = [], platform = "ps5" } = req.body || {};
  const field = PLAT[platform] || PLAT.ps5;
  if (!Array.isArray(players) || !players.length) return res.status(400).json({ error: "Missing players[]." });

  // Dedupe lookups by search name to cut redundant requests
  const byName = new Map();
  for (const p of players) {
    const k = norm(searchName(p.name));
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(p);
  }
  const cache = new Map();
  const queue = [...byName.keys()];
  async function worker() {
    while (queue.length) {
      const k = queue.shift();
      const sample = byName.get(k)[0];
      try { cache.set(k, await lookup(sample.name, field)); }
      catch (e) { cache.set(k, { _err: e.message }); }
    }
  }
  await Promise.all(Array.from({ length: 5 }, worker)); // 5 concurrent

  const prices = players.map(p => {
    const cands = cache.get(norm(searchName(p.name)));
    if (!cands || cands._err) return { key: p.key, price: 0, matched: false, error: cands?._err };
    const best = pickBest(cands, p);
    return best
      ? { key: p.key, price: best.price, matchedOvr: best.ovr, matchedProgram: best.program, matched: true }
      : { key: p.key, price: 0, matched: false };
  });

  res.status(200).json({ platform, prices });
}

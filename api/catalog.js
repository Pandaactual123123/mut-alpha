// Market Catalog proxy (ToS-safe).
//
// Server-side reader for mut.gg's public player-items index. Keeping the fetch
// on the server (not the browser) means the data source stays behind our own
// /api/catalog, mirrors a stable shape, and avoids CORS. mut.gg is a public
// price index — reading it is fine.
//
// GET /api/catalog?page=1&platform=ps5&q=allen&position=QB&sort=price_desc
//   platform ∈ pc | ps5 | ps4 | xbsx | xb1
//   sort     ∈ ovr_desc | ovr_asc | price_desc | price_asc | change_desc | change_asc
// -> { data:[...normalized...], page, platform, hasMore }

const PLAT = {
  pc:   { price: "pcPrice",   chg: "pcPercentChange",   disp: "pcPriceDisplay" },
  ps5:  { price: "ps5Price",  chg: "ps5PercentChange",  disp: "ps5PriceDisplay" },
  ps4:  { price: "ps4Price",  chg: "ps4PercentChange",  disp: "ps4PriceDisplay" },
  xbsx: { price: "xbsxPrice", chg: "xbsxPercentChange", disp: "xbsxPriceDisplay" },
  xb1:  { price: "xb1Price",  chg: "xb1PercentChange",  disp: "xb1PriceDisplay" },
};

// mut.gg returns a fixed 25 items per page regardless of page_size.
const PAGE_SIZE = 25;

function normalize(it, plat) {
  const pos = it.gamePosition?.abbreviation || it.gamePosition?.basePosition?.abbreviation || "";
  return {
    pk: it.pk,
    name: `${it.firstName || ""} ${it.lastName || ""}`.trim(),
    ovr: it.overall || 0,
    pos,
    archetype: it.archetype?.nameWithoutPosition || it.archetype?.name || "",
    program: it.program?.name || "",
    programColor: it.program?.hexColor || "",
    team: it.team?.abbreviation || "",
    canAuction: !!it.canAuction,
    price: it[plat.price] || 0,
    priceDisplay: it[plat.disp] || "",
    pctChange: typeof it[plat.chg] === "number" ? it[plat.chg] : null,
    image: it.image?.url || it.cardImage?.url || it.fullImage?.url || "",
    url: it.url || "",
  };
}

const SORTS = {
  ovr_desc:    (a, b) => b.ovr - a.ovr,
  ovr_asc:     (a, b) => a.ovr - b.ovr,
  price_desc:  (a, b) => (b.price || 0) - (a.price || 0),
  price_asc:   (a, b) => (a.price || -1) - (b.price || -1), // keep 0-priced last-ish on asc
  change_desc: (a, b) => (b.pctChange ?? -1e9) - (a.pctChange ?? -1e9),
  change_asc:  (a, b) => (a.pctChange ?? 1e9) - (b.pctChange ?? 1e9),
};

async function fetchPage(page, q) {
  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (q) params.set("name", q);
  const url = `https://www.mut.gg/api/26/player-items/?${params.toString()}`;
  const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`mut.gg HTTP ${r.status}`);
  const j = await r.json();
  return Array.isArray(j.data) ? j.data : [];
}

export default async function handler(req, res) {
  const src = req.method === "POST" ? (req.body || {}) : (req.query || {});
  const plat = PLAT[src.platform] || PLAT.ps5;
  const q = (src.q || src.name || "").toString().trim();
  const position = (src.position || "").toString().trim().toUpperCase();
  const sort = SORTS[src.sort] ? src.sort : "ovr_desc";
  const auctionOnly = src.auctionOnly === true || src.auctionOnly === "true" || src.auctionOnly === "1";

  try {
    // NOTE: mut.gg's public player-items endpoint ignores page/offset/limit/
    // ordering and always returns a single ~25-card set. The only real lever is
    // `name` (substring search). So there is no server pagination here — we fetch
    // once, then filter/sort the returned set. `q` narrows by player name.
    const raw = await fetchPage(1, q);

    // Dedupe by pk (the upstream set can repeat entries across name matches).
    const seen = new Set();
    let data = [];
    for (const it of raw) {
      const c = normalize(it, plat);
      if (c.pk != null && seen.has(c.pk)) continue;
      if (c.pk != null) seen.add(c.pk);
      data.push(c);
    }
    if (position) data = data.filter(p => p.pos === position);
    if (auctionOnly) data = data.filter(p => p.canAuction);
    data.sort(SORTS[sort]);

    return res.status(200).json({ data, platform: src.platform || "ps5", sort, query: q, hasMore: false });
  } catch (err) {
    return res.status(200).json({ data: [], platform: src.platform || "ps5", error: err.message });
  }
}

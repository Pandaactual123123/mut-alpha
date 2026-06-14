// Market Catalog proxy.
//
// Two modes, because mut.gg exposes the catalog two different ways:
//   • BROWSE (no q): the full card DB is paginated only via the server-rendered
//     /players/?page=N HTML route (robots-ALLOWED). We scrape metadata from it
//     (name/ovr/pos/program/team/image) with real pagination + position/overall
//     filters. No prices — those are client-hydrated on mut.gg from a gated API.
//   • SEARCH (q set): the /api/26/player-items/?name= JSON endpoint returns up to
//     ~25 priced matches. We use it for name search so results carry live prices.
//
// GET /api/catalog?page=1&platform=ps5&q=allen&position=QB&overallMin=90&sort=ovr_desc
//   platform ∈ pc | ps5 | ps4 | xbsx | xb1
//   sort     ∈ ovr_desc | ovr_asc | price_desc | price_asc | change_desc | change_asc
// -> { data:[...], page, platform, hasMore, mode }

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

// SEARCH mode: priced name matches from the JSON endpoint (no pagination).
async function searchByName(q) {
  const params = new URLSearchParams({ page_size: String(PAGE_SIZE), name: q });
  const url = `https://www.mut.gg/api/26/player-items/?${params.toString()}`;
  const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`mut.gg HTTP ${r.status}`);
  const j = await r.json();
  return Array.isArray(j.data) ? j.data : [];
}

export default async function handler(req, res) {
  const src = req.method === "POST" ? (req.body || {}) : (req.query || {});
  const platKey = PLAT[src.platform] ? src.platform : "ps5";
  const plat = PLAT[platKey];
  const q = (src.q || src.name || "").toString().trim();
  const page = Math.max(1, parseInt(src.page) || 1);
  const position = (src.position || "").toString().trim().toUpperCase();
  const overallMin = Math.max(0, Math.min(99, parseInt(src.overallMin) || 0));
  const sort = SORTS[src.sort] ? src.sort : "ovr_desc";
  const auctionOnly = src.auctionOnly === true || src.auctionOnly === "true" || src.auctionOnly === "1";

  try {
    let data, hasMore, mode;

    if (q) {
      // SEARCH: priced JSON results, deduped, filtered, single page.
      mode = "search";
      const raw = await searchByName(q);
      const seen = new Set();
      data = [];
      for (const it of raw) {
        const c = normalize(it, plat);
        if (c.pk != null && seen.has(c.pk)) continue;
        if (c.pk != null) seen.add(c.pk);
        data.push(c);
      }
      if (position) data = data.filter(p => p.pos === position);
      if (overallMin) data = data.filter(p => p.ovr >= overallMin);
      hasMore = false;
    } else {
      // BROWSE: paginated metadata from the /players/ HTML route.
      mode = "browse";
      const { fetchCatalogPage } = await import("./_lib/mutgg-scrape.js");
      const r = await fetchCatalogPage({ page, position, overallMin });
      data = r.cards.map(c => ({ ...c, priceDisplay: "" }));
      hasMore = r.hasMore;
    }

    if (auctionOnly) data = data.filter(p => p.canAuction);
    data.sort(SORTS[sort]);

    return res.status(200).json({ data, page, platform: platKey, sort, query: q, hasMore, mode });
  } catch (err) {
    return res.status(200).json({ data: [], page, platform: platKey, hasMore: false, error: err.message });
  }
}

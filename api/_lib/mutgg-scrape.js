// mut.gg catalog scraper (metadata only).
//
// mut.gg's JSON API (/api/*) is disallowed by their robots.txt and the price
// endpoint is access-controlled (403). Their *browse* route, /players/, is
// server-rendered HTML, robots-ALLOWED, and paginates the full card DB
// (~15 cards/page, hundreds of pages). We read that route and parse the
// `player-list-item` markup into card metadata. No prices live here — those are
// client-hydrated on mut.gg from the gated API, so we deliberately don't fetch
// them (no 403 bypass). Price enrichment is handled elsewhere via name lookup.

const BASE = "https://www.mut.gg/players/";

// mut.gg position abbreviations accepted by the ?positions= filter.
const POSITIONS = new Set(["QB","HB","FB","WR","TE","LT","LG","C","RG","RT","LEDG","REDG","DT","MIKE","WILL","SAM","CB","FS","SS","K","P"]);

function buildUrl({ page = 1, position = "", overallMin = 0 }) {
  const p = new URLSearchParams();
  if (page > 1) p.set("page", String(page));
  if (position && POSITIONS.has(position)) p.set("positions", position);
  if (overallMin) p.set("overall-min", String(overallMin));
  const qs = p.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

const decode = (s) =>
  String(s || "")
    .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();

const grab = (block, re) => { const m = block.exec ? null : re.exec(block); return m ? decode(m[1]) : ""; };

// Parse a single card anchor block into a normalized record. `url` is the card's
// own href (passed in), since the href precedes the class we delimit on.
function parseCard(block, url) {
  const extId = (/playeritem\/(\d+)\.png/.exec(block) || [])[1]
    || (/\/26-(\d+)\//.exec(url || "") || [])[1] || null;
  const first = (/__name-first[^>]*>([^<]+)</.exec(block) || [])[1] || "";
  const last = (/__name-last[^>]*>\s*([^<]+?)\s*</.exec(block) || [])[1] || "";
  const ovr = parseInt((/__score-value[^>]*>\s*(\d+)/.exec(block) || [])[1]) || 0;
  const archRaw = decode((/__archetype[^>]*>([^<]+)</.exec(block) || [])[1] || "");
  const program = decode((/__program[^>]*>([^<]+)</.exec(block) || [])[1] || "");
  const team = ((/team-logo--([a-z0-9]+)\b/.exec(block) || [])[1] || "").toUpperCase();
  const color = (/__score-color"[^>]*background-color:\s*([#0-9a-fA-F]+)/.exec(block) || [])[1] || "";

  // Archetype field is "POS - Archetype" (e.g. "QB - Scrambler").
  let pos = "", archetype = archRaw;
  const dash = archRaw.indexOf(" - ");
  if (dash > -1) { pos = archRaw.slice(0, dash).trim().toUpperCase(); archetype = archRaw.slice(dash + 3).trim(); }

  const name = decode(`${first} ${last}`);
  if (!name || !extId) return null;
  return {
    pk: Number(extId),
    extId: Number(extId),
    name, ovr, pos, archetype, program, team,
    programColor: color,
    image: extId ? `https://media.mut.gg/cdn-cgi/image/format=auto,width=100,height=100,quality=80,fit=cover,gravity=top/26/mutdb/playeritem/${extId}.png` : "",
    url: url || "",
    canAuction: true,
    price: 0,
    pctChange: null,
  };
}

// Fetch one browse page and return { cards, hasMore }.
export async function fetchCatalogPage({ page = 1, position = "", overallMin = 0 } = {}) {
  const r = await fetch(buildUrl({ page, position, overallMin }), {
    headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0" },
  });
  if (!r.ok) throw new Error(`mut.gg HTTP ${r.status}`);
  const html = await r.text();

  // Match each card anchor whole — href (its own slug) then the class we key on,
  // up to the closing </a>. Anchors don't nest, so the lazy body is correct.
  const cards = [];
  const re = /<a\s+href="(\/players\/[0-9]+-[a-z0-9-]+\/26-[0-9]+\/)"\s+class="player-list-item__link"([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    const card = parseCard(m[2], m[1]);
    if (card) cards.push(card);
  }
  // mut.gg renders a "next" pager link (?page=N+1) while more pages remain.
  const hasMore = new RegExp(`[?&]page=${page + 1}\\b`).test(html);
  return { cards, hasMore };
}

export { POSITIONS };

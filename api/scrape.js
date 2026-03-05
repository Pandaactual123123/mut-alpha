import * as cheerio from "cheerio";

const VALID_SLUGS = new Set([
  "qb", "hb", "fb", "wr", "te",
  "lt", "lg", "c", "rg", "rt",
  "ledg", "dt", "redg",
  "cb", "fs", "ss",
]);

const STAT_MAP = {
  qb: ["SPD", "THP", "SAC", "MAC", "DAC"],
  hb: ["SPD", "CAR", "COD", "TRK", "BTK"],
  fb: ["SPD", "CAR", "RBK", "IMP", "TRK"],
  wr: ["SPD", "CTH", "SRR", "MRR", "DRR"],
  te: ["SPD", "CTH", "SRR", "RBK", "CIT"],
  lt: ["SPD", "ACC", "AGI", "STR", "JMP"],
  lg: ["SPD", "ACC", "AGI", "STR", "JMP"],
  c:  ["SPD", "ACC", "AGI", "STR", "JMP"],
  rg: ["SPD", "ACC", "AGI", "STR", "JMP"],
  rt: ["SPD", "ACC", "AGI", "STR", "JMP"],
  ledg: ["SPD", "ACC", "AGI", "STR", "JMP"],
  redg: ["SPD", "ACC", "AGI", "STR", "JMP"],
  dt: ["SPD", "TAK", "BSH", "PMV", "FMV"],
  cb: ["SPD", "JMP", "MCV", "ZCV", "PRS"],
  fs: ["SPD", "TAK", "POW", "MCV", "ZCV"],
  ss: ["SPD", "TAK", "POW", "MCV", "ZCV"],
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  "Referer": "https://www.google.com/",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
};

// In-memory cache: slug -> { data, timestamp }
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function clean(text) {
  return (text || "").trim().replace(/\s+/g, " ");
}

// Parse mut.gg HTML with cheerio using known DOM selectors
function parsePlayersFromHtml(html) {
  const $ = cheerio.load(html);
  const results = [];

  $(".player-list-item-usage").each(function () {
    if (results.length >= 5) return false;
    const $item = $(this);

    const first = clean($item.find(".player-list-item__name-first").text());
    const last = clean($item.find(".player-list-item__name-last").text());
    const name = `${first} ${last}`.trim();
    if (!name) return;

    const ovr = parseInt(clean($item.find(".player-list-item__score-value").text())) || 0;
    const card = clean($item.find(".player-list-item__program").text());
    const arch = clean($item.find(".player-list-item__archetype").text());
    const start = parseFloat(clean($item.find(".player-list-item-usage__percentage-value").text())) || 0;

    const allText = clean($item.text());
    const bnd = allText.includes("BND") || allText.includes("NAT");

    const s = {};
    $item.find(".player-list-item__stat").each(function () {
      const statName = clean($(this).find(".player-list-item__stat-name").text());
      const statVal = parseInt(clean($(this).find(".player-list-item__stat-value").text())) || 0;
      if (statName && statVal) s[statName] = statVal;
    });

    results.push({ name, card, ovr, arch, start, bnd, s });
  });

  return results;
}

export default async function handler(req, res) {
  const slug = (req.query.pos || "").toLowerCase();

  if (!VALID_SLUGS.has(slug)) {
    return res.status(400).json({
      error: `Invalid position slug: "${slug}". Valid: ${[...VALID_SLUGS].join(", ")}`,
      players: [],
    });
  }

  // Check cache
  const cached = cache.get(slug);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json({ ...cached.data, cached: true });
  }

  try {
    const url = `https://www.mut.gg/players/best/${slug}/?max_ratings=on`;
    const r = await fetch(url, { headers: HEADERS });
    if (!r.ok) {
      return res.status(200).json({
        position: slug, updated: new Date().toISOString(),
        players: [], error: `mut.gg returned ${r.status}`,
      });
    }

    const html = await r.text();
    const players = parsePlayersFromHtml(html);

    if (players.length > 0) {
      const result = { position: slug, updated: new Date().toISOString(), players, error: null };
      cache.set(slug, { data: result, timestamp: Date.now() });
      return res.status(200).json(result);
    }

    return res.status(200).json({
      position: slug, updated: new Date().toISOString(),
      players: [], error: `Fetched ${html.length} bytes but could not parse players`,
    });
  } catch (e) {
    return res.status(200).json({
      position: slug, updated: new Date().toISOString(),
      players: [], error: e.message,
    });
  }
}

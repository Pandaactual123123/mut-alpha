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

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";
const HEADERS = {
  "User-Agent": BROWSER_UA,
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

// Normalize a player from JSON API response
function normalizeJsonPlayer(raw, slug) {
  const expectedStats = STAT_MAP[slug] || [];
  const s = {};
  for (const stat of expectedStats) {
    const key = stat.toLowerCase();
    const val = raw[stat] || raw[key] || raw[`stat_${key}`] ||
      (raw.stats && (raw.stats[stat] || raw.stats[key])) ||
      (raw.ratings && (raw.ratings[stat] || raw.ratings[key]));
    if (val != null) s[stat] = parseInt(val) || 0;
  }
  return {
    name: raw.name || raw.full_name || raw.player_name || `${raw.first_name || ""} ${raw.last_name || ""}`.trim() || "Unknown",
    card: raw.card || raw.program || raw.program_name || raw.set_name || "",
    ovr: parseInt(raw.ovr || raw.overall || raw.rating || 0) || 0,
    arch: raw.arch || raw.archetype || raw.archetype_name || "",
    start: parseFloat(raw.start || raw.starting || raw.starting_pct || raw.start_pct || 0) || 0,
    bnd: !!(raw.bnd || raw.nat || raw.is_nat),
    s,
  };
}

// Strategy 1: Try JSON API endpoints
async function tryJsonApi(slug) {
  const urls = [
    `https://www.mut.gg/api/players/best/${slug}/`,
    `https://www.mut.gg/players/best/${slug}/?format=json`,
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: { ...HEADERS, "Accept": "application/json" },
      });
      if (!r.ok) continue;
      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("json")) continue;
      const data = await r.json();
      const arr = data.players || data.results || data.data || (Array.isArray(data) ? data : null);
      if (arr && Array.isArray(arr) && arr.length > 0) return arr;
    } catch (e) { /* continue */ }
  }
  return null;
}

// Strategy 2: Fetch HTML and parse with cheerio
async function tryHtmlScrape(slug) {
  const url = `https://www.mut.gg/players/best/${slug}/?max_ratings=on`;
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) {
    return { error: `mut.gg returned ${r.status}`, html: null };
  }
  const html = await r.text();
  return { error: null, html };
}

// Parse HTML for embedded JSON (__NUXT__, __NEXT_DATA__)
function tryExtractEmbeddedJson(html) {
  // Look for __NEXT_DATA__
  const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextMatch) {
    try {
      const data = JSON.parse(nextMatch[1]);
      const found = findPlayerArray(data, 0);
      if (found) return found;
    } catch (e) { /* continue */ }
  }

  // Look for __NUXT__ payload
  const nuxtMatch = html.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/);
  if (nuxtMatch) {
    try {
      const data = JSON.parse(nuxtMatch[1]);
      const found = findPlayerArray(data, 0);
      if (found) return found;
    } catch (e) { /* continue */ }
  }

  // Look for inline JSON with player data
  const inlineMatch = html.match(/\[[\s\S]{50,5000}?"name"[\s\S]*?"ovr"[\s\S]*?\]/);
  if (inlineMatch) {
    try {
      const arr = JSON.parse(inlineMatch[0]);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch (e) { /* continue */ }
  }

  return null;
}

// Recursively find an array of player-like objects in a JSON tree
function findPlayerArray(obj, depth) {
  if (depth > 8 || !obj) return null;
  if (Array.isArray(obj) && obj.length > 0 && obj[0] &&
      (obj[0].name || obj[0].full_name || obj[0].player_name) &&
      (obj[0].ovr || obj[0].overall || obj[0].rating)) {
    return obj;
  }
  if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      const found = findPlayerArray(obj[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

// Parse HTML with cheerio for DOM-based player extraction
function parsePlayersFromHtml(html, slug) {
  const $ = cheerio.load(html);
  const results = [];

  function clean(text) {
    return (text || "").trim().replace(/\s+/g, " ");
  }

  // Primary strategy: mut.gg uses .player-list-item-usage containers
  $(".player-list-item-usage").each(function () {
    if (results.length >= 5) return false;
    const $item = $(this);

    // Name
    const first = clean($item.find(".player-list-item__name-first").text());
    const last = clean($item.find(".player-list-item__name-last").text());
    const name = `${first} ${last}`.trim();
    if (!name) return;

    // OVR
    const ovr = parseInt(clean($item.find(".player-list-item__score-value").text())) || 0;

    // Program / Card
    const card = clean($item.find(".player-list-item__program").text());

    // Archetype
    const arch = clean($item.find(".player-list-item__archetype").text());

    // Starting %
    const startText = clean($item.find(".player-list-item-usage__percentage-value").text());
    const start = parseFloat(startText) || 0;

    // BND flag
    const allText = clean($item.text());
    const bnd = allText.includes("BND") || allText.includes("NAT");

    // Stats (stat-name/stat-value pairs)
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

// Strategy 3: Puppeteer fallback (lazy-loaded to avoid import errors if not needed)
async function tryPuppeteer(slug) {
  let chromium, puppeteer;
  try {
    chromium = (await import("@sparticuz/chromium")).default;
    puppeteer = (await import("puppeteer-core")).default;
  } catch (e) {
    return { error: `Failed to load Puppeteer/Chromium: ${e.message}`, players: [] };
  }

  let browser = null;
  try {
    const executablePath = await chromium.executablePath();
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: "shell",
    });

    const page = await browser.newPage();
    await page.setUserAgent(BROWSER_UA);

    const url = `https://www.mut.gg/players/best/${slug}/?max_ratings=on`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    // Get the rendered HTML and parse with cheerio
    const html = await page.content();
    const expectedStats = STAT_MAP[slug] || [];

    // Try embedded JSON first
    const jsonPlayers = tryExtractEmbeddedJson(html);
    if (jsonPlayers) {
      return { error: null, players: jsonPlayers.slice(0, 5).map(p => normalizeJsonPlayer(p, slug)) };
    }

    // Parse rendered DOM with cheerio
    const players = parsePlayersFromHtml(html, slug);
    if (players.length > 0) {
      return { error: null, players };
    }

    // Debug: capture page info
    const $ = cheerio.load(html);
    const debug = {
      title: $("title").text(),
      bodyClasses: $("body").attr("class") || "",
      htmlLength: html.length,
      sampleClasses: [...new Set($("[class]").map((i, el) => $(el).attr("class")).get())].slice(0, 30),
    };
    return { error: "Could not parse players from rendered page", players: [], debug };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

export default async function handler(req, res) {
  const slug = (req.query.pos || "").toLowerCase();
  const debug = req.query.debug === "1";

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

  const strategies = [];

  // Strategy 1: Try JSON API
  try {
    const jsonPlayers = await tryJsonApi(slug);
    if (jsonPlayers) {
      const players = jsonPlayers.slice(0, 5).map(p => normalizeJsonPlayer(p, slug));
      const result = { position: slug, updated: new Date().toISOString(), players, error: null, strategy: "json-api" };
      cache.set(slug, { data: result, timestamp: Date.now() });
      return res.status(200).json(result);
    }
    strategies.push("json-api: no data");
  } catch (e) {
    strategies.push(`json-api: ${e.message}`);
  }

  // Strategy 2: Fetch HTML directly + cheerio
  try {
    const { error, html } = await tryHtmlScrape(slug);
    if (html) {
      // Try embedded JSON in the HTML
      const jsonPlayers = tryExtractEmbeddedJson(html);
      if (jsonPlayers) {
        const players = jsonPlayers.slice(0, 5).map(p => normalizeJsonPlayer(p, slug));
        const result = { position: slug, updated: new Date().toISOString(), players, error: null, strategy: "embedded-json" };
        cache.set(slug, { data: result, timestamp: Date.now() });
        return res.status(200).json(result);
      }

      // Parse HTML with cheerio
      const players = parsePlayersFromHtml(html, slug);
      if (players.length > 0) {
        const result = { position: slug, updated: new Date().toISOString(), players: players.slice(0, 5), error: null, strategy: "cheerio" };
        cache.set(slug, { data: result, timestamp: Date.now() });
        return res.status(200).json(result);
      }
      if (debug) {
        const $d = cheerio.load(html);
        // Find all classes containing player/card/stat/best/rank keywords
        const relevantClasses = [...new Set($d("[class]").map((i, el) => $d(el).attr("class")).get())]
          .filter(c => /player|card|stat|best|rank|leaderboard|ovr|overall|rating|start|lineup/i.test(c));
        // Find links with player hrefs
        const playerLinks = $d("a[href*='/player']").map((i, el) => ({
          href: $d(el).attr("href"),
          text: $d(el).text().trim().substring(0, 50),
          parentClass: $d(el).parent().attr("class") || "",
        })).get().slice(0, 15);
        // Get body HTML around where player data might be (search for "OVR" or percentage patterns)
        const bodyHtml = $d("body").html() || "";
        const ovrIdx = bodyHtml.indexOf("OVR");
        const pctIdx = bodyHtml.indexOf("%");
        const debugInfo = {
          htmlLength: html.length,
          title: html.match(/<title>(.*?)<\/title>/)?.[1] || "",
          relevantClasses: relevantClasses.slice(0, 30),
          playerLinks,
          htmlAroundOvr: ovrIdx > -1 ? bodyHtml.substring(Math.max(0, ovrIdx - 500), ovrIdx + 1000) : "no OVR found",
          htmlAroundPct: pctIdx > -1 ? bodyHtml.substring(Math.max(0, pctIdx - 500), pctIdx + 500) : "no % found",
          candidatePlayers: players,
        };
        strategies.push(debugInfo);
      }
      strategies.push(`html: fetched (${html.length} bytes) but no valid players parsed (${players.length} candidates rejected)`);
    } else {
      strategies.push(`html: ${error}`);
    }
  } catch (e) {
    strategies.push(`html: ${e.message}`);
  }

  // Strategy 3: Puppeteer (heavy, last resort)
  try {
    const { error, players, debug } = await tryPuppeteer(slug);
    if (players && players.length > 0) {
      const result = { position: slug, updated: new Date().toISOString(), players: players.slice(0, 5), error: null, strategy: "puppeteer" };
      cache.set(slug, { data: result, timestamp: Date.now() });
      return res.status(200).json(result);
    }
    strategies.push(`puppeteer: ${error || "no players"}`);
    if (debug) strategies.push(`debug: ${JSON.stringify(debug)}`);
  } catch (e) {
    strategies.push(`puppeteer: ${e.message}`);
  }

  // All strategies failed
  return res.status(200).json({
    position: slug,
    updated: new Date().toISOString(),
    players: [],
    error: "All scraping strategies failed",
    strategies,
  });
}

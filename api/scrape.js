import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

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
const BROWSER_HEADERS = {
  "User-Agent": BROWSER_UA,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Referer": "https://www.google.com/",
  "Cache-Control": "no-cache",
};

// In-memory cache: slug -> { data, timestamp }
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Strategy 0: Try fetching mut.gg with a JSON Accept header or known API paths
// Many Nuxt/Django sites have an internal API that returns JSON directly
async function tryJsonApi(slug) {
  const urls = [
    `https://www.mut.gg/api/players/best/${slug}/`,
    `https://www.mut.gg/players/best/${slug}/?format=json`,
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: { ...BROWSER_HEADERS, "Accept": "application/json" },
      });
      if (!r.ok) continue;
      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("json")) continue;
      const data = await r.json();
      // Try to extract player array from common response shapes
      const arr = data.players || data.results || data.data || (Array.isArray(data) ? data : null);
      if (arr && Array.isArray(arr) && arr.length > 0) return arr;
    } catch (e) { /* continue to next URL */ }
  }
  return null;
}

// Normalize a player object from a JSON API response
function normalizeJsonPlayer(raw, slug) {
  const expectedStats = STAT_MAP[slug] || [];
  const s = {};
  for (const stat of expectedStats) {
    const key = stat.toLowerCase();
    // Try common field name patterns
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

  const expectedStats = STAT_MAP[slug] || [];

  // Strategy 0: Try JSON API first (fastest, no browser needed)
  try {
    const jsonPlayers = await tryJsonApi(slug);
    if (jsonPlayers) {
      const players = jsonPlayers.slice(0, 5).map(p => normalizeJsonPlayer(p, slug));
      const result = { position: slug, updated: new Date().toISOString(), players, error: null };
      cache.set(slug, { data: result, timestamp: Date.now() });
      return res.status(200).json(result);
    }
  } catch (e) { /* fall through to Puppeteer */ }

  // Strategy 1+: Use Puppeteer to render the page and extract data
  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent(BROWSER_UA);

    // Use max_ratings=on to get fully boosted stats
    const url = `https://www.mut.gg/players/best/${slug}/?max_ratings=on`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });

    // Wait for JS rendering
    await new Promise(r => setTimeout(r, 2000));

    // Extract player data from the rendered page
    const players = await page.evaluate((expectedStats) => {
      const results = [];

      function clean(text) {
        return (text || "").trim().replace(/\s+/g, " ");
      }

      // Sub-strategy A: Try to find embedded JSON data (__NUXT__, __NEXT_DATA__, inline scripts)
      const scripts = document.querySelectorAll("script");
      for (const script of scripts) {
        const text = script.textContent || "";
        // Look for __NUXT__ payload
        if (text.includes("__NUXT__") || text.includes("__NEXT_DATA__")) {
          try {
            let jsonStr = "";
            if (text.includes("__NEXT_DATA__")) {
              jsonStr = text;
            } else {
              // Nuxt: window.__NUXT__= or __NUXT__=
              const match = text.match(/__NUXT__\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
              if (match) jsonStr = match[1];
            }
            if (jsonStr) {
              // Try to find player data in the JSON
              const findPlayers = (obj, depth) => {
                if (depth > 8 || !obj) return null;
                if (Array.isArray(obj) && obj.length > 0 && obj[0] && (obj[0].name || obj[0].full_name) && (obj[0].ovr || obj[0].overall)) {
                  return obj;
                }
                if (typeof obj === "object") {
                  for (const key of Object.keys(obj)) {
                    const found = findPlayers(obj[key], depth + 1);
                    if (found) return found;
                  }
                }
                return null;
              };
              const parsed = JSON.parse(jsonStr);
              const found = findPlayers(parsed, 0);
              if (found && found.length > 0) {
                return { __jsonData: found };
              }
            }
          } catch (e) { /* parsing failed, continue */ }
        }

        // Look for inline JSON arrays containing player-like objects
        if (text.includes("starting") && text.includes("ovr")) {
          try {
            const arrMatch = text.match(/\[[\s\S]*?"name"[\s\S]*?"ovr"[\s\S]*?\]/);
            if (arrMatch) {
              const arr = JSON.parse(arrMatch[0]);
              if (Array.isArray(arr) && arr.length > 0) return { __jsonData: arr };
            }
          } catch (e) { /* continue */ }
        }
      }

      // Also check for __NEXT_DATA__ script tag by ID
      const nextData = document.getElementById("__NEXT_DATA__");
      if (nextData) {
        try {
          const parsed = JSON.parse(nextData.textContent);
          const findPlayers = (obj, depth) => {
            if (depth > 8 || !obj) return null;
            if (Array.isArray(obj) && obj.length > 0 && obj[0] && (obj[0].name || obj[0].full_name) && (obj[0].ovr || obj[0].overall)) {
              return obj;
            }
            if (typeof obj === "object") {
              for (const key of Object.keys(obj)) {
                const found = findPlayers(obj[key], depth + 1);
                if (found) return found;
              }
            }
            return null;
          };
          const found = findPlayers(parsed, 0);
          if (found && found.length > 0) return { __jsonData: found };
        } catch (e) { /* continue */ }
      }

      // Sub-strategy B: Table-based DOM parsing
      let playerElements = document.querySelectorAll("table tbody tr");

      if (playerElements.length >= 1) {
        for (let i = 0; i < Math.min(playerElements.length, 5); i++) {
          const row = playerElements[i];
          const cells = row.querySelectorAll("td");
          if (cells.length < 3) continue;

          const allText = clean(row.textContent);

          let ovr = 0;
          const ovrEl = row.querySelector("[class*='ovr'], [class*='overall'], [class*='rating']");
          if (ovrEl) {
            ovr = parseInt(clean(ovrEl.textContent)) || 0;
          } else {
            for (let c = 0; c < Math.min(cells.length, 3); c++) {
              const n = parseInt(clean(cells[c].textContent));
              if (n >= 80 && n <= 99) { ovr = n; break; }
            }
          }

          let name = "";
          const nameLink = row.querySelector("a[href*='/player/'], a[href*='/players/']");
          if (nameLink) {
            name = clean(nameLink.textContent);
          } else {
            const nameEl = row.querySelector("[class*='name'], [class*='player']");
            if (nameEl) name = clean(nameEl.textContent);
          }

          let card = "";
          const cardEl = row.querySelector("[class*='program'], [class*='promo'], [class*='set']");
          if (cardEl) card = clean(cardEl.textContent);

          let arch = "";
          const archEl = row.querySelector("[class*='archetype'], [class*='arch']");
          if (archEl) arch = clean(archEl.textContent);

          let start = 0;
          const startMatch = allText.match(/(\d+\.?\d*)%/);
          if (startMatch) start = parseFloat(startMatch[1]);

          const bnd = allText.includes("BND") || allText.includes("NAT");

          const s = {};
          const statEls = row.querySelectorAll("[class*='stat'], [class*='attribute'] .value, td:not(:first-child)");
          const statValues = [];
          statEls.forEach(el => {
            const n = parseInt(clean(el.textContent));
            if (n >= 50 && n <= 99) statValues.push(n);
          });
          for (let si = 0; si < expectedStats.length && si < statValues.length; si++) {
            s[expectedStats[si]] = statValues[si];
          }

          if (name || ovr) {
            results.push({ name: name || "Unknown", card, ovr, arch, start, bnd, s });
          }
        }
      }

      // Sub-strategy C: Card/div-based layout
      if (results.length === 0) {
        const cardSelectors = [
          "[class*='player-card']", "[class*='player-item']", "[class*='player-row']",
          "[class*='best-player']", "[class*='PlayerCard']", "[class*='PlayerItem']",
          ".card", ".item", ".player",
          "[class*='leaderboard'] [class*='item']", "[class*='ranking'] [class*='item']",
        ];

        let cards = [];
        for (const sel of cardSelectors) {
          cards = document.querySelectorAll(sel);
          if (cards.length >= 1) break;
        }

        for (let i = 0; i < Math.min(cards.length, 5); i++) {
          const card = cards[i];
          const allText = clean(card.textContent);

          let ovr = 0;
          const ovrEl = card.querySelector("[class*='ovr'], [class*='overall'], [class*='rating']");
          if (ovrEl) ovr = parseInt(clean(ovrEl.textContent)) || 0;

          let name = "";
          const nameEl = card.querySelector("[class*='name'], a[href*='/player']");
          if (nameEl) name = clean(nameEl.textContent);

          let cardName = "";
          const progEl = card.querySelector("[class*='program'], [class*='promo'], [class*='set'], [class*='card-type']");
          if (progEl) cardName = clean(progEl.textContent);

          let arch = "";
          const archEl = card.querySelector("[class*='archetype'], [class*='arch'], [class*='position-type']");
          if (archEl) arch = clean(archEl.textContent);

          let start = 0;
          const startMatch = allText.match(/(\d+\.?\d*)%/);
          if (startMatch) start = parseFloat(startMatch[1]);

          const bnd = allText.includes("BND") || allText.includes("NAT");

          const s = {};
          const statValues = [];
          const statEls = card.querySelectorAll("[class*='stat'] [class*='value'], [class*='stat-val'], [class*='attribute-value']");
          statEls.forEach(el => {
            const n = parseInt(clean(el.textContent));
            if (n >= 50 && n <= 99) statValues.push(n);
          });
          for (let si = 0; si < expectedStats.length && si < statValues.length; si++) {
            s[expectedStats[si]] = statValues[si];
          }

          if (name || ovr) {
            results.push({ name: name || "Unknown", card: cardName, ovr, arch, start, bnd, s });
          }
        }
      }

      // Sub-strategy D: Generic link-based fallback
      if (results.length === 0) {
        const links = document.querySelectorAll("a[href*='/player']");
        const seen = new Set();
        for (let i = 0; i < links.length && results.length < 5; i++) {
          const link = links[i];
          const name = clean(link.textContent);
          if (!name || name.length < 3 || name.length > 40 || seen.has(name)) continue;
          seen.add(name);

          let container = link.closest("tr, [class*='card'], [class*='item'], [class*='row'], div");
          if (!container) continue;

          const allText = clean(container.textContent);
          let ovr = 0;
          const ovrMatch = allText.match(/\b(8\d|9\d)\b/);
          if (ovrMatch) ovr = parseInt(ovrMatch[0]);

          let start = 0;
          const startMatch = allText.match(/(\d+\.?\d*)%/);
          if (startMatch) start = parseFloat(startMatch[1]);

          const bnd = allText.includes("BND") || allText.includes("NAT");

          results.push({ name, card: "", ovr, arch: "", start, bnd, s: {} });
        }
      }

      // If still nothing, capture page structure for debugging
      if (results.length === 0) {
        const body = document.body;
        const debug = {
          title: document.title,
          url: window.location.href,
          bodyClasses: body.className,
          childTags: [...body.children].slice(0, 10).map(el => ({
            tag: el.tagName,
            className: el.className,
            id: el.id,
            childCount: el.children.length,
            textPreview: el.textContent.substring(0, 300),
          })),
          allClassNames: [...new Set([...document.querySelectorAll("[class]")].map(el => el.className).filter(c => c))].slice(0, 50),
        };
        return { __debug: debug };
      }

      return results;
    }, expectedStats);

    // Handle embedded JSON data found via script tags
    if (players.__jsonData) {
      const normalized = players.__jsonData.slice(0, 5).map(p => normalizeJsonPlayer(p, slug));
      const result = { position: slug, updated: new Date().toISOString(), players: normalized, error: null };
      cache.set(slug, { data: result, timestamp: Date.now() });
      return res.status(200).json(result);
    }

    // Handle debug output (page structure didn't match any strategy)
    if (players.__debug) {
      return res.status(200).json({
        position: slug,
        updated: new Date().toISOString(),
        players: [],
        error: "Could not parse player data from mut.gg. Page structure may have changed.",
        debug: players.__debug,
      });
    }

    const result = {
      position: slug,
      updated: new Date().toISOString(),
      players: Array.isArray(players) ? players.slice(0, 5) : [],
      error: null,
    };

    cache.set(slug, { data: result, timestamp: Date.now() });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      position: slug,
      updated: new Date().toISOString(),
      players: [],
      error: `Scrape failed: ${err.message}`,
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}


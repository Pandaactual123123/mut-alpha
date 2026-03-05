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

// In-memory cache: slug -> { data, timestamp }
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

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

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    );

    const url = `https://www.mut.gg/players/best/${slug}/`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });

    // Wait a bit for any late JS rendering
    await page.waitForTimeout(2000);

    const expectedStats = STAT_MAP[slug] || [];

    // Extract player data from the rendered page
    const players = await page.evaluate((expectedStats) => {
      const results = [];

      // Strategy: Look for player card/row elements on the "best players" page.
      // mut.gg typically shows player items in list/card format.
      // We'll try multiple selector strategies to find player data.

      // Helper: extract number from text
      function parseNum(text) {
        if (!text) return 0;
        const m = text.match(/[\d.]+/);
        return m ? parseFloat(m[0]) : 0;
      }

      // Helper: clean text
      function clean(text) {
        return (text || "").trim().replace(/\s+/g, " ");
      }

      // Strategy 1: Look for common player card patterns
      // Try table rows first (many sports DB sites use tables)
      let playerElements = document.querySelectorAll("table tbody tr");

      if (playerElements.length >= 1) {
        // Table-based layout
        for (let i = 0; i < Math.min(playerElements.length, 5); i++) {
          const row = playerElements[i];
          const cells = row.querySelectorAll("td");
          if (cells.length < 3) continue;

          const allText = clean(row.textContent);

          // Try to extract OVR (2-digit number, typically 85-99)
          let ovr = 0;
          const ovrEl = row.querySelector("[class*='ovr'], [class*='overall'], [class*='rating']");
          if (ovrEl) {
            ovr = parseInt(clean(ovrEl.textContent)) || 0;
          } else {
            // Look for a standalone 2-digit number in early cells
            for (let c = 0; c < Math.min(cells.length, 3); c++) {
              const n = parseInt(clean(cells[c].textContent));
              if (n >= 80 && n <= 99) { ovr = n; break; }
            }
          }

          // Try to find player name via links or specific elements
          let name = "";
          const nameLink = row.querySelector("a[href*='/player/'], a[href*='/players/']");
          if (nameLink) {
            name = clean(nameLink.textContent);
          } else {
            // Look for the most prominent text element
            const nameEl = row.querySelector("[class*='name'], [class*='player']");
            if (nameEl) name = clean(nameEl.textContent);
          }

          // Program/card name
          let card = "";
          const cardEl = row.querySelector("[class*='program'], [class*='promo'], [class*='set']");
          if (cardEl) card = clean(cardEl.textContent);

          // Archetype
          let arch = "";
          const archEl = row.querySelector("[class*='archetype'], [class*='arch']");
          if (archEl) arch = clean(archEl.textContent);

          // Starting %
          let start = 0;
          const startMatch = allText.match(/(\d+\.?\d*)%/);
          if (startMatch) start = parseFloat(startMatch[1]);

          // BND indicator
          const bnd = allText.includes("BND") || allText.includes("NAT");

          // Stats - look for stat values in order
          const s = {};
          const statEls = row.querySelectorAll("[class*='stat'], [class*='attribute'] .value, td:not(:first-child)");
          const statValues = [];
          statEls.forEach(el => {
            const n = parseInt(clean(el.textContent));
            if (n >= 50 && n <= 99) statValues.push(n);
          });

          // Map stat values to expected stat names
          for (let si = 0; si < expectedStats.length && si < statValues.length; si++) {
            s[expectedStats[si]] = statValues[si];
          }

          if (name || ovr) {
            results.push({ name: name || "Unknown", card, ovr, arch, start, bnd, s });
          }
        }
      }

      // Strategy 2: Card/div-based layout (if table didn't work)
      if (results.length === 0) {
        // Look for card-like containers
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

      // Strategy 3: Generic fallback — scan for any structured repeating elements
      if (results.length === 0) {
        // Get all links that might be player links
        const links = document.querySelectorAll("a[href*='/player']");
        const seen = new Set();
        for (let i = 0; i < links.length && results.length < 5; i++) {
          const link = links[i];
          const name = clean(link.textContent);
          if (!name || name.length < 3 || name.length > 40 || seen.has(name)) continue;
          seen.add(name);

          // Walk up to find the container
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
          bodyClasses: body.className,
          childTags: [...body.children].slice(0, 10).map(el => ({
            tag: el.tagName,
            className: el.className,
            id: el.id,
            childCount: el.children.length,
            textPreview: el.textContent.substring(0, 200),
          })),
        };
        return { __debug: debug };
      }

      return results;
    }, expectedStats);

    // Handle debug output (page structure didn't match any strategy)
    if (players.__debug) {
      const result = {
        position: slug,
        updated: new Date().toISOString(),
        players: [],
        error: "Could not parse player data from mut.gg. Page structure may have changed.",
        debug: players.__debug,
      };
      return res.status(200).json(result);
    }

    const result = {
      position: slug,
      updated: new Date().toISOString(),
      players: Array.isArray(players) ? players.slice(0, 5) : [],
      error: null,
    };

    // Update cache
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

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set in environment variables." });
  }

  const { label, pos, sub } = req.body;
  if (!label) {
    return res.status(400).json({ error: "Missing label parameter." });
  }

  // Position-specific extra fields for the prompt
  let posExtra = "";
  if (pos === "QB") {
    posExtra = ` Each QB object must also include: "rel" (the throwing animation name exactly as listed on mut.gg, e.g. "Slinger 1", "Traditional 4", "Generic 1", "Slinger 3", "Generic 3", "Traditional 5", "Slinger 4"), "abilities" (array of objects with "name" and "ap" fields for each equipped ability, e.g. [{"name":"Set Feet Lead","ap":1},{"name":"Gunslinger","ap":0}]). Also include "AGI" (agility) inside the "s" stats object alongside the other stats.`;
  } else if (pos === "HB" && sub === "Elusive") {
    posExtra = ` The "s" stats object MUST include these keys: "SPD" (speed), "ACC" (acceleration), "COD" (change of direction), "REC" (receiving), "ELU" (elusiveness). Focus on elusive/receiving backs.`;
  } else if (pos === "HB" && sub === "Power") {
    posExtra = ` Each object must also include "wgt" (player weight in lbs as integer). The "s" stats object MUST include: "SPD" (speed), "BTK" (break tackle), "SFA" (stiff arm), "TRK" (trucking). Focus on power/bruiser backs.`;
  } else if (pos === "OL") {
    posExtra = ` Each object must also include "wgt" (player weight in lbs as integer). The "s" stats object MUST include: "PBK" (pass block), "RBK" (run block), "AWR" (awareness), "STR" (strength), "IBL" (impact blocking), "SPD" (speed).`;
  } else if (pos === "DL" && (sub === "LEDG" || sub === "REDG")) {
    posExtra = ` Each object must also include "traits" (object with boolean keys: "bullRush", "swim", "spin" — true if the player has that pass rush trait on mut.gg). The "s" stats object MUST include: "SPD" (speed), "ACC" (acceleration), "PMV" (power move), "FMV" (finesse move), "STR" (strength).`;
  } else if (pos === "DL" && sub === "DT") {
    posExtra = ` Each object must also include "wgt" (player weight in lbs as integer). The "s" stats object MUST include: "BSH" (block shed), "PMV" (power move), "STR" (strength), "TAK" (tackle), "SPD" (speed).`;
  } else if (pos === "DB") {
    posExtra = ` Each object must also include "dna" (movement DNA archetype from mut.gg, e.g. "Glitchy", "Standard", "Heavy") and "abilities" (array of objects with "name" and "ap" fields for equipped abilities, e.g. [{"name":"One Step Ahead","ap":0}]). The "s" stats object MUST include: "SPD" (speed), "MCV" (man coverage), "ZCV" (zone coverage), "PRS" (press), "TAK" (tackle), "POW" (hit power), "JMP" (jump).`;
  }

  const sys = `You are a Madden 26 MUT data assistant. You search mut.gg for the best ${label} in Madden 26 MUT.

CRITICAL RULES:
1. Search mut.gg for the top 5 ${label} by starting percentage.
2. Your FINAL message MUST contain ONLY a JSON array — no explanation, no markdown, no backticks.
3. Each object format: {"name":"Player Name","card":"Card Program","ovr":96,"arch":"Archetype","start":17.0,"price":42500,"s":{"STAT1":99,"STAT2":98}}
4. "price" = current MUT auction house buy-now price in coins as integer (0 if unavailable).
5. "start" = starting percentage as a decimal (e.g. 17.5 not "17.5%").
6. Use stat abbreviations exactly as shown on mut.gg.${posExtra}

REMEMBER: Output ONLY the JSON array. Nothing else. No text before or after.`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: sys,
        messages: [
          {
            role: "user",
            content: `Search mut.gg for the current top 5 best ${label} in MUT 26 by starting percentage. After searching, respond with ONLY a raw JSON array. No explanation.`,
          },
        ],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });

    if (!anthropicRes.ok) {
      const errData = await anthropicRes.json();
      return res.status(anthropicRes.status).json({ error: "Anthropic API error", detail: errData });
    }

    const data = await anthropicRes.json();

    // Extract all text blocks from the response
    const textBlocks = (data.content || [])
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n");

    // Try to extract a JSON array from the text
    let players = null;

    // Method 1: Try parsing the whole text directly
    try {
      const cleaned = textBlocks.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) players = parsed;
    } catch (_) {}

    // Method 2: Find JSON array pattern in the text
    if (!players) {
      const match = textBlocks.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length > 0) players = parsed;
        } catch (_) {}
      }
    }

    if (players) {
      // Return clean response in the format the app expects
      return res.status(200).json({
        content: [{ type: "text", text: JSON.stringify(players) }]
      });
    }

    // If we couldn't extract JSON, return the raw response for debugging
    return res.status(200).json({
      content: [{ type: "text", text: "[]" }],
      _debug: {
        rawText: textBlocks.substring(0, 500),
        blockCount: (data.content || []).length,
        stopReason: data.stop_reason
      }
    });

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Proxy request failed.", detail: err.message });
  }
}

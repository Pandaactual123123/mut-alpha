export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(200).json({ status: "FAIL", issue: "No API key" });

  // Test the exact same flow as proxy.js but for QBs
  const label = "Quarterbacks";
  const sys = `You are a Madden 26 MUT data assistant. You search mut.gg for the best ${label} in Madden 26 MUT.

CRITICAL RULES:
1. Search mut.gg for the top 5 ${label} by starting percentage.
2. Your FINAL message MUST contain ONLY a JSON array — no explanation, no markdown, no backticks.
3. Each object format: {"name":"Player Name","card":"Card Program","ovr":96,"arch":"Archetype","start":17.0,"price":42500,"s":{"SPD":99,"THP":98}}
4. "price" = current MUT auction house buy-now price in coins as integer (0 if unavailable).
5. "start" = starting percentage as a decimal (e.g. 17.5 not "17.5%").
6. Use stat abbreviations exactly as shown on mut.gg. Each QB object must also include: "rel" (the throwing animation name exactly as listed on mut.gg), "abilities" (array of objects with "name" and "ap" fields). Also include "AGI" (agility) inside the "s" stats object.

REMEMBER: Output ONLY the JSON array. Nothing else. No text before or after.`;

  const start = Date.now();
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

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const data = await anthropicRes.json();

    // Extract text blocks (same as proxy)
    const textBlocks = (data.content || [])
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n");

    // Try JSON extraction (same as proxy)
    let players = null;
    let parseMethod = "none";

    try {
      const cleaned = textBlocks.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        players = parsed;
        parseMethod = "direct";
      }
    } catch (_) {}

    if (!players) {
      const match = textBlocks.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            players = parsed;
            parseMethod = "regex";
          }
        } catch (_) {}
      }
    }

    return res.status(200).json({
      elapsed: elapsed + "s",
      apiStatus: anthropicRes.status,
      stopReason: data.stop_reason,
      totalBlocks: (data.content || []).length,
      textBlocks: (data.content || []).filter(b => b.type === "text").length,
      parseMethod,
      playersFound: players ? players.length : 0,
      firstPlayer: players ? players[0] : null,
      rawTextPreview: textBlocks.substring(0, 600),
    });
  } catch (err) {
    return res.status(200).json({
      elapsed: ((Date.now() - start) / 1000).toFixed(1) + "s",
      error: err.message
    });
  }
}

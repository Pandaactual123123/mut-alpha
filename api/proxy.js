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

  const sys = `You search mut.gg for the best ${label} in Madden 26 MUT. Return ONLY a valid JSON array of the top 5 players. Each object must include: {"name":"...","card":"...","ovr":96,"arch":"...","start":17.0,"price":42500,"s":{"STAT1":99,"STAT2":98,...}}. The "price" field is the current MUT auction house buy-now price in coins as a plain integer (e.g. 42500). If no price is available use 0. Use the stat abbreviations from mut.gg.${posExtra} No markdown, no backticks, no text outside the JSON array.`;

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
        max_tokens: 1500,
        system: sys,
        messages: [
          {
            role: "user",
            content: `Search mut.gg for the current top 5 best ${label} in MUT 26 by starting percentage. Return JSON array only.`,
          },
        ],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });

    const data = await anthropicRes.json();
    return res.status(anthropicRes.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Proxy request failed.", detail: err.message });
  }
}

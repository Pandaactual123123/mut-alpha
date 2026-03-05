export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(200).json({ status: "FAIL", issue: "No API key" });

  const start = Date.now();
  try {
    const testRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: "You search mut.gg for the best Quarterbacks in Madden 26 MUT. Return ONLY a valid JSON array of the top 2 players. Each object: {\"name\":\"...\",\"ovr\":96,\"s\":{\"SPD\":90}}. No markdown.",
        messages: [{ role: "user", content: "Search mut.gg for the top 2 QBs in MUT 26. Return JSON array only." }],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const data = await testRes.json();

    return res.status(200).json({
      status: testRes.ok ? "OK" : "FAIL",
      apiStatus: testRes.status,
      elapsed: elapsed + "s",
      responseType: data.type || "unknown",
      stopReason: data.stop_reason || "none",
      contentBlocks: data.content ? data.content.length : 0,
      textPreview: data.content?.filter(b => b.type === "text").map(b => b.text.substring(0, 200)).join(" | ") || "no text",
      error: data.error || null
    });
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return res.status(200).json({
      status: "FAIL",
      elapsed: elapsed + "s",
      error: err.message
    });
  }
}

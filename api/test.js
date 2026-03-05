export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Check 1: Is the API key set?
  if (!apiKey) {
    return res.status(200).json({
      status: "FAIL",
      issue: "ANTHROPIC_API_KEY is NOT set in Vercel environment variables",
      fix: "Go to Vercel dashboard → mut-alpha → Settings → Environment Variables → Add ANTHROPIC_API_KEY"
    });
  }

  // Check 2: Can we reach Anthropic API?
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
        max_tokens: 50,
        messages: [{ role: "user", content: "Say OK" }],
      }),
    });

    const data = await testRes.json();

    if (testRes.ok) {
      return res.status(200).json({
        status: "OK",
        message: "API key works! Anthropic API responded successfully.",
        apiStatus: testRes.status
      });
    } else {
      return res.status(200).json({
        status: "FAIL",
        issue: "Anthropic API returned an error",
        apiStatus: testRes.status,
        error: data
      });
    }
  } catch (err) {
    return res.status(200).json({
      status: "FAIL",
      issue: "Could not connect to Anthropic API",
      error: err.message
    });
  }
}

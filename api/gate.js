// GET  /api/gate          -> { enabled, authed }   (lets the SPA decide whether to prompt)
// POST /api/gate {password} -> sets the gate cookie on a correct password
import { gateEnabled, issueGateCookie, checkGate, checkPassword } from "./_lib/gate.js";

export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ enabled: gateEnabled(), authed: checkGate(req).ok });
  }
  if (req.method === "POST") {
    if (!gateEnabled()) return res.status(400).json({ error: "Gate is not configured." });
    const { password } = req.body || {};
    if (!checkPassword(password)) return res.status(401).json({ error: "Incorrect password." });
    res.setHeader("Set-Cookie", issueGateCookie());
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: "Method not allowed" });
}

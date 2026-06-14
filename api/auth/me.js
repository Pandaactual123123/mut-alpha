// GET /api/auth/me — returns the current safe user, or 401 if not signed in.

import { getUserFromReq, safeUser } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "Not authenticated." });
    return res.status(200).json({ user: safeUser(user) });
  } catch (err) {
    // Fail closed (e.g. AUTH_SECRET missing). Log detail server-side only.
    console.error("me error:", err.message);
    return res.status(500).json({ error: "Auth check failed." });
  }
}

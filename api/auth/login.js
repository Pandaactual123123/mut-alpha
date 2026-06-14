// POST /api/auth/login  { email, password }
// Verifies credentials, sets the session cookie, returns the safe user.
// Uses a single generic error for both unknown-email and bad-password so the
// response can't be used to enumerate which emails are registered.

import { getUserByEmail } from "../_lib/store.js";
import { verifyPassword, hashPassword, signSession, sessionCookie, safeUser } from "../_lib/auth.js";

const INVALID = "Invalid email or password.";
// Decoy hash so the no-such-user branch still runs one scrypt — keeps login
// timing uniform whether or not the email exists (anti-enumeration).
const DECOY = hashPassword(randomToken());
function randomToken() { return Math.random().toString(36) + Date.now(); }

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body || {};
  const e = String(email || "").trim().toLowerCase();
  if (!e || typeof password !== "string") return res.status(401).json({ error: INVALID });

  try {
    const user = await getUserByEmail(e);
    // Always run one scrypt — against the real user or the decoy — so response
    // timing doesn't reveal whether the email is registered.
    const ok = user
      ? verifyPassword(password, user.passwordHash, user.salt)
      : (verifyPassword(password, DECOY.hash, DECOY.salt), false);
    if (!user || !ok) return res.status(401).json({ error: INVALID });

    const token = signSession({ sub: user.id });
    res.setHeader("Set-Cookie", sessionCookie(token));
    return res.status(200).json({ user: safeUser(user) });
  } catch (err) {
    console.error("login error:", err.message);
    return res.status(500).json({ error: "Login failed." });
  }
}

// POST /api/auth/signup  { email, password }
// Validates, rejects existing users, hashes the password, creates the user, sets
// the session cookie, and returns the safe user (never passwordHash/salt).

import { getUserByEmail, createUser } from "../_lib/store.js";
import { hashPassword, signSession, sessionCookie, safeUser } from "../_lib/auth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body || {};
  const e = String(email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(e)) return res.status(400).json({ error: "Invalid email address." });
  if (typeof password !== "string" || password.length < 8)
    return res.status(400).json({ error: "Password must be at least 8 characters." });

  try {
    if (await getUserByEmail(e)) return res.status(409).json({ error: "An account with that email already exists." });

    const { hash, salt } = hashPassword(password);
    const user = await createUser({ email: e, passwordHash: hash, salt });

    const token = signSession({ sub: user.id });
    res.setHeader("Set-Cookie", sessionCookie(token));
    return res.status(200).json({ user: safeUser(user) });
  } catch (err) {
    // Fail closed (e.g. AUTH_SECRET missing). Log detail server-side only.
    console.error("signup error:", err.message);
    return res.status(500).json({ error: "Signup failed." });
  }
}

// Auth helpers — password hashing, JWT-style HMAC sessions, cookies.
//
// No third-party crypto libs: password hashing uses scrypt, sessions use
// HMAC-SHA256, both from node:crypto. Signatures and password checks are
// constant-time (timingSafeEqual).
//
// FAIL CLOSED: signSession/verifySession throw if AUTH_SECRET is unset. There is
// NO default signing secret — a missing secret must surface as an error, never a
// silently-insecure fallback.

import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from "node:crypto";

import { getUserById } from "./store.js";

const SESSION_COOKIE = "mut_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

// ---- base64url -------------------------------------------------------------
const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlJson = (obj) => b64url(JSON.stringify(obj));
const fromB64url = (str) => {
  const pad = str.length % 4 ? "=".repeat(4 - (str.length % 4)) : "";
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
};

// ---- Password hashing (scrypt) --------------------------------------------
const SCRYPT_KEYLEN = 64;

// Returns { hash, salt } as hex strings. Fresh 16-byte random salt per call.
export function hashPassword(pw) {
  const salt = randomBytes(16);
  const hash = scryptSync(String(pw), salt, SCRYPT_KEYLEN);
  return { hash: hash.toString("hex"), salt: salt.toString("hex") };
}

// Constant-time verify. Returns boolean; never throws on bad input.
export function verifyPassword(pw, hash, salt) {
  try {
    const expected = Buffer.from(hash, "hex");
    const actual = scryptSync(String(pw), Buffer.from(salt, "hex"), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

// ---- Sessions (HMAC-SHA256, compact JWT-ish) -------------------------------
// Token format: base64url(header).base64url(payload).base64url(sig)
function requireSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set — sessions are disabled. Set AUTH_SECRET to enable auth.");
  return s;
}

function sign(signingInput, secret) {
  return b64url(createHmac("sha256", secret).update(signingInput).digest());
}

// payload: any JSON-serializable claims (e.g. { sub: userId }). exp is added here.
export function signSession(payload) {
  const secret = requireSecret();
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + SESSION_TTL_SEC };
  const signingInput = `${b64urlJson(header)}.${b64urlJson(body)}`;
  return `${signingInput}.${sign(signingInput, secret)}`;
}

// Returns the decoded payload, or null if missing/malformed/bad-sig/expired.
export function verifySession(token) {
  const secret = requireSecret();
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  const expected = sign(`${h}.${p}`, secret);
  // Constant-time signature comparison.
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(fromB64url(p).toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// ---- Cookies ---------------------------------------------------------------
// Session cookie: HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=...
export function cookieSerialize(name, value, { maxAge = SESSION_TTL_SEC } = {}) {
  const parts = [
    `${name}=${value}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAge}`,
  ];
  return parts.join("; ");
}

export function cookieParse(header) {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

// Build a Set-Cookie value that sets the session for `token`.
export function sessionCookie(token) {
  return cookieSerialize(SESSION_COOKIE, token);
}

// Build a Set-Cookie value that clears the session (Max-Age=0).
export function clearSessionCookie() {
  return cookieSerialize(SESSION_COOKIE, "", { maxAge: 0 });
}

// Read the session cookie off a request, verify it, and load the user.
// Returns the full user object or null. Throws only if AUTH_SECRET is missing
// (callers should catch and return 500 — fail closed).
export async function getUserFromReq(req) {
  const cookies = cookieParse(req.headers?.cookie || "");
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const payload = verifySession(token);
  if (!payload?.sub) return null;
  return getUserById(payload.sub);
}

// Strip secret fields before returning a user to the client.
export function safeUser(u) {
  if (!u) return null;
  return { id: u.id, email: u.email, subStatus: u.subStatus || "none" };
}

export { SESSION_COOKIE };

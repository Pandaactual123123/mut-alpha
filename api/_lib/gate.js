// App-level access gate (free alternative to Vercel Pro deployment protection).
//
// Opt-in: set APP_GATE_SECRET to a password. When set, the data/proxy endpoints
// require a valid gate cookie, and the SPA shows a password screen. When unset,
// everything stays open (no behavior change). The cookie is an HttpOnly,
// HMAC-signed token (no password stored client-side). Self-contained — no deps.
//
// This protects the abusable surface (EA proxy/scan + data endpoints). On Vercel
// Hobby the static bundle is still CDN-served, but it's inert without the cookie.

import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "mut_gate";
const TTL = 60 * 60 * 12; // 12h

const b64url = (b) => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4), "base64");

function cookieParse(header) {
  const out = {};
  for (const part of String(header || "").split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

function eq(a, b) {
  const ab = Buffer.from(String(a)), bb = Buffer.from(String(b));
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function gateEnabled() {
  return !!process.env.APP_GATE_SECRET;
}

function sign(input) {
  return b64url(createHmac("sha256", process.env.APP_GATE_SECRET).update(input).digest());
}

// Set-Cookie value granting access for TTL seconds.
export function issueGateCookie() {
  const payload = b64url(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + TTL }));
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TTL}`;
}

// Constant-time password check against APP_GATE_SECRET.
export function checkPassword(pw) {
  return gateEnabled() && eq(pw || "", process.env.APP_GATE_SECRET);
}

// { ok, open? } — open:true means the gate is disabled (allow through).
export function checkGate(req) {
  if (!gateEnabled()) return { ok: true, open: true };
  const token = cookieParse(req.headers?.cookie || "")[COOKIE];
  if (!token) return { ok: false };
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false };
  const [p, sig] = parts;
  if (!eq(sig, sign(p))) return { ok: false };
  let payload;
  try { payload = JSON.parse(fromB64url(p).toString("utf8")); } catch { return { ok: false }; }
  if (!payload || typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return { ok: false };
  return { ok: true };
}

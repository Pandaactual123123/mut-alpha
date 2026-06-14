// Pluggable user store.
//
// If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, this talks to
// Upstash Redis over its REST API (fetch, no SDK). Otherwise it falls back to an
// in-memory Map and sets `ephemeral=true`.
//
// SCAFFOLD: the in-memory fallback does NOT persist across serverless
// invocations — each cold start gets a fresh empty Map, and concurrent lambdas
// don't share state. It exists only for local dev/demo. For any real deployment
// set the Upstash env vars so users actually persist.
//
// User shape:
//   { id, email, passwordHash, salt, createdAt,
//     subStatus: "none"|"active"|"canceled"|"past_due",
//     stripeCustomerId: string|null }

import { randomUUID } from "node:crypto";

const URL_ENV = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_ENV = process.env.UPSTASH_REDIS_REST_TOKEN;

// True when no persistent store is configured (in-memory fallback in use).
export const ephemeral = !(URL_ENV && TOKEN_ENV);

// ---- Key helpers -----------------------------------------------------------
// Email is normalized (trim+lowercase) for the index key.
const normEmail = (e) => String(e || "").trim().toLowerCase();
const userKey = (id) => `user:${id}`;
const emailKey = (email) => `email:${normEmail(email)}`; // -> user id

// ---- Upstash REST transport ------------------------------------------------
// Upstash accepts a command as a JSON array: ["SET","key","value"].
async function upstash(command) {
  const r = await fetch(URL_ENV, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN_ENV}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error(`Upstash HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(`Upstash: ${j.error}`);
  return j.result;
}

// ---- In-memory fallback ----------------------------------------------------
// SCAFFOLD: ephemeral; lost on every cold start. Dev/demo only.
const memUsers = new Map(); // id -> user object
const memEmails = new Map(); // normalized email -> id

// ---- Public API ------------------------------------------------------------

export async function getUserById(id) {
  if (!id) return null;
  if (ephemeral) return memUsers.get(id) || null;
  const raw = await upstash(["GET", userKey(id)]);
  return raw ? JSON.parse(raw) : null;
}

export async function getUserByEmail(email) {
  const e = normEmail(email);
  if (!e) return null;
  if (ephemeral) {
    const id = memEmails.get(e);
    return id ? memUsers.get(id) || null : null;
  }
  const id = await upstash(["GET", emailKey(e)]);
  return id ? getUserById(id) : null;
}

export async function createUser({ email, passwordHash, salt }) {
  const e = normEmail(email);
  const user = {
    id: randomUUID(),
    email: e,
    passwordHash,
    salt,
    createdAt: Date.now(),
    subStatus: "none",
    stripeCustomerId: null,
  };
  if (ephemeral) {
    memUsers.set(user.id, user);
    memEmails.set(e, user.id);
    return user;
  }
  await upstash(["SET", userKey(user.id), JSON.stringify(user)]);
  await upstash(["SET", emailKey(e), user.id]);
  return user;
}

export async function updateUser(id, patch) {
  const existing = await getUserById(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch, id: existing.id }; // id is immutable
  if (ephemeral) {
    memUsers.set(id, updated);
    return updated;
  }
  await upstash(["SET", userKey(id), JSON.stringify(updated)]);
  return updated;
}

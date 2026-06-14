// POST /api/billing/webhook
// Verifies the Stripe-Signature header against STRIPE_WEBHOOK_SECRET (manual
// HMAC per Stripe's scheme — no `stripe` package) and updates the user's
// subStatus on subscription lifecycle events.
//
// RAW BODY REQUIREMENT: Stripe signs the exact raw request bytes. Vercel/Next
// would otherwise JSON-parse and re-serialize the body, breaking the signature.
// We disable the body parser (see `config` below) and read the raw stream
// ourselves. Do NOT use req.body here.
//
// FAIL CLOSED: missing STRIPE_WEBHOOK_SECRET => 500. Bad/absent signature => 400.
//
// SCAFFOLD: inert until STRIPE_WEBHOOK_SECRET is set and the event's customer is
// linked to a stored user (requires the Upstash store to persist
// stripeCustomerId; the in-memory fallback won't survive between invocations).

import { createHmac, timingSafeEqual } from "node:crypto";
import { getUserByEmail, getUserById, updateUser } from "../_lib/store.js";

// Tell Vercel/Next NOT to parse the body — we need the raw bytes for HMAC.
export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Parse a Stripe-Signature header: "t=timestamp,v1=sig[,v1=sig...]"
function parseSigHeader(header) {
  const out = { t: null, v1: [] };
  for (const part of String(header || "").split(",")) {
    const [k, v] = part.split("=");
    if (k === "t") out.t = v;
    else if (k === "v1") out.v1.push(v);
  }
  return out;
}

// Verify per Stripe's scheme: HMAC-SHA256 of `${t}.${rawBody}` with the webhook
// secret, hex-encoded, compared constant-time against any provided v1 signature.
// Also enforces a 5-minute tolerance against replay.
function verifyStripeSig(rawBody, header, secret) {
  const { t, v1 } = parseSigHeader(header);
  if (!t || !v1.length) return false;
  const ts = parseInt(t, 10);
  // Reject stale (>5min old) and future-dated (>60s ahead) timestamps.
  const age = Date.now() / 1000 - ts;
  if (!Number.isFinite(ts) || age > 300 || age < -60) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody.toString("utf8")}`).digest("hex");
  const expBuf = Buffer.from(expected);
  return v1.some((sig) => {
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
  });
}

// Map Stripe subscription status -> our subStatus enum.
function mapSubStatus(stripeStatus) {
  if (stripeStatus === "active" || stripeStatus === "trialing") return "active";
  if (stripeStatus === "past_due" || stripeStatus === "unpaid") return "past_due";
  return "canceled";
}

// Resolve the user this event is about. Prefer customer id, then metadata/email.
async function resolveUser(obj) {
  if (obj?.metadata?.userId) {
    const u = await getUserById(obj.metadata.userId);
    if (u) return u;
  }
  if (obj?.client_reference_id) {
    const u = await getUserById(obj.client_reference_id);
    if (u) return u;
  }
  // SCAFFOLD: matching by stripeCustomerId requires a store index we don't keep.
  // For subscription.* events we fall back to customer_email when present.
  if (obj?.customer_email) {
    const u = await getUserByEmail(obj.customer_email);
    if (u) return u;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: "Webhook is not configured (STRIPE_WEBHOOK_SECRET missing)." });

  let raw;
  try {
    raw = await readRawBody(req);
  } catch {
    return res.status(400).json({ error: "Could not read request body." });
  }

  if (!verifyStripeSig(raw, req.headers["stripe-signature"], secret))
    return res.status(400).json({ error: "Invalid signature." });

  let event;
  try {
    event = JSON.parse(raw.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Invalid JSON." });
  }

  try {
    const obj = event.data?.object || {};
    switch (event.type) {
      case "checkout.session.completed": {
        const user = await resolveUser(obj);
        if (user) await updateUser(user.id, { subStatus: "active", stripeCustomerId: obj.customer || user.stripeCustomerId });
        break;
      }
      case "customer.subscription.updated": {
        const user = await resolveUser(obj);
        if (user) await updateUser(user.id, { subStatus: mapSubStatus(obj.status) });
        break;
      }
      case "customer.subscription.deleted": {
        const user = await resolveUser(obj);
        if (user) await updateUser(user.id, { subStatus: "canceled" });
        break;
      }
      default:
        // Ignore other events.
        break;
    }
  } catch (err) {
    // Log-only: return 200 so Stripe doesn't retry on our internal handling bugs,
    // but surface the message for debugging via logs.
    console.error("webhook handling error:", err.message);
  }

  return res.status(200).json({ received: true });
}

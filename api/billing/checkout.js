// POST /api/billing/checkout  (auth required)
// Creates a Stripe Checkout Session (mode=subscription) via Stripe's REST API
// over fetch — no `stripe` package. Reuses or creates a Stripe customer for the
// signed-in user and stores stripeCustomerId on the user record. Returns { url }.
//
// FAIL CLOSED: missing STRIPE_SECRET_KEY / STRIPE_PRICE_ID => 500. No fallbacks.
//
// SCAFFOLD: billing is inert until STRIPE_SECRET_KEY + STRIPE_PRICE_ID are set
// (and, for real persistence of stripeCustomerId/subStatus, the Upstash store).

import { getUserFromReq } from "../_lib/auth.js";
import { updateUser } from "../_lib/store.js";

const STRIPE_API = "https://api.stripe.com/v1";

// Stripe expects application/x-www-form-urlencoded with bracketed nested keys,
// e.g. line_items[0][price]=price_xxx. Flatten a nested object into that shape.
function toForm(obj, prefix = "") {
  const params = new URLSearchParams();
  const walk = (val, key) => {
    if (val == null) return;
    if (Array.isArray(val)) {
      val.forEach((v, i) => walk(v, `${key}[${i}]`));
    } else if (typeof val === "object") {
      for (const k of Object.keys(val)) walk(val[k], key ? `${key}[${k}]` : k);
    } else {
      params.append(key, String(val));
    }
  };
  walk(obj, prefix);
  return params;
}

async function stripe(path, secret, body) {
  const r = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: toForm(body).toString(),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || `Stripe HTTP ${r.status}`);
  return j;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!secret || !priceId)
    return res.status(500).json({ error: "Billing is not configured (STRIPE_SECRET_KEY / STRIPE_PRICE_ID missing)." });

  let user;
  try {
    user = await getUserFromReq(req);
  } catch (err) {
    console.error("checkout auth error:", err.message);
    return res.status(500).json({ error: "Auth check failed." });
  }
  if (!user) return res.status(401).json({ error: "Sign in to upgrade." });

  // Success/cancel redirect base. Prefer a trusted APP_URL so a spoofed
  // Origin/Host header can't turn the post-checkout redirect into an open
  // redirect; fall back to the request origin only when APP_URL is unset.
  const origin =
    process.env.APP_URL ||
    req.headers.origin ||
    (req.headers.host ? `https://${req.headers.host}` : null);
  if (!origin) return res.status(400).json({ error: "Could not determine request origin." });

  try {
    // Reuse or create the Stripe customer for this user.
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe("/customers", secret, {
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await updateUser(user.id, { stripeCustomerId: customerId });
    }

    const session = await stripe("/checkout/sessions", secret, {
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?upgrade=success`,
      cancel_url: `${origin}/?upgrade=cancel`,
      client_reference_id: user.id,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("checkout error:", err.message);
    return res.status(500).json({ error: "Checkout failed." });
  }
}

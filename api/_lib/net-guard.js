// SSRF guard for the user-supplied EA feed endpoints.
//
// The ah-feed / snipe-scan proxies forward a caller-supplied URL server-side. To
// stop that from reaching cloud-metadata (169.254.169.254), localhost, or other
// internal hosts — and from leaking the forwarded auth header there — we require
// the endpoint to be https AND resolve to an allowed EA host, and we reject any
// private/loopback/link-local IP literal.
//
// Default allowlist is EA's domains; override with EA_HOST_ALLOWLIST (comma-
// separated host suffixes) if a captured endpoint lives on another EA host.

const DEFAULT_SUFFIXES = ["ea.com", "easports.com"];

function allowedSuffixes() {
  const env = process.env.EA_HOST_ALLOWLIST;
  const list = env ? env.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : [];
  return list.length ? list : DEFAULT_SUFFIXES;
}

// True if the host is an IP literal in a private/loopback/link-local/reserved range.
function isPrivateHost(host) {
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  // IPv6 (brackets already stripped by caller)
  if (host.includes(":")) {
    const h = host.toLowerCase();
    if (h === "::1" || h === "::") return true;
    if (h.startsWith("fe8") || h.startsWith("fe9") || h.startsWith("fea") || h.startsWith("feb")) return true; // fe80::/10
    if (h.startsWith("fc") || h.startsWith("fd")) return true; // fc00::/7 ULA
    // IPv4-mapped (::ffff:a.b.c.d)
    const m = h.match(/(\d+\.\d+\.\d+\.\d+)$/);
    if (m) return isPrivateHost(m[1]);
    return false;
  }
  // IPv4 dotted
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const o = m.slice(1).map(Number);
  if (o.some((n) => n > 255)) return true; // malformed → reject
  const [a, b] = o;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local + metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

// -> { ok:true, url } | { error }
export function checkEAEndpoint(endpoint) {
  let url;
  try { url = new URL(endpoint); } catch { return { error: "Invalid endpoint URL." }; }
  if (url.protocol !== "https:") return { error: "Endpoint must be https." };
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isPrivateHost(host)) return { error: "Endpoint host is not allowed (private/internal address)." };
  const ok = allowedSuffixes().some((suf) => host === suf || host.endsWith("." + suf));
  if (!ok) return { error: "Endpoint host is not in the allowed EA domain list." };
  return { ok: true, url };
}

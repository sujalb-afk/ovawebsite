/**
 * Rewrite CMS absolute/ngrok URLs to same-origin paths (Vite proxies /uploads → CMS).
 */

const KNOWN_HOST_PATTERNS = [/ngrok-free\.dev/i, /ngrok\.io/i, /localhost:5000/i];

function shouldRewriteHost(host) {
  if (!host) return false;
  return KNOWN_HOST_PATTERNS.some((re) => re.test(host));
}

export function rewriteCmsMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const t = url.trim();
  if (!t) return '';

  if (t.startsWith('/uploads/') || t.startsWith('/images/')) return t;

  if (!t.startsWith('http://') && !t.startsWith('https://')) return t;

  try {
    const u = new URL(t);
    if (!shouldRewriteHost(u.host)) return t;
    if (u.pathname.startsWith('/uploads/') || u.pathname.startsWith('/images/')) {
      return `${u.pathname}${u.search}`;
    }
  } catch {
    /* ignore */
  }
  return t;
}

export function rewriteCmsMediaDeep(value) {
  if (typeof value === 'string') return rewriteCmsMediaUrl(value);
  if (Array.isArray(value)) return value.map((v) => rewriteCmsMediaDeep(v));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = rewriteCmsMediaDeep(v);
    }
    return out;
  }
  return value;
}

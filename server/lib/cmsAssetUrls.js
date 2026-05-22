/**
 * Rewrite CMS media URLs to paths the browser can load on the OVA site origin.
 * Ngrok hosts break <img src> (no skip-browser-warning header) — use /uploads and /images paths.
 */

const CMS_BASE = (process.env.OVA_CMS_API_URL || '').replace(/\/$/, '');

function getPublicAssetBase() {
  return (process.env.OVA_CMS_ASSET_URL || CMS_BASE).replace(/\/$/, '');
}

function collectRewriteHosts() {
  const hosts = new Set();
  for (const base of [CMS_BASE, process.env.OVA_CMS_ASSET_URL]) {
    if (!base) continue;
    try {
      hosts.add(new URL(base.replace(/\/$/, '')).host);
    } catch {
      /* ignore */
    }
  }
  hosts.add('larry-epicentral-boldfacedly.ngrok-free.dev');
  return hosts;
}

const REWRITE_HOSTS = collectRewriteHosts();

function rewriteUrlString(str) {
  if (!str || typeof str !== 'string') return str;
  const trimmed = str.trim();
  if (!trimmed) return str;

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/images/')) {
    return trimmed;
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return str;
  }

  try {
    const u = new URL(trimmed);
    if (!REWRITE_HOSTS.has(u.host) && !u.host.includes('ngrok')) return str;
    if (u.pathname.startsWith('/uploads/') || u.pathname.startsWith('/images/')) {
      return `${u.pathname}${u.search}`;
    }
    return str;
  } catch {
    return str;
  }
}

function rewriteDeep(value) {
  if (typeof value === 'string') return rewriteUrlString(value);
  if (Array.isArray(value)) return value.map((v) => rewriteDeep(v));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = rewriteDeep(v);
    }
    return out;
  }
  return value;
}

module.exports = {
  getPublicAssetBase,
  rewriteDeep,
  rewriteUrlString,
};

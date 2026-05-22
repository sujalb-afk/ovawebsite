/**
 * Rewrite CMS media URLs (often stored with ngrok host) to a reachable asset base.
 */

const CMS_BASE = (process.env.OVA_CMS_API_URL || '').replace(/\/$/, '');
const CMS_LOCAL = (process.env.OVA_CMS_LOCAL_URL || 'http://localhost:5000').replace(/\/$/, '');

function getPublicAssetBase() {
  return (process.env.OVA_CMS_ASSET_URL || CMS_BASE || CMS_LOCAL).replace(/\/$/, '');
}

function collectRewriteHosts() {
  const hosts = new Set();
  for (const base of [CMS_BASE, CMS_LOCAL, process.env.OVA_CMS_ASSET_URL]) {
    if (!base) continue;
    try {
      hosts.add(new URL(base.replace(/\/$/, '')).host);
    } catch {
      /* ignore */
    }
  }
  return hosts;
}

const REWRITE_HOSTS = collectRewriteHosts();

function rewriteUrlString(str, assetBase) {
  if (!str || typeof str !== 'string') return str;
  const trimmed = str.trim();
  if (!trimmed) return str;

  if (trimmed.startsWith('/uploads/')) {
    return `${assetBase}${trimmed}`;
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return str;
  }

  try {
    const u = new URL(trimmed);
    if (!REWRITE_HOSTS.has(u.host)) return str;
    if (u.pathname.startsWith('/uploads/')) {
      return `${assetBase}${u.pathname}${u.search}`;
    }
    if (u.pathname.startsWith('/images/')) {
      return `${u.pathname}${u.search}`;
    }
    return str;
  } catch {
    return str;
  }
}

function rewriteDeep(value, assetBase) {
  if (typeof value === 'string') return rewriteUrlString(value, assetBase);
  if (Array.isArray(value)) return value.map((v) => rewriteDeep(v, assetBase));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = rewriteDeep(v, assetBase);
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

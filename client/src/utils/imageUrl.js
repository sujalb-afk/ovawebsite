/**
 * Image URL helpers for static assets and CMS-hosted media.
 */

const DEFAULT_CMS_ASSET_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OVA_CMS_ASSET_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_OVA_CMS_ASSET_URL) ||
  'http://localhost:5000';

let cmsAssetBase = DEFAULT_CMS_ASSET_BASE.replace(/\/$/, '');

const CMS_HOSTS = new Set();

function rememberHost(url) {
  if (!url || typeof url !== 'string') return;
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      CMS_HOSTS.add(new URL(url).host);
    }
  } catch {
    /* ignore */
  }
}

rememberHost(
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_OVA_CMS_API_URL
);
rememberHost(
  typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_OVA_CMS_API_URL
);

export function setCmsAssetBase(base) {
  if (base && typeof base === 'string') {
    cmsAssetBase = base.replace(/\/$/, '');
    rememberHost(base);
  }
}

function getAssetBase() {
  return cmsAssetBase || DEFAULT_CMS_ASSET_BASE.replace(/\/$/, '');
}

function rewriteCmsHost(url) {
  const t = url.trim();
  if (!t.startsWith('http://') && !t.startsWith('https://')) return t;
  try {
    const u = new URL(t);
    if (!CMS_HOSTS.has(u.host) && !t.includes('ngrok-free.dev')) return t;
    if (u.pathname.startsWith('/uploads/')) {
      return `${getAssetBase()}${u.pathname}${u.search}`;
    }
    if (u.pathname.startsWith('/images/')) {
      return `${u.pathname}${u.search}`;
    }
  } catch {
    /* ignore */
  }
  return t;
}

/**
 * Returns the WebP version of local static paths only (client/public/images).
 * Does not alter CMS uploads or absolute URLs.
 */
export function getOptimizedImageUrl(path) {
  if (!path || typeof path !== 'string') return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return cmsImageUrl(path);
  if (!path.startsWith('/images/')) return path;
  return path.replace(/\.(png|jpe?g)$/i, '.webp');
}

export function cmsImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim();
  if (!t) return '';

  if (t.startsWith('http://') || t.startsWith('https://')) {
    return rewriteCmsHost(t);
  }

  if (t.startsWith('/uploads/')) {
    return `${getAssetBase()}${t}`;
  }

  if (t.startsWith('/images/')) {
    return t;
  }

  return t;
}

export function pickImage(item) {
  if (!item) return '';
  if (Array.isArray(item.imageUrls) && item.imageUrls[0]) return cmsImageUrl(item.imageUrls[0]);
  if (Array.isArray(item.images) && item.images[0]?.url) return cmsImageUrl(item.images[0].url);
  return cmsImageUrl(item.image || item.imageUrl || item.src || '');
}

/** For <img onError> — try original CMS URL without .webp optimization */
export function cmsImageFallback(path) {
  return cmsImageUrl(path);
}

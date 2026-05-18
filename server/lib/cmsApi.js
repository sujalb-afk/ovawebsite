/**
 * Server-side CMS-OVA public API client.
 * Reads published content only (/api/public/*). Does not touch form-transfer routes.
 */

const CMS_BASE = (process.env.OVA_CMS_API_URL || '').replace(/\/$/, '');
const CMS_ENABLED = process.env.OVA_CMS_CONTENT_ENABLED === 'true';
const CACHE_SECONDS = Number(process.env.OVA_CMS_CONTENT_CACHE_SECONDS ?? 10);

const memoryCache = new Map();
/** Last successful CMS response — kept when live fetch fails so reloads do not fall back to static. */
const staleCache = new Map();

function cacheKey(url) {
  return url;
}

function getFreshCached(key) {
  const entry = memoryCache.get(key);
  if (!entry || Date.now() > entry.expires) {
    memoryCache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached(key, value) {
  const ttl = CACHE_SECONDS > 0 ? CACHE_SECONDS * 1000 : 0;
  if (ttl > 0) {
    memoryCache.set(key, { value, expires: Date.now() + ttl });
  }
  staleCache.set(key, value);
}

function markStale(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    return { ...payload, _cmsStale: true };
  }
  return payload;
}

function isCmsEnabled() {
  return CMS_ENABLED && Boolean(CMS_BASE);
}

function buildPublicUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const hasLocale = p.includes('locale=');
  const suffix = hasLocale ? '' : `${p.includes('?') ? '&' : '?'}locale=en`;
  return `${CMS_BASE}/api/public${p}${suffix}`;
}

async function fetchCms(path, init = {}) {
  if (!isCmsEnabled()) return null;

  const url = buildPublicUrl(path);
  const key = cacheKey(url);
  const fresh = getFreshCached(key);
  if (fresh !== undefined) return fresh;

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': '1',
        ...(init.headers || {}),
      },
    });
    const text = await res.text();
    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[CMS] ${res.status} ${url}`);
      }
      const stale = staleCache.get(key);
      if (stale !== undefined) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[CMS] Using stale cache for', path);
        }
        return markStale(stale);
      }
      return null;
    }
    if (text.trimStart().startsWith('<')) {
      console.warn(
        '[CMS] Received HTML instead of JSON. Is CMS running on :5000 and ngrok tunneling to it? URL:',
        url
      );
      const stale = staleCache.get(key);
      return stale !== undefined ? markStale(stale) : null;
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.warn('[CMS] Invalid JSON from', url);
      const stale = staleCache.get(key);
      return stale !== undefined ? markStale(stale) : null;
    }
    setCached(key, json);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[CMS] OK ${url}`);
    }
    return json;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[CMS] fetch failed:', err.message);
    }
    const stale = staleCache.get(key);
    if (stale !== undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[CMS] Using stale cache after error for', path);
      }
      return markStale(stale);
    }
    return null;
  }
}

async function fetchCmsPage(slug) {
  const data = await fetchCms(`/content/${slug}?locale=en`);
  if (!data?.page) return null;
  return {
    slug: data.slug || slug,
    title: data.page.title,
    seo: data.page.seo || null,
    data: data.page.data || null,
    updatedAt: data.page.updatedAt,
    fromCms: true,
    stale: Boolean(data._cmsStale),
  };
}

async function fetchCmsGlobal() {
  const data = await fetchCms('/content/global?locale=en');
  return data?.global ?? data?.page?.data ?? null;
}

async function fetchCmsEvents() {
  const data = await fetchCms('/events');
  return Array.isArray(data) ? data : null;
}

async function fetchCmsEvent(id) {
  const data = await fetchCms(`/events/${encodeURIComponent(id)}`);
  return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
}

async function fetchCmsServices() {
  const data = await fetchCms('/services');
  return Array.isArray(data) ? data : null;
}

async function fetchCmsHealth() {
  if (!CMS_BASE) return { ok: false, enabled: false, message: 'OVA_CMS_API_URL not set' };
  try {
    const res = await fetch(`${CMS_BASE}/api/health`, {
      headers: { Accept: 'application/json', 'ngrok-skip-browser-warning': '1' },
    });
    const json = res.ok ? await res.json() : null;
    return { ok: res.ok, enabled: CMS_ENABLED, db: json?.db, cmsBase: CMS_BASE };
  } catch (err) {
    return { ok: false, enabled: CMS_ENABLED, message: err.message };
  }
}

module.exports = {
  fetchCms,
  fetchCmsPage,
  fetchCmsGlobal,
  fetchCmsEvents,
  fetchCmsEvent,
  fetchCmsServices,
  fetchCmsHealth,
  isCmsEnabled,
};

/**
 * Server-side CMS-OVA public API client.
 * Reads published content only (/api/public/*). Does not touch form-transfer routes.
 */

const CMS_BASE = (process.env.OVA_CMS_API_URL || '').replace(/\/$/, '');
/** Dev fallback when ngrok is offline — CMS-OVA `npm run dev` on :5000 */
const CMS_LOCAL = (process.env.OVA_CMS_LOCAL_URL || 'http://localhost:5000').replace(/\/$/, '');
const CMS_ENABLED = process.env.OVA_CMS_CONTENT_ENABLED === 'true';
const CACHE_SECONDS = Number(process.env.OVA_CMS_CONTENT_CACHE_SECONDS ?? 10);

function getCmsFetchBases() {
  const bases = [];
  if (CMS_BASE) bases.push(CMS_BASE);
  if (
    process.env.NODE_ENV !== 'production' &&
    CMS_LOCAL &&
    !bases.includes(CMS_LOCAL)
  ) {
    bases.push(CMS_LOCAL);
  }
  // Dev: local CMS (:5000) first — ngrok often 404s when tunnel is not pointed at CMS-OVA
  if (
    process.env.NODE_ENV !== 'production' &&
    CMS_LOCAL &&
    bases.includes(CMS_LOCAL) &&
    process.env.OVA_CMS_PREFER_LOCAL !== 'false'
  ) {
    return [CMS_LOCAL, ...bases.filter((b) => b !== CMS_LOCAL)];
  }
  return bases;
}

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

function buildPublicUrl(base, path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const hasLocale = p.includes('locale=');
  const suffix = hasLocale ? '' : `${p.includes('?') ? '&' : '?'}locale=en`;
  return `${base}/api/public${p}${suffix}`;
}

const CMS_FETCH_TIMEOUT_MS = Number(process.env.OVA_CMS_FETCH_TIMEOUT_MS ?? 12000);

async function fetchCmsOnce(url, path, init = {}) {
  const key = cacheKey(url);
  const fresh = getFreshCached(key);
  if (fresh !== undefined) return fresh;

  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(CMS_FETCH_TIMEOUT_MS),
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

async function fetchCms(path, init = {}) {
  if (!isCmsEnabled()) return null;

  const bases = getCmsFetchBases();
  let fallbackStale = null;

  for (let i = 0; i < bases.length; i += 1) {
    const base = bases[i];
    const url = buildPublicUrl(base, path);
    const json = await fetchCmsOnce(url, path, init);
    if (json) {
      if (i > 0 && process.env.NODE_ENV !== 'production') {
        console.log(`[CMS] OK via local fallback ${base}`);
      }
      return json;
    }
    const stale = staleCache.get(cacheKey(url));
    if (stale !== undefined) fallbackStale = markStale(stale);
  }

  return fallbackStale;
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

async function fetchCmsGallery() {
  const data = await fetchCms('/gallery');
  return Array.isArray(data) ? data : null;
}

async function fetchCmsGalleryItem(id) {
  const data = await fetchCms(`/gallery/${encodeURIComponent(id)}`);
  return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
}

async function fetchCmsTeam() {
  const data = await fetchCms('/team');
  return Array.isArray(data) ? data : null;
}

async function fetchCmsHealth() {
  if (!CMS_BASE && !CMS_LOCAL) {
    return { ok: false, enabled: false, message: 'OVA_CMS_API_URL not set' };
  }
  for (const base of getCmsFetchBases()) {
    try {
      const res = await fetch(`${base}/api/health`, {
        headers: { Accept: 'application/json', 'ngrok-skip-browser-warning': '1' },
      });
      const json = res.ok ? await res.json() : null;
      if (res.ok) {
        return {
          ok: true,
          enabled: CMS_ENABLED,
          db: json?.db,
          cmsBase: base,
          configuredBase: CMS_BASE || null,
        };
      }
    } catch {
      /* try next base */
    }
  }
  return { ok: false, enabled: CMS_ENABLED, message: 'CMS unreachable (ngrok and local :5000)' };
}

module.exports = {
  fetchCms,
  fetchCmsPage,
  fetchCmsGlobal,
  fetchCmsEvents,
  fetchCmsEvent,
  fetchCmsServices,
  fetchCmsGallery,
  fetchCmsGalleryItem,
  fetchCmsTeam,
  fetchCmsHealth,
  isCmsEnabled,
};

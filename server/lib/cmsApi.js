/**
 * Server-side CMS-OVA public API client.
 * Reads published content only (/api/public/*). Does not touch form-transfer routes.
 */

const CMS_BASE = (process.env.OVA_CMS_API_URL || '').replace(/\/$/, '');
const CMS_LOCAL = (process.env.OVA_CMS_LOCAL_URL || 'http://localhost:5000').replace(/\/$/, '');
const CMS_API_KEY = (process.env.OVA_CMS_PUBLIC_API_KEY || '').trim();
const CMS_ENABLED = process.env.OVA_CMS_CONTENT_ENABLED === 'true';
const CACHE_SECONDS = Number(process.env.OVA_CMS_CONTENT_CACHE_SECONDS ?? 10);

const memoryCache = new Map();
/** Last successful CMS response — kept when live fetch fails so reloads do not fall back to static. */
const staleCache = new Map();

let warnedDisabled = false;

function warnOnce(message) {
  if (process.env.NODE_ENV === 'production') return;
  if (warnedDisabled) return;
  warnedDisabled = true;
  console.warn(`[CMS] ${message}`);
}

function getCmsFetchBases() {
  const bases = [];
  if (CMS_BASE) bases.push(CMS_BASE);
  if (CMS_LOCAL && !bases.includes(CMS_LOCAL)) bases.push(CMS_LOCAL);
  return bases;
}

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

function clearCmsMemoryCache() {
  memoryCache.clear();
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

function cmsRequestHeaders() {
  const headers = {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
  };
  if (CMS_API_KEY) headers['x-api-key'] = CMS_API_KEY;
  return headers;
}

function withApiKey(url) {
  if (!CMS_API_KEY) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has('api_key')) {
      u.searchParams.set('api_key', CMS_API_KEY);
    }
    return u.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}api_key=${encodeURIComponent(CMS_API_KEY)}`;
  }
}

function buildPublicUrl(base, path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const hasLocale = p.includes('locale=');
  const suffix = hasLocale ? '' : `${p.includes('?') ? '&' : '?'}locale=en`;
  return withApiKey(`${base}/api/public${p}${suffix}`);
}

const CMS_FETCH_TIMEOUT_MS = Number(process.env.OVA_CMS_FETCH_TIMEOUT_MS ?? 12000);

async function fetchCmsOnce(url, path, options = {}) {
  const { skipCache = false } = options;
  const authedUrl = withApiKey(url);
  const key = cacheKey(authedUrl);

  if (!skipCache) {
    const fresh = getFreshCached(key);
    if (fresh !== undefined) return fresh;
  }

  try {
    const res = await fetch(authedUrl, {
      signal: AbortSignal.timeout(CMS_FETCH_TIMEOUT_MS),
      headers: cmsRequestHeaders(),
    });
    const text = await res.text();
    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') {
        if (res.status === 401) {
          console.warn(
            '[CMS] 401 Unauthorized — set OVA_CMS_PUBLIC_API_KEY in server/.env (must match CMS PUBLIC_API_KEY)',
            authedUrl.replace(CMS_API_KEY, '***')
          );
        } else {
          console.warn(`[CMS] ${res.status} ${authedUrl.replace(CMS_API_KEY, '***')}`);
        }
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
      console.warn('[CMS] Received HTML instead of JSON:', authedUrl.replace(CMS_API_KEY, '***'));
      const stale = staleCache.get(key);
      return stale !== undefined ? markStale(stale) : null;
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.warn('[CMS] Invalid JSON from', authedUrl.replace(CMS_API_KEY, '***'));
      const stale = staleCache.get(key);
      return stale !== undefined ? markStale(stale) : null;
    }
    setCached(key, json);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[CMS] OK ${authedUrl.replace(CMS_API_KEY, '***')}`);
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

async function fetchCms(path, options = {}) {
  if (!CMS_ENABLED) {
    warnOnce('OVA_CMS_CONTENT_ENABLED is not true — static fallbacks only');
    return null;
  }
  if (!CMS_BASE) {
    warnOnce('OVA_CMS_API_URL is not set — static fallbacks only');
    return null;
  }

  const bases = getCmsFetchBases();
  let fallbackStale = null;

  for (let i = 0; i < bases.length; i += 1) {
    const base = bases[i];
    const url = buildPublicUrl(base, path);
    const json = await fetchCmsOnce(url, path, options);
    if (json) {
      if (i > 0 && process.env.NODE_ENV !== 'production') {
        console.log(`[CMS] OK via fallback ${base}`);
      }
      return json;
    }
    const stale = staleCache.get(cacheKey(withApiKey(buildPublicUrl(base, path))));
    if (stale !== undefined) fallbackStale = markStale(stale);
  }

  return fallbackStale;
}

/** Align CMS API fields with OVA_Web page components (legal body, section heroes, thank-you). */
function normalizeCmsPageData(slug, data, title = '') {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return data && typeof data === 'object' ? data : {};
  }
  const out = { ...data };
  const pageTitle = (title || '').trim();
  const firstSection =
    Array.isArray(out.sections) && out.sections[0] && typeof out.sections[0] === 'object'
      ? out.sections[0]
      : null;

  if (slug === 'terms' || slug === 'privacy' || slug === 'refund') {
    const html = (out.contentHtml || '').trim();
    if (html && !out.body) out.body = out.contentHtml;
    if (!out.heroHeading && pageTitle) out.heroHeading = pageTitle;
    if (!out.heroSubtext && out.introLead) out.heroSubtext = out.introLead;
    else if (!out.heroSubtext && out.lead) out.heroSubtext = out.lead;
  }
  if (slug === 'thankyou') {
    if (!out.heroHeading && out.heading) out.heroHeading = out.heading;
    if (!out.heroSubtext && out.message) out.heroSubtext = out.message;
  }
  if (slug === 'contact' || slug === 'join') {
    if (firstSection) {
      if (!out.heroHeading && firstSection.heading) out.heroHeading = firstSection.heading;
      if (!out.heroSubtext && firstSection.body) out.heroSubtext = firstSection.body;
    }
  }
  if (slug === 'contact') {
    if (!out.mapHeading && out.mapTitle) out.mapHeading = out.mapTitle;
    if (Array.isArray(out.faqs) && out.faqs.length && !out.faqItems?.length) {
      out.faqItems = out.faqs.map((item) => ({
        q: item.q || item.question || '',
        a: item.a || item.answer || '',
      }));
    }
  }
  return out;
}

async function fetchCmsPage(slug, options = {}) {
  const data = await fetchCms(`/content/${slug}?locale=en`, options);
  const pageData = data?.page?.data ?? null;
  if (!pageData) return null;
  return {
    slug: data.slug || slug,
    title: data.page.title,
    seo: data.page.seo || null,
    data: normalizeCmsPageData(slug, pageData, data.page.title),
    updatedAt: data.page.updatedAt,
    fromCms: true,
    stale: Boolean(data._cmsStale),
  };
}

async function fetchCmsGlobal(options = {}) {
  const data = await fetchCms('/content/global?locale=en', options);
  return data?.global ?? data?.page?.data ?? null;
}

async function fetchCmsEvents(options = {}) {
  const data = await fetchCms('/events', options);
  return Array.isArray(data) ? data : null;
}

async function fetchCmsEvent(id, options = {}) {
  const data = await fetchCms(`/events/${encodeURIComponent(id)}`, options);
  return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
}

async function fetchCmsServices(options = {}) {
  const data = await fetchCms('/services', options);
  return Array.isArray(data) ? data : null;
}

async function fetchCmsGallery(options = {}) {
  const data = await fetchCms('/gallery', options);
  return Array.isArray(data) ? data : null;
}

async function fetchCmsGalleryItem(id, options = {}) {
  const data = await fetchCms(`/gallery/${encodeURIComponent(id)}`, options);
  return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
}

async function fetchCmsTeam(options = {}) {
  const data = await fetchCms('/team', options);
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
        signal: AbortSignal.timeout(CMS_FETCH_TIMEOUT_MS),
      });
      const json = res.ok ? await res.json() : null;
      if (res.ok) {
        return {
          ok: true,
          enabled: CMS_ENABLED,
          db: json?.db,
          cmsBase: base,
          configuredBase: CMS_BASE || null,
          hasPublicApiKey: Boolean(CMS_API_KEY),
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
  clearCmsMemoryCache,
  normalizeCmsPageData,
};

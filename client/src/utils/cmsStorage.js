const VERSION = 'v1';
const PAGE_PREFIX = `ova_cms_${VERSION}_page_`;
const EVENTS_KEY = `ova_cms_${VERSION}_events`;

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadCmsPageCache(slug) {
  if (typeof window === 'undefined' || !slug) return null;
  return safeParse(window.sessionStorage.getItem(`${PAGE_PREFIX}${slug}`));
}

export function saveCmsPageCache(slug, payload) {
  if (typeof window === 'undefined' || !slug || !payload?.data) return;
  try {
    window.sessionStorage.setItem(
      `${PAGE_PREFIX}${slug}`,
      JSON.stringify({
        data: payload.data,
        seo: payload.seo || null,
        updatedAt: payload.updatedAt || null,
        fromCms: true,
        savedAt: Date.now(),
      })
    );
  } catch {
    /* quota exceeded — ignore */
  }
}

export function loadCmsEventsCache() {
  if (typeof window === 'undefined') return null;
  return safeParse(window.sessionStorage.getItem(EVENTS_KEY));
}

export function saveCmsEventsCache(events, updatedAt) {
  if (typeof window === 'undefined' || !Array.isArray(events) || !events.length) return;
  try {
    window.sessionStorage.setItem(
      EVENTS_KEY,
      JSON.stringify({ events, updatedAt: updatedAt || null, fromCms: true, savedAt: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

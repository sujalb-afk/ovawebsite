/**
 * CMS content is persisted in OVA Web MongoDB (ova_db) via /api/cms/* — not in browser storage.
 * These helpers are no-ops kept for backward compatibility.
 */

export function loadCmsPageCache() {
  return null;
}

export function saveCmsPageCache() {
  /* server saves to MongoDB */
}

export function loadCmsEventsCache() {
  return null;
}

export function saveCmsEventsCache() {
  /* server saves to MongoDB */
}

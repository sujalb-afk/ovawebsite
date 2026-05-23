/**
 * Persist published CMS payloads in OVA Web MongoDB (ova_db).
 * Serves last synced copy when live CMS fetch fails; updates on every successful fetch.
 */

const mongoose = require('mongoose');
const CmsSnapshot = require('../models/CmsSnapshot');
const { rewriteDeep } = require('./cmsAssetUrls');

const IN_SCOPE_PAGES = ['home', 'about', 'services', 'events', 'join', 'donate', 'contact'];

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

async function savePageSnapshot(slug, page) {
  if (!isDbReady() || !slug || !page?.data) return false;
  const payload = rewriteDeep({
    title: page.title,
    data: page.data,
    seo: page.seo,
    updatedAt: page.updatedAt,
  });
  await CmsSnapshot.findOneAndUpdate(
    { key: `page:${slug}` },
    {
      key: `page:${slug}`,
      kind: 'page',
      slug,
      locale: 'en',
      title: payload.title || '',
      data: payload.data,
      seo: payload.seo || null,
      cmsUpdatedAt: payload.updatedAt || null,
      syncedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[CMS DB] saved page:${slug}`);
  }
  return true;
}

async function loadPageSnapshot(slug) {
  if (!isDbReady() || !slug) return null;
  const doc = await CmsSnapshot.findOne({ key: `page:${slug}` }).lean();
  if (!doc?.data) return null;
  return {
    slug: doc.slug || slug,
    title: doc.title,
    seo: doc.seo || null,
    data: doc.data,
    updatedAt: doc.cmsUpdatedAt,
    fromCms: true,
    stale: true,
    fromDb: true,
  };
}

async function saveListSnapshot(listKind, items) {
  if (!isDbReady() || !listKind || !Array.isArray(items)) return false;
  const data = rewriteDeep(items);
  const cmsUpdatedAt = data[0]?.updatedAt || null;
  await CmsSnapshot.findOneAndUpdate(
    { key: `list:${listKind}` },
    {
      key: `list:${listKind}`,
      kind: 'list',
      slug: listKind,
      data,
      cmsUpdatedAt,
      syncedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[CMS DB] saved list:${listKind} (${data.length} items)`);
  }
  return true;
}

async function loadListSnapshot(listKind) {
  if (!isDbReady() || !listKind) return null;
  const doc = await CmsSnapshot.findOne({ key: `list:${listKind}` }).lean();
  if (!doc || !Array.isArray(doc.data)) return null;
  return doc.data;
}

async function saveGlobalSnapshot(global) {
  if (!isDbReady() || !global) return false;
  await CmsSnapshot.findOneAndUpdate(
    { key: 'global:site' },
    {
      key: 'global:site',
      kind: 'global',
      slug: 'global',
      data: rewriteDeep(global),
      syncedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  return true;
}

async function loadGlobalSnapshot() {
  if (!isDbReady()) return null;
  const doc = await CmsSnapshot.findOne({ key: 'global:site' }).lean();
  return doc?.data || null;
}

async function saveItemSnapshot(kind, id, item) {
  if (!isDbReady() || !id || !item) return false;
  const key = `item:${kind}:${id}`;
  await CmsSnapshot.findOneAndUpdate(
    { key },
    {
      key,
      kind: 'item',
      slug: String(id),
      data: rewriteDeep(item),
      cmsUpdatedAt: item.updatedAt || null,
      syncedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  return true;
}

async function loadItemSnapshot(kind, id) {
  if (!isDbReady() || !id) return null;
  const doc = await CmsSnapshot.findOne({ key: `item:${kind}:${id}` }).lean();
  return doc?.data || null;
}

function findInList(list, id) {
  if (!Array.isArray(list) || !id) return null;
  const sid = String(id);
  return (
    list.find(
      (row) =>
        String(row._id) === sid ||
        String(row.id) === sid ||
        String(row.sourceId) === sid ||
        String(row.slug) === sid
    ) || null
  );
}

async function resolveCmsPage(slug, fetchFn, opts = {}) {
  const live = await fetchFn(slug, opts);
  if (live?.data) {
    try {
      await savePageSnapshot(slug, live);
      if (slug === 'home' && live.data?.global) {
        await saveGlobalSnapshot(live.data.global);
      }
    } catch (err) {
      console.warn('[CMS DB] save page failed:', err.message);
    }
    return { ...live, fromDb: false };
  }
  const db = await loadPageSnapshot(slug);
  if (db) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[CMS DB] serving page:${slug} from database`);
    }
    return db;
  }
  return null;
}

async function resolveCmsList(listKind, fetchFn, opts = {}) {
  const live = await fetchFn(opts);
  if (live !== null) {
    try {
      await saveListSnapshot(listKind, live);
    } catch (err) {
      console.warn('[CMS DB] save list failed:', err.message);
    }
    return { items: live, fromDb: false, stale: false };
  }
  const db = await loadListSnapshot(listKind);
  if (db) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[CMS DB] serving list:${listKind} from database`);
    }
    return { items: db, fromDb: true, stale: true };
  }
  return { items: null, fromDb: false, stale: false };
}

async function resolveCmsGlobal(fetchFn, opts = {}) {
  const live = await fetchFn(opts);
  if (live) {
    try {
      await saveGlobalSnapshot(live);
    } catch (err) {
      console.warn('[CMS DB] save global failed:', err.message);
    }
    return { global: live, fromDb: false };
  }
  const db = await loadGlobalSnapshot();
  if (db) return { global: db, fromDb: true };
  const home = await loadPageSnapshot('home');
  const fromHome = home?.data?.global || home?.data?.site;
  if (fromHome && typeof fromHome === 'object' && Object.keys(fromHome).length) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[CMS DB] serving global from home snapshot');
    }
    return { global: fromHome, fromDb: true };
  }
  return { global: null, fromDb: false };
}

async function resolveCmsEvent(id, fetchFn, opts = {}) {
  const live = await fetchFn(id, opts);
  if (live) {
    try {
      await saveItemSnapshot('event', id, live);
    } catch (err) {
      console.warn('[CMS DB] save event item failed:', err.message);
    }
    return { event: live, fromDb: false };
  }
  let item = await loadItemSnapshot('event', id);
  if (!item) {
    const list = await loadListSnapshot('events');
    item = findInList(list, id);
  }
  if (item) return { event: item, fromDb: true };
  return { event: null, fromDb: false };
}

async function resolveCmsGalleryItem(id, fetchFn, opts = {}) {
  const live = await fetchFn(id, opts);
  if (live) {
    try {
      await saveItemSnapshot('gallery', id, live);
    } catch (err) {
      console.warn('[CMS DB] save gallery item failed:', err.message);
    }
    return { item: live, fromDb: false };
  }
  const item = await loadItemSnapshot('gallery', id);
  if (item) return { item, fromDb: true };
  return { item: null, fromDb: false };
}

/** Force-sync in-scope pages from CMS into ova_db */
async function syncInScopePages(fetchPageFn, opts = {}) {
  const results = [];
  for (const slug of IN_SCOPE_PAGES) {
    const page = await fetchPageFn(slug, { ...opts, skipCache: true });
    if (page?.data) {
      await savePageSnapshot(slug, page);
      results.push({ slug, ok: true });
    } else {
      results.push({ slug, ok: false });
    }
  }
  return results;
}

module.exports = {
  isDbReady,
  savePageSnapshot,
  loadPageSnapshot,
  resolveCmsPage,
  resolveCmsList,
  resolveCmsGlobal,
  resolveCmsEvent,
  resolveCmsGalleryItem,
  syncInScopePages,
  IN_SCOPE_PAGES,
};

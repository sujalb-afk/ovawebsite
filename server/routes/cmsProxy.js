const express = require('express');
const {
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
} = require('../lib/cmsApi');
const {
  resolveCmsPage,
  resolveCmsList,
  resolveCmsGlobal,
  resolveCmsEvent,
  resolveCmsGalleryItem,
  syncInScopePages,
  isDbReady,
  IN_SCOPE_PAGES,
} = require('../lib/cmsPersistence');
const { getPublicAssetBase, rewriteDeep } = require('../lib/cmsAssetUrls');

const router = express.Router();

function noStoreJson(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
}

function sendJson(res, payload) {
  noStoreJson(res);
  res.json(rewriteDeep(payload));
}

function cmsFetchOptions(req) {
  return req.query.cms_refresh === '1' ? { skipCache: true } : {};
}

router.use((req, _res, next) => {
  if (req.query.cms_refresh === '1') clearCmsMemoryCache();
  next();
});

router.get('/health', async (_req, res) => {
  noStoreJson(res);
  const health = await fetchCmsHealth();
  res.json(rewriteDeep({ ...health, proxy: true, dbConnected: isDbReady() }));
});

router.get('/status', (_req, res) => {
  sendJson(res, {
    enabled: isCmsEnabled(),
    cmsApiUrl: process.env.OVA_CMS_API_URL || null,
    assetBaseUrl: getPublicAssetBase(),
    mediaPathsSameOrigin: true,
    hasPublicApiKey: Boolean((process.env.OVA_CMS_PUBLIC_API_KEY || '').trim()),
    ovaWebApi: `http://localhost:${process.env.PORT || 5004}`,
    cacheSeconds: Number(process.env.OVA_CMS_CONTENT_CACHE_SECONDS ?? 10),
    persistence: 'mongodb',
    dbConnected: isDbReady(),
    inScopePages: IN_SCOPE_PAGES,
  });
});

/** Pull latest published CMS into ova_db (Home, About, Services, Events page copy + events list) */
router.post('/sync', async (req, res) => {
  if (!isDbReady()) {
    return sendJson(res, {
      ok: false,
      message: 'MongoDB not connected. Set MONGODB_URI in server/.env and restart the server.',
    });
  }
  const opts = { skipCache: true };
  const pages = await syncInScopePages(fetchCmsPage, opts);
  const eventsResult = await resolveCmsList('events', fetchCmsEvents, opts);
  const globalResult = await resolveCmsGlobal(fetchCmsGlobal, opts);
  sendJson(res, {
    ok: true,
    pages,
    events: { ok: eventsResult.items !== null, count: eventsResult.items?.length ?? 0 },
    global: { ok: Boolean(globalResult.global), fromDb: globalResult.fromDb },
  });
});

router.get('/content/:slug', async (req, res) => {
  const slug = (req.params.slug || '').trim();
  if (!slug) {
    return sendJson(res, { ok: false, message: 'slug required' });
  }
  const opts = cmsFetchOptions(req);
  const page = await resolveCmsPage(slug, fetchCmsPage, opts);
  if (!page) {
    return sendJson(res, {
      ok: false,
      fromCms: false,
      slug,
      data: null,
      seo: null,
      message:
        'No CMS content in database yet and live CMS fetch failed. Publish in CMS-OVA, ensure CMS API is up, then reload or POST /api/cms/sync.',
    });
  }
  sendJson(res, {
    ok: true,
    fromCms: true,
    fromDb: Boolean(page.fromDb),
    stale: Boolean(page.stale),
    slug: page.slug,
    title: page.title,
    data: page.data,
    seo: page.seo,
    updatedAt: page.updatedAt,
  });
});

router.get('/global', async (req, res) => {
  const opts = cmsFetchOptions(req);
  const { global, fromDb } = await resolveCmsGlobal(fetchCmsGlobal, opts);
  sendJson(res, {
    ok: Boolean(global),
    fromCms: Boolean(global),
    fromDb,
    global: global || null,
  });
});

router.get('/events', async (req, res) => {
  const opts = cmsFetchOptions(req);
  const { items, fromDb, stale } = await resolveCmsList('events', fetchCmsEvents, opts);
  sendJson(res, {
    ok: items !== null,
    fromCms: items !== null,
    fromDb,
    stale,
    events: items || [],
  });
});

router.get('/events/:id', async (req, res) => {
  const opts = cmsFetchOptions(req);
  const { event, fromDb } = await resolveCmsEvent(req.params.id, fetchCmsEvent, opts);
  if (!event) {
    return sendJson(res, { ok: false, fromCms: false, event: null });
  }
  sendJson(res, { ok: true, fromCms: true, fromDb, event });
});

router.get('/services', async (req, res) => {
  const opts = cmsFetchOptions(req);
  const { items, fromDb, stale } = await resolveCmsList('services', fetchCmsServices, opts);
  sendJson(res, {
    ok: Boolean(items),
    fromCms: Boolean(items),
    fromDb,
    stale,
    services: items || [],
  });
});

router.get('/gallery', async (req, res) => {
  const opts = cmsFetchOptions(req);
  const { items, fromDb, stale } = await resolveCmsList('gallery', fetchCmsGallery, opts);
  sendJson(res, {
    ok: Boolean(items),
    fromCms: Boolean(items),
    fromDb,
    stale,
    gallery: items || [],
  });
});

router.get('/gallery/:id', async (req, res) => {
  const opts = cmsFetchOptions(req);
  const { item, fromDb } = await resolveCmsGalleryItem(req.params.id, fetchCmsGalleryItem, opts);
  if (!item) {
    return sendJson(res, { ok: false, fromCms: false, item: null });
  }
  sendJson(res, { ok: true, fromCms: true, fromDb, item });
});

router.get('/team', async (req, res) => {
  const opts = cmsFetchOptions(req);
  const { items, fromDb, stale } = await resolveCmsList('team', fetchCmsTeam, opts);
  sendJson(res, {
    ok: Boolean(items),
    fromCms: Boolean(items),
    fromDb,
    stale,
    team: items || [],
  });
});

module.exports = router;

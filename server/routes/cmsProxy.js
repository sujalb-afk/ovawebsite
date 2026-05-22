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
const { getPublicAssetBase, rewriteDeep } = require('../lib/cmsAssetUrls');

const router = express.Router();

function noStoreJson(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
}

function sendJson(res, payload) {
  noStoreJson(res);
  res.json(rewriteDeep(payload, getPublicAssetBase()));
}

function cmsFetchOptions(req) {
  return req.query.cms_refresh === '1' ? { skipCache: true } : {};
}

router.use((req, _res, next) => {
  if (req.query.cms_refresh === '1') clearCmsMemoryCache();
  next();
});

router.get('/health', async (req, res) => {
  noStoreJson(res);
  const health = await fetchCmsHealth();
  res.json(rewriteDeep({ ...health, proxy: true }, getPublicAssetBase()));
});

router.get('/status', (_req, res) => {
  sendJson(res, {
    enabled: isCmsEnabled(),
    cmsBase: process.env.OVA_CMS_API_URL || null,
    cmsLocalFallback: process.env.OVA_CMS_LOCAL_URL || 'http://localhost:5000',
    assetBaseUrl: getPublicAssetBase(),
    hasPublicApiKey: Boolean((process.env.OVA_CMS_PUBLIC_API_KEY || '').trim()),
    ovaWebApi: `http://localhost:${process.env.PORT || 5004}`,
    cacheSeconds: Number(process.env.OVA_CMS_CONTENT_CACHE_SECONDS ?? 10),
  });
});

router.get('/content/:slug', async (req, res) => {
  const slug = (req.params.slug || '').trim();
  if (!slug) {
    return sendJson(res, { ok: false, message: 'slug required' });
  }
  const opts = cmsFetchOptions(req);
  const page = await fetchCmsPage(slug, opts);
  if (!page) {
    return sendJson(res, {
      ok: false,
      fromCms: false,
      slug,
      data: null,
      seo: null,
      message:
        'CMS fetch failed or disabled. Check OVA_CMS_API_URL, OVA_CMS_PUBLIC_API_KEY, Publish in CMS, and restart OVA Web server.',
    });
  }
  sendJson(res, {
    ok: true,
    fromCms: true,
    stale: Boolean(page.stale),
    slug: page.slug,
    title: page.title,
    data: page.data,
    seo: page.seo,
    updatedAt: page.updatedAt,
  });
});

router.get('/global', async (req, res) => {
  const global = await fetchCmsGlobal(cmsFetchOptions(req));
  sendJson(res, { ok: Boolean(global), fromCms: Boolean(global), global: global || null });
});

router.get('/events', async (req, res) => {
  const events = await fetchCmsEvents(cmsFetchOptions(req));
  const list = Array.isArray(events) ? events : [];
  sendJson(res, {
    ok: events !== null,
    fromCms: events !== null,
    events: list,
  });
});

router.get('/events/:id', async (req, res) => {
  const event = await fetchCmsEvent(req.params.id, cmsFetchOptions(req));
  if (!event) {
    return sendJson(res, { ok: false, fromCms: false, event: null });
  }
  sendJson(res, { ok: true, fromCms: true, event });
});

router.get('/services', async (req, res) => {
  const services = await fetchCmsServices(cmsFetchOptions(req));
  sendJson(res, {
    ok: Boolean(services),
    fromCms: Boolean(services),
    services: services || [],
  });
});

router.get('/gallery', async (req, res) => {
  const gallery = await fetchCmsGallery(cmsFetchOptions(req));
  sendJson(res, {
    ok: Boolean(gallery),
    fromCms: Boolean(gallery),
    gallery: gallery || [],
  });
});

router.get('/gallery/:id', async (req, res) => {
  const item = await fetchCmsGalleryItem(req.params.id, cmsFetchOptions(req));
  if (!item) {
    return sendJson(res, { ok: false, fromCms: false, item: null });
  }
  sendJson(res, { ok: true, fromCms: true, item });
});

router.get('/team', async (req, res) => {
  const team = await fetchCmsTeam(cmsFetchOptions(req));
  sendJson(res, {
    ok: Boolean(team),
    fromCms: Boolean(team),
    team: team || [],
  });
});

module.exports = router;

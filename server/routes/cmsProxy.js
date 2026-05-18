const express = require('express');
const {
  fetchCmsPage,
  fetchCmsGlobal,
  fetchCmsEvents,
  fetchCmsEvent,
  fetchCmsServices,
  fetchCmsHealth,
  isCmsEnabled,
} = require('../lib/cmsApi');

const router = express.Router();

function noStoreJson(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
}

router.get('/health', async (_req, res) => {
  noStoreJson(res);
  const health = await fetchCmsHealth();
  res.json({ ...health, proxy: true });
});

router.get('/status', (_req, res) => {
  noStoreJson(res);
  res.json({
    enabled: isCmsEnabled(),
    cmsBase: process.env.OVA_CMS_API_URL || null,
    cmsLocalFallback: process.env.OVA_CMS_LOCAL_URL || 'http://localhost:5000',
    ovaWebApi: `http://localhost:${process.env.PORT || 5004}`,
    cacheSeconds: Number(process.env.OVA_CMS_CONTENT_CACHE_SECONDS ?? 10),
  });
});

router.get('/content/:slug', async (req, res) => {
  noStoreJson(res);
  const slug = (req.params.slug || '').trim();
  if (!slug) {
    return res.status(400).json({ ok: false, message: 'slug required' });
  }
  const page = await fetchCmsPage(slug);
  if (!page) {
    return res.json({
      ok: false,
      fromCms: false,
      slug,
      data: null,
      seo: null,
      message: 'CMS fetch failed or disabled. Check OVA_CMS_API_URL and that CMS is published.',
    });
  }
  res.json({
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

router.get('/global', async (_req, res) => {
  const global = await fetchCmsGlobal();
  res.json({ ok: Boolean(global), fromCms: Boolean(global), global: global || null });
});

router.get('/events', async (_req, res) => {
  noStoreJson(res);
  const events = await fetchCmsEvents();
  const list = Array.isArray(events) ? events : [];
  res.json({
    ok: events !== null,
    fromCms: events !== null,
    events: list,
  });
});

router.get('/events/:id', async (req, res) => {
  const event = await fetchCmsEvent(req.params.id);
  if (!event) {
    return res.json({ ok: false, fromCms: false, event: null });
  }
  res.json({ ok: true, fromCms: true, event });
});

router.get('/services', async (_req, res) => {
  const services = await fetchCmsServices();
  res.json({
    ok: Boolean(services),
    fromCms: Boolean(services),
    services: services || [],
  });
});

module.exports = router;

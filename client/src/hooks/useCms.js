import { useEffect, useState, useRef, useCallback } from 'react';
import { normalizeSitePageData, normalizeCmsGlobal } from '../utils/cmsMappers';
import { rewriteCmsMediaDeep } from '../utils/cmsMediaUrls';

const apiBase = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || '';
/** Refetch so Publish updates sync to MongoDB and appear on the site */
const CMS_REFETCH_MS = 15000;

let cmsEnabledConfirmed = false;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function checkCmsEnabled() {
  return cmsFetch('/status', 2)
    .then((j) => {
      const enabled = Boolean(j?.enabled);
      if (enabled) cmsEnabledConfirmed = true;
      else cmsEnabledConfirmed = false;
      return enabled;
    })
    .catch(() => {
      cmsEnabledConfirmed = false;
      return false;
    });
}

function cmsPathWithRefresh(path) {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}cms_refresh=1`;
}

async function cmsFetch(path, attempts = 3) {
  const url = `${apiBase}/api/cms${cmsPathWithRefresh(path)}`;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) return res.json();
      if (import.meta.env.DEV && i === attempts - 1) {
        console.warn('[CMS] proxy error', res.status, url);
      }
    } catch (err) {
      if (import.meta.env.DEV && i === attempts - 1) {
        console.warn('[CMS] fetch failed', url, err?.message || err);
      }
    }
    if (i < attempts - 1) await sleep(500 * (i + 1));
  }
  return null;
}

function applyPageJson(json, slug) {
  if (json?.ok && json.data) {
    const data = rewriteCmsMediaDeep(
      normalizeSitePageData(slug, json.data, json.title)
    );
    return {
      loading: false,
      data,
      seo: json.seo || null,
      fromCms: true,
      stale: Boolean(json.stale || json.fromDb),
      cmsEnabled: true,
      fromDb: Boolean(json.fromDb),
    };
  }
  return null;
}

export function useCmsPage(slug) {
  const [state, setState] = useState({
    loading: true,
    data: null,
    seo: null,
    fromCms: false,
    stale: false,
    cmsEnabled: null,
    fromDb: false,
  });
  const slugRef = useRef(slug);

  const loadPage = useCallback(async (options = {}) => {
    const { silent = false } = options;
    const currentSlug = slugRef.current;
    if (!currentSlug) return;

    if (!silent) {
      setState((prev) => ({ ...prev, loading: true }));
    }

    const enabled = await checkCmsEnabled();
    if (slugRef.current !== currentSlug) return;

    if (!enabled) {
      if (!silent) {
        setState({
          loading: false,
          data: null,
          seo: null,
          fromCms: false,
          stale: false,
          cmsEnabled: false,
          fromDb: false,
        });
      }
      return;
    }

    const json = await cmsFetch(`/content/${currentSlug}`);
    if (slugRef.current !== currentSlug) return;

    const applied = applyPageJson(json, currentSlug);
    if (applied) {
      setState(applied);
      return;
    }

    if (!silent) {
      setState({
        loading: false,
        data: null,
        seo: null,
        fromCms: false,
        stale: false,
        cmsEnabled: true,
        fromDb: false,
      });
    }
  }, []);

  useEffect(() => {
    slugRef.current = slug;
    loadPage();

    const onFocus = () => loadPage({ silent: true });
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadPage({ silent: true });
    };
    const intervalId = setInterval(() => loadPage({ silent: true }), CMS_REFETCH_MS);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(intervalId);
    };
  }, [slug, loadPage]);

  return state;
}

export function useCmsEvents() {
  const [state, setState] = useState({
    loading: true,
    events: null,
    fromCms: false,
    stale: false,
    fromDb: false,
  });

  const loadEvents = useCallback(async (options = {}) => {
    const { silent = false } = options;

    if (!silent) {
      setState((prev) => ({ ...prev, loading: true }));
    }

    const enabled = await checkCmsEnabled();
    if (!enabled) {
      if (!silent) {
        setState({ loading: false, events: null, fromCms: false, stale: false, fromDb: false });
      }
      return;
    }

    const json = await cmsFetch('/events');
    if (json?.ok && Array.isArray(json.events)) {
      setState({
        loading: false,
        events: rewriteCmsMediaDeep(json.events),
        fromCms: true,
        stale: Boolean(json.stale || json.fromDb),
        fromDb: Boolean(json.fromDb),
      });
      return;
    }

    if (!silent) {
      setState({ loading: false, events: null, fromCms: false, stale: false, fromDb: false });
    }
  }, []);

  useEffect(() => {
    loadEvents();

    const onFocus = () => loadEvents({ silent: true });
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadEvents({ silent: true });
    };
    const intervalId = setInterval(() => loadEvents({ silent: true }), CMS_REFETCH_MS);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(intervalId);
    };
  }, [loadEvents]);

  return state;
}

export function useCmsServices() {
  const [state, setState] = useState({
    loading: true,
    services: null,
    fromCms: false,
    stale: false,
    fromDb: false,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) setState({ loading: false, services: null, fromCms: false, stale: false, fromDb: false });
        return;
      }

      const json = await cmsFetch('/services');
      if (cancelled) return;

      if (json?.ok && Array.isArray(json.services)) {
        setState({
          loading: false,
          services: rewriteCmsMediaDeep(json.services),
          fromCms: true,
          stale: Boolean(json.stale || json.fromDb),
          fromDb: Boolean(json.fromDb),
        });
        return;
      }

      setState({ loading: false, services: null, fromCms: false, stale: false, fromDb: false });
    };

    load();
    const intervalId = setInterval(load, CMS_REFETCH_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return state;
}

export function useCmsEvent(id) {
  const [state, setState] = useState({
    loading: true,
    event: null,
    fromCms: false,
    stale: false,
    fromDb: false,
  });

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;

    const load = async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) setState({ loading: false, event: null, fromCms: false, stale: false, fromDb: false });
        return;
      }

      const json = await cmsFetch(`/events/${encodeURIComponent(id)}`);
      if (cancelled) return;

      if (json?.ok && json.event) {
        setState({
          loading: false,
          event: rewriteCmsMediaDeep(json.event),
          fromCms: true,
          stale: Boolean(json.stale || json.fromDb),
          fromDb: Boolean(json.fromDb),
        });
        return;
      }

      setState({ loading: false, event: null, fromCms: false, stale: false, fromDb: false });
    };

    load();
    const intervalId = setInterval(load, CMS_REFETCH_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [id]);

  return state;
}

export function useCmsGlobal() {
  const [state, setState] = useState({
    loading: true,
    global: null,
    fromCms: false,
    stale: false,
    fromDb: false,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) setState({ loading: false, global: null, fromCms: false, stale: false, fromDb: false });
        return;
      }

      const json = await cmsFetch('/global');
      if (cancelled) return;

      if (json?.ok && json.global) {
        const global = normalizeCmsGlobal(rewriteCmsMediaDeep(json.global));
        setState({
          loading: false,
          global,
          fromCms: Boolean(global),
          stale: Boolean(json.stale || json.fromDb),
          fromDb: Boolean(json.fromDb),
        });
        return;
      }

      setState({ loading: false, global: null, fromCms: false, stale: false, fromDb: false });
    };

    load();
    const intervalId = setInterval(load, CMS_REFETCH_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return state;
}

export function useCmsGallery() {
  const [state, setState] = useState({
    loading: true,
    gallery: null,
    fromCms: false,
    stale: false,
    fromDb: false,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) setState({ loading: false, gallery: null, fromCms: false, stale: false, fromDb: false });
        return;
      }

      const json = await cmsFetch('/gallery');
      if (cancelled) return;

      if (json?.ok && Array.isArray(json.gallery)) {
        setState({
          loading: false,
          gallery: rewriteCmsMediaDeep(json.gallery),
          fromCms: true,
          stale: Boolean(json.stale || json.fromDb),
          fromDb: Boolean(json.fromDb),
        });
        return;
      }

      setState({ loading: false, gallery: null, fromCms: false, stale: false, fromDb: false });
    };

    load();
    const intervalId = setInterval(load, CMS_REFETCH_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return state;
}

export function useCmsGalleryItem(id) {
  const [state, setState] = useState({
    loading: true,
    item: null,
    fromCms: false,
    stale: false,
    fromDb: false,
  });

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;

    const load = async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) setState({ loading: false, item: null, fromCms: false, stale: false, fromDb: false });
        return;
      }

      const json = await cmsFetch(`/gallery/${encodeURIComponent(id)}`);
      if (cancelled) return;

      if (json?.ok && json.item) {
        setState({
          loading: false,
          item: rewriteCmsMediaDeep(json.item),
          fromCms: true,
          stale: Boolean(json.stale || json.fromDb),
          fromDb: Boolean(json.fromDb),
        });
        return;
      }

      setState({ loading: false, item: null, fromCms: false, stale: false, fromDb: false });
    };

    load();
    const intervalId = setInterval(load, CMS_REFETCH_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [id]);

  return state;
}

export function useCmsService(id) {
  const [state, setState] = useState({
    loading: true,
    service: null,
    fromCms: false,
    stale: false,
    fromDb: false,
  });

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;

    const load = async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) setState({ loading: false, service: null, fromCms: false, stale: false, fromDb: false });
        return;
      }

      const json = await cmsFetch(`/services/${encodeURIComponent(id)}`);
      if (cancelled) return;

      if (json?.ok && json.service) {
        setState({
          loading: false,
          service: rewriteCmsMediaDeep(json.service),
          fromCms: true,
          stale: Boolean(json.stale || json.fromDb),
          fromDb: Boolean(json.fromDb),
        });
        return;
      }

      setState({ loading: false, service: null, fromCms: false, stale: false, fromDb: false });
    };

    load();
    const intervalId = setInterval(load, CMS_REFETCH_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [id]);

  return state;
}

export function useCmsTeam() {
  const [state, setState] = useState({
    loading: true,
    team: null,
    fromCms: false,
    stale: false,
    fromDb: false,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) setState({ loading: false, team: null, fromCms: false, stale: false, fromDb: false });
        return;
      }

      const json = await cmsFetch('/team');
      if (cancelled) return;

      if (json?.ok && Array.isArray(json.team)) {
        setState({
          loading: false,
          team: rewriteCmsMediaDeep(json.team),
          fromCms: true,
          stale: Boolean(json.stale || json.fromDb),
          fromDb: Boolean(json.fromDb),
        });
        return;
      }

      setState({ loading: false, team: null, fromCms: false, stale: false, fromDb: false });
    };

    load();
    const intervalId = setInterval(load, CMS_REFETCH_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return state;
}

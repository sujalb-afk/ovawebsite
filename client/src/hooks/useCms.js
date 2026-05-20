import { useEffect, useState, useRef, useCallback } from 'react';
import { loadCmsPageCache, saveCmsPageCache, loadCmsEventsCache, saveCmsEventsCache } from '../utils/cmsStorage';

const apiBase = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || '';
/** Match server OVA_CMS_CONTENT_CACHE_SECONDS — refetch so Publish updates appear */
const CMS_REFETCH_MS = 15000;

let cmsEnabledConfirmed = false;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function checkCmsEnabled() {
  if (cmsEnabledConfirmed) return Promise.resolve(true);
  return cmsFetch('/status', 2)
    .then((j) => {
      const enabled = Boolean(j?.enabled);
      if (enabled) cmsEnabledConfirmed = true;
      return enabled;
    })
    .catch(() => false);
}

async function cmsFetch(path, attempts = 3) {
  const url = `${apiBase}/api/cms${path}`;
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

function cmsVersionChanged(cachedAt, apiAt) {
  if (!apiAt) return true;
  if (!cachedAt) return true;
  return String(apiAt) !== String(cachedAt);
}

function applyPageJson(json, slug, cached) {
  if (json?.ok && json.data) {
    const changed = cmsVersionChanged(cached?.updatedAt, json.updatedAt);
    saveCmsPageCache(slug, {
      data: json.data,
      seo: json.seo,
      updatedAt: json.updatedAt,
    });
    return {
      loading: false,
      data: json.data,
      seo: json.seo || null,
      fromCms: true,
      stale: Boolean(json.stale),
      cmsEnabled: true,
      changed,
    };
  }
  return null;
}

function initialPageState(slug) {
  const cached = loadCmsPageCache(slug);
  if (cached?.data) {
    return {
      loading: true,
      data: cached.data,
      seo: cached.seo,
      fromCms: true,
      stale: true,
      cmsEnabled: true,
    };
  }
  return {
    loading: true,
    data: null,
    seo: null,
    fromCms: false,
    stale: false,
    cmsEnabled: null,
  };
}

export function useCmsPage(slug) {
  const [state, setState] = useState(() => initialPageState(slug));
  const slugRef = useRef(slug);

  const loadPage = useCallback(async (options = {}) => {
    const { silent = false } = options;
    const currentSlug = slugRef.current;
    if (!currentSlug) return;

    const cached = loadCmsPageCache(currentSlug);

    if (!silent) {
      setState((prev) => ({
        ...prev,
        loading: true,
        data: cached?.data ?? prev.data,
        seo: cached?.seo ?? prev.seo,
        fromCms: Boolean(cached?.data) || prev.fromCms,
        stale: Boolean(cached?.data) && !prev.fromCms ? true : prev.stale,
      }));
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
        });
      }
      return;
    }

    const json = await cmsFetch(`/content/${currentSlug}`);
    if (slugRef.current !== currentSlug) return;

    const applied = applyPageJson(json, currentSlug, cached);
    if (applied) {
      setState((prev) => {
        if (silent && !applied.changed && prev.data === applied.data) return prev;
        return applied;
      });
      return;
    }

    const fallback = loadCmsPageCache(currentSlug);
    if (fallback?.data) {
      setState({
        loading: false,
        data: fallback.data,
        seo: fallback.seo,
        fromCms: true,
        stale: true,
        cmsEnabled: true,
      });
      if (import.meta.env.DEV) {
        console.warn('[CMS] Using cached page copy for', currentSlug, '(live fetch failed)');
      }
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

function initialEventsState() {
  const cached = loadCmsEventsCache();
  if (cached?.events) {
    return {
      loading: true,
      events: cached.events,
      fromCms: true,
      stale: true,
    };
  }
  return { loading: true, events: null, fromCms: false, stale: false };
}

export function useCmsEvents() {
  const [state, setState] = useState(initialEventsState);

  const loadEvents = useCallback(async (options = {}) => {
    const { silent = false } = options;
    const cached = loadCmsEventsCache();

    if (!silent) {
      setState((prev) => ({
        ...prev,
        loading: true,
        events: cached?.events ?? prev.events,
        fromCms: Boolean(cached?.events) || prev.fromCms,
        stale: Boolean(cached?.events) && !prev.fromCms ? true : prev.stale,
      }));
    }

    const enabled = await checkCmsEnabled();
    if (!enabled) {
      if (!silent) {
        setState({ loading: false, events: null, fromCms: false, stale: false });
      }
      return;
    }

    const json = await cmsFetch('/events');
    if (json?.ok && Array.isArray(json.events)) {
      const changed = cmsVersionChanged(
        cached?.updatedAt,
        json.events[0]?.updatedAt || json.updatedAt
      );
      saveCmsEventsCache(json.events, json.updatedAt);
      setState((prev) => {
        if (silent && !changed && prev.events === json.events) return prev;
        return {
          loading: false,
          events: json.events,
          fromCms: true,
          stale: Boolean(json.stale),
        };
      });
      return;
    }

    if (cached?.events) {
      setState({
        loading: false,
        events: cached.events,
        fromCms: true,
        stale: true,
      });
      return;
    }

    if (!silent) {
      setState({ loading: false, events: null, fromCms: false, stale: false });
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

export function useCmsEvent(id) {
  const [state, setState] = useState({
    loading: true,
    event: null,
    fromCms: false,
    stale: false,
  });

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;

    const load = async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) setState({ loading: false, event: null, fromCms: false, stale: false });
        return;
      }

      const json = await cmsFetch(`/events/${encodeURIComponent(id)}`);
      if (cancelled) return;

      if (json?.ok && json.event) {
        setState({
          loading: false,
          event: json.event,
          fromCms: true,
          stale: Boolean(json.stale),
        });
        return;
      }

      setState({ loading: false, event: null, fromCms: false, stale: false });
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
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) setState({ loading: false, global: null, fromCms: false, stale: false });
        return;
      }

      const json = await cmsFetch('/global');
      if (cancelled) return;

      if (json?.ok && json.global) {
        setState({
          loading: false,
          global: json.global,
          fromCms: true,
          stale: Boolean(json.stale),
        });
        return;
      }

      setState({ loading: false, global: null, fromCms: false, stale: false });
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
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) setState({ loading: false, gallery: null, fromCms: false, stale: false });
        return;
      }

      const json = await cmsFetch('/gallery');
      if (cancelled) return;

      if (json?.ok && Array.isArray(json.gallery)) {
        setState({
          loading: false,
          gallery: json.gallery,
          fromCms: true,
          stale: Boolean(json.stale),
        });
        return;
      }

      setState({ loading: false, gallery: null, fromCms: false, stale: false });
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
  });

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;

    const load = async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) setState({ loading: false, item: null, fromCms: false, stale: false });
        return;
      }

      const json = await cmsFetch(`/gallery/${encodeURIComponent(id)}`);
      if (cancelled) return;

      if (json?.ok && json.item) {
        setState({
          loading: false,
          item: json.item,
          fromCms: true,
          stale: Boolean(json.stale),
        });
        return;
      }

      setState({ loading: false, item: null, fromCms: false, stale: false });
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
  });

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;

    const load = async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) setState({ loading: false, service: null, fromCms: false, stale: false });
        return;
      }

      const json = await cmsFetch(`/services/${encodeURIComponent(id)}`);
      if (cancelled) return;

      if (json?.ok && json.service) {
        setState({
          loading: false,
          service: json.service,
          fromCms: true,
          stale: Boolean(json.stale),
        });
        return;
      }

      setState({ loading: false, service: null, fromCms: false, stale: false });
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
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) setState({ loading: false, team: null, fromCms: false, stale: false });
        return;
      }

      const json = await cmsFetch('/team');
      if (cancelled) return;

      if (json?.ok && Array.isArray(json.team)) {
        setState({
          loading: false,
          team: json.team,
          fromCms: true,
          stale: Boolean(json.stale),
        });
        return;
      }

      setState({ loading: false, team: null, fromCms: false, stale: false });
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

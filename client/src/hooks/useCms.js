import { useEffect, useState, useRef } from 'react';
import { loadCmsPageCache, saveCmsPageCache, loadCmsEventsCache, saveCmsEventsCache } from '../utils/cmsStorage';

const apiBase = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || '';

let cmsEnabledPromise = null;

function checkCmsEnabled() {
  if (!cmsEnabledPromise) {
    cmsEnabledPromise = fetch(`${apiBase}/api/cms/status`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((j) => Boolean(j?.enabled))
      .catch(() => false);
  }
  return cmsEnabledPromise;
}

async function cmsFetch(path) {
  const url = `${apiBase}/api/cms${path}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!res.ok) {
    if (import.meta.env.DEV) {
      console.warn('[CMS] proxy error', res.status, url);
    }
    return null;
  }
  return res.json();
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

  useEffect(() => {
    slugRef.current = slug;
    let cancelled = false;

    const cached = loadCmsPageCache(slug);
    setState((prev) => ({
      ...prev,
      loading: true,
      data: cached?.data ?? prev.data,
      seo: cached?.seo ?? prev.seo,
      fromCms: Boolean(cached?.data) || prev.fromCms,
      stale: Boolean(cached?.data) && !prev.fromCms ? true : prev.stale,
    }));

    (async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled) return;

      if (!enabled) {
        setState({
          loading: false,
          data: null,
          seo: null,
          fromCms: false,
          stale: false,
          cmsEnabled: false,
        });
        return;
      }

      const json = await cmsFetch(`/content/${slug}`);
      if (cancelled || slugRef.current !== slug) return;

      if (json?.ok && json.data) {
        saveCmsPageCache(slug, {
          data: json.data,
          seo: json.seo,
          updatedAt: json.updatedAt,
        });
        setState({
          loading: false,
          data: json.data,
          seo: json.seo || null,
          fromCms: true,
          stale: Boolean(json.stale),
          cmsEnabled: true,
        });
        return;
      }

      const fallback = loadCmsPageCache(slug);
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
          console.warn('[CMS] Using cached page copy for', slug, '(live fetch failed)');
        }
        return;
      }

      setState({
        loading: false,
        data: null,
        seo: null,
        fromCms: false,
        stale: false,
        cmsEnabled: true,
      });
    })();

    return () => { cancelled = true; };
  }, [slug]);

  return state;
}

function initialEventsState() {
  const cached = loadCmsEventsCache();
  if (cached?.events?.length) {
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const enabled = await checkCmsEnabled();
      if (cancelled || !enabled) {
        if (!cancelled) {
          setState({ loading: false, events: null, fromCms: false, stale: false });
        }
        return;
      }

      const json = await cmsFetch('/events');
      if (cancelled) return;

      if (json?.ok && Array.isArray(json.events) && json.events.length) {
        saveCmsEventsCache(json.events);
        setState({
          loading: false,
          events: json.events,
          fromCms: true,
          stale: Boolean(json.stale),
        });
        return;
      }

      const cached = loadCmsEventsCache();
      if (cached?.events?.length) {
        setState({
          loading: false,
          events: cached.events,
          fromCms: true,
          stale: true,
        });
        return;
      }

      setState({ loading: false, events: null, fromCms: false, stale: false });
    })();

    return () => { cancelled = true; };
  }, []);

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

    (async () => {
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
    })();

    return () => { cancelled = true; };
  }, [id]);

  return state;
}

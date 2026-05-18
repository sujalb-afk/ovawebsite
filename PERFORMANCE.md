# Performance optimizations (Lighthouse / Core Web Vitals)

This document summarizes the performance work applied. **Content, fonts, UI, and layout are unchanged.**

## Lighthouse report (download.pdf) – analysis and fixes

| Issue | Est. impact | Fix applied |
|-------|-------------|-------------|
| Improve image delivery | 8,412 KiB | All images converted to WebP; app uses `getOptimizedImageUrl()`; preload `herobg1.webp`. |
| Render blocking | 1,210 ms | Fonts + Bootstrap load async; scripts defer/async. |
| Font display | 390 ms | Async load + `display=swap`. |
| Cache lifetimes | 595 KiB | Long-term immutable cache for static assets. |
| Image width/height | CLS | Explicit width/height on all `<img>`; footer logo 80×80. |
| Network payloads | 10,896 KiB | WebP + hero &lt;200KB. |
| Non-composited animations | TBT | Pulse uses transform/opacity only. |
| Footer CLS | CLS &lt;0.1 | Footer: min-height, contain:layout, no initial opacity:0; animation uses transform only. |
| reCAPTCHA on load | TBT/FCP | reCAPTCHA script loaded only when Contact/Donate/Join mount (~360KB deferred). |
| LCP discoverable | FCP/LCP | Preload `about-hero-bg-silhouettes.webp` and `herobg1.webp` with `fetchpriority="high"` in HTML. |
| Navbar logo size | 8,412 KiB | Logo displayed at 90×90 with srcset 90w/180w; script emits `-90w.webp`/`-180w.webp` (run `npm run optimize-images`). |
| Accessibility | Score 90→100 | Touch targets ≥48px; heading order (h5→h3); muted text contrast (--text-muted darkened slightly). |

## What was done

- **All images to WebP:** `scripts/optimize-images.js` converts every PNG/JPG in `client/public` to WebP. **`npm run build`** runs it automatically. Hero slides, gallery, events, services, team, navbar, VerifyDonation all use `getOptimizedImageUrl()`.
- **LCP (hero):** Hero slides load `.webp`; preload is `herobg1.webp`. Hero images compressed to &lt;200KB, max width 1920px.
- **Code splitting:** All route-level components except Home are lazy-loaded with `React.lazy()` and wrapped in `Suspense`. Home loads eagerly for fast LCP.
- **Render blocking:** Google Fonts and Bootstrap/Bootstrap Icons CSS load asynchronously (`media="print"` + `onload="this.media='all'"`). Preconnect for fonts and CDN is in place. Scripts use `defer`/`async`.
- **Lazy loading:** All non-hero images use `loading="lazy"` and `decoding="async"`. Explicit `width`/`height` on images to avoid CLS.
- **Server:** Compression (gzip) and long-term cache headers (`Cache-Control: public, max-age=31536000, immutable`) for static assets (JS, CSS, images, fonts) are enabled in the Express server.
- **Animations:** Donate button pulse uses GPU-friendly `transform` and `opacity` (pseudo-element ring) instead of animating `box-shadow`. Shimmer already used `transform`.
- **Image pipeline:** `scripts/optimize-images.js` converts all PNG/JPG in `client/public` to WebP. The app uses `getOptimizedImageUrl()` so that after running the script, images are served as WebP with fallback to the original path on error.

## What you need to do

1. **WebP:** `npm run build` runs `optimize-images` first. To generate WebP only: `npm run optimize-images`. Source PNG/JPG must exist in `client/public`.

2. **Measure in production:** Run Lighthouse on the **production** build (e.g. `npm run build` then serve the build or deploy). Use “Mobile” and “Clear storage” for realistic scores. Targets: Performance 90+, LCP &lt;2.5s, FCP &lt;1.8s, TBT &lt;200ms, CLS &lt;0.1.

3. **Optional:** To reduce bundle size further, consider removing unused dependencies and running a bundle analyzer (`npm install --save-dev source-map-explorer` and analyze `build/static/js/*.js`).

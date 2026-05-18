# Performance & Lighthouse

## STEP 1 — How to test (run Lighthouse on production, not dev)

Running Lighthouse against `npm start` (development server) gives low scores (unminified JS, no tree-shaking, large payload). **Always test against a production build.**

### Correct testing steps

1. **Stop** the dev server (Ctrl+C).
2. **Build:** `npm run build`
3. **Install serve globally (once):** `npm install -g serve`
4. **Start production server:** `serve -s build -l 3000`  
   Or use the script: `npm run serve` (after `npm run build`).
5. **Run Lighthouse** against `http://localhost:3000`

This single change typically raises the score by 15–20 points (minified JS, tree-shaking, no react-dom.development.js, compressed assets).

## Other optimizations applied

- **LCP hero:** About-hero background uses `<img>` with preload; no CSS background-image on LCP element.
- **Bootstrap/Icons:** Loaded from local packages in `src/index.js`, not CDN (no render-blocking CDN).
- **Google Fonts:** Preconnect + `display=swap`; fonts unchanged.
- **Tailwind:** `content` includes `./src/**/*.{js,jsx,ts,tsx}` and `./public/index.html`.
- **reCAPTCHA:** Lazy-loaded only on Contact page.
- **Images:** Explicit `width` and `height` on all `<img>` tags.
- **Form/button animations:** Composited-only transitions (opacity, transform) on form controls and `.btn-ova`.

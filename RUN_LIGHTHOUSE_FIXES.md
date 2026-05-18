# Run Lighthouse Fixes — Exact Steps

**Always test performance against a production build, never `npm start`.**

**Performance fixes applied:** CLS reduced (footer min-heights, icon containers, opacity-only animation). Footer lazy-loaded. Main CSS async (postbuild). PurgeCSS + hero-class safelist. First hero slide uses `<img fetchPriority="high">` for LCP. Bootstrap JS and Icons load after first paint. Main JS preloaded in postbuild. For best LCP (<2.5s), compress hero images before build (see below).

---

## FIX 0 — Compress hero images for LCP (recommended before build)

From **project root** (ensures hero images are &lt;100KB for faster LCP):

```powershell
npm install sharp --save-dev
node scripts/compress-hero-webp.js
```

Then run `cd client` and `npm run build`.

---

## FIX 1 — Build and serve production (mandatory before testing)

Run these commands in order. Use **PowerShell** or **Command Prompt** from the project root `OVA_Web`:

```powershell
cd client
npm run build
```

Then serve the build:

```powershell
npx serve -s build -l 3000
```

(If you prefer a global install: `npm install -g serve` then `serve -s build -l 3000`.)

**Then:**

1. Open a **new Chrome Incognito** window.
2. Go to **http://localhost:3000**
3. Run **Lighthouse** (DevTools → Lighthouse tab) against `http://localhost:3000`.

**Never run Lighthouse against `npm start`.**

---

## FIX 2 — Generate .webp images (if any are missing)

From the **project root** (not inside `client`):

```powershell
npm install sharp --save-dev
node scripts/optimize-images.js
```

This converts all PNG/JPG/JPEG under `client/public` to WebP (max width 1920, no enlargement) and creates 90px/180px logo variants. The code already references `.webp` paths; this script creates the files.

## FIX 8 — Compress hero images (optional, for 90+ score)

From the **project root**:

```powershell
node scripts/compress-hero-webp.js
```

(Requires `sharp` installed.) Targets herobg1, herobg3, herobg4 under 80 KiB each.

---

## After all fixes — Final test

```powershell
cd client
npm run build
npx serve -s build -l 3000
```

Then in Chrome Incognito: open **http://localhost:3000** and run Lighthouse.

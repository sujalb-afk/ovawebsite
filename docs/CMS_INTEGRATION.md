# OVA Website — CMS Published Content Integration

## Mission

**Home, About, Services, and Events** show **published** content from **CMS-OVA** (`ova_cms` MongoDB) via `/api/public/*`. Staff must click **Publish** in CMS admin (not only Save draft). Static fallbacks apply when CMS is disabled or unreachable.

**Branch:** `sujal` (unless told otherwise). **Do not** change CMS-OVA API routes or response shapes.

---

## Architecture

| App | Port | Role |
|-----|------|------|
| CMS-OVA API | **5000** | `GET /api/public/content/:slug`, `/events`, etc. |
| CMS admin | 5173 | Edit → Save draft → **Publish** |
| OVA Web Express | **5004** | `GET /api/cms/*` → `server/lib/cmsApi.js` |
| OVA Web Vite | **3000** | React; fetches `/api/cms/*` on **5004** only |

```text
Browser → localhost:3000/api/cms/content/home?cms_refresh=1
        → OVA Web :5004 (cmsProxy)
        → CMS GET /api/public/content/home?locale=en&api_key=...
        → { ok, fromCms, data } → useCmsPage()
```

**Never** point `VITE_API_PROXY_TARGET` at CMS port 5000.

---

## Required env

### `server/.env`

```env
PORT=5004
OVA_CMS_API_URL=https://larry-epicentral-boldfacedly.ngrok-free.dev
OVA_CMS_PUBLIC_API_KEY=ova_pub_demo_sk_8f3a2b1c9d4e5f6a7b8c9d0e1f2a3b4c
OVA_CMS_CONTENT_ENABLED=true
OVA_CMS_CONTENT_CACHE_SECONDS=10
OVA_CMS_LOCAL_URL=http://localhost:5000
OVA_CMS_ASSET_URL=https://larry-epicentral-boldfacedly.ngrok-free.dev
```

Every server-side CMS request sends:

- `x-api-key: <OVA_CMS_PUBLIC_API_KEY>`
- `?api_key=<same>` on the URL
- `ngrok-skip-browser-warning: 1`
- `Accept: application/json`

### `client/.env.development`

```env
VITE_API_PROXY_TARGET=http://localhost:5004
VITE_OVA_CMS_ASSET_URL=http://localhost:5000
```

In dev, the client appends `cms_refresh=1` to bypass the 10s server memory cache after Publish.

---

## Two-terminal dev setup

**Terminal 1 — CMS**

```bash
cd CMS-OVA/server
npm run dev                    # :5000
ngrok http 5000                # tunnel host = OVA_CMS_API_URL
```

CMS `.env`: `PUBLIC_API_KEY` must match `OVA_CMS_PUBLIC_API_KEY`. `PUBLIC_API_URL` = ngrok HTTPS (for `/uploads/*`).

**Terminal 2 — OVA Web**

```bash
cd OVA_Web-main
npm run dev                    # :5004 API + :3000 Vite
```

Or: `npm run dev:cms-stack` (CMS + API + client if paths match).

---

## Verify (must pass before debugging React)

**1) CMS direct**

```bash
curl "https://YOUR-NGROK/api/public/content/home?locale=en&api_key=YOUR_KEY"
```

→ `200`, `page.data` has **published** hero text.

**2) OVA proxy** (restart server after `.env` changes)

```bash
curl "http://localhost:5004/api/cms/content/home?cms_refresh=1"
```

→ `{ "ok": true, "fromCms": true, "data": { ... } }` matching step 1.

**3) Through Vite**

```bash
curl "http://localhost:3000/api/cms/content/home?cms_refresh=1"
```

→ same as step 2.

| Step 1 OK, 2 fails | Fix `cmsApi.js`, env, API key, `PORT=5004` |
| Step 2 OK, UI stale | Hard refresh; check `fromCms` and field mapping |

---

## Site routes → CMS

| Route | Slug | Proxy |
|-------|------|--------|
| `/` | `home` | `/api/cms/content/home` |
| `/about` | `about` | `/api/cms/content/about` |
| `/services` | `services` | content + `/api/cms/services` |
| `/events` | `events` | content + `/api/cms/events` |

Field aliases: `client/src/utils/cmsMappers.js` → `normalizeSitePageData()` (legal `body`/`contentHtml`, thankyou, contact/join heroes, FAQ items).

---

## Publish workflow

1. CMS admin → edit → **Publish**
2. Wait ~10s or refocus tab (client refetch every 15s; dev uses `cms_refresh=1`)
3. Hard refresh `localhost:3000` (Ctrl+Shift+R)

---

## Production (ova.ngo)

- Set all `OVA_CMS_*` on the Node server that runs Express
- `OVA_CMS_PUBLIC_API_KEY` required for ngrok/production CMS
- CMS `PUBLIC_ORIGINS` must include `https://ova.ngo` and `https://www.ova.ngo`
- Republish pages once after deploy if seed text still appears

---

## Key files

- `server/lib/cmsApi.js` — fetch + API key + cache
- `server/routes/cmsProxy.js` — `/api/cms/*`
- `client/src/hooks/useCms.js`
- `client/src/utils/cmsMappers.js`
- `client/vite.config.js`

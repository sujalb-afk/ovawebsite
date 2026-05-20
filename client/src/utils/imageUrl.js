/**
 * Returns the WebP version of an image path for smaller payloads.
 * Run `npm run optimize-images` to generate .webp files in public.
 * Falls back to original path for non-PNG/JPG (e.g. already .webp or .svg).
 */
export function getOptimizedImageUrl(path) {
  if (!path || typeof path !== 'string') return path;
  return path.replace(/\.(png|jpe?g)$/i, '.webp');
}

export function cmsImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  const t = url.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  // Relative paths should be rare if CMS is configured; resolve against CMS base:
  let base = "";
  try {
    if (typeof process !== "undefined" && process.env) {
      base = process.env.OVA_CMS_API_URL || "";
    }
  } catch (e) {}
  try {
    if (!base && typeof import.meta !== "undefined" && import.meta.env) {
      base = import.meta.env.VITE_OVA_CMS_API_URL || import.meta.env.REACT_APP_OVA_CMS_API_URL || "";
    }
  } catch (e) {}
  base = base.replace(/\/$/, "");
  if (t.startsWith("/") && base) return `${base}${t}`;
  return t;
}

export function pickImage(item) {
  if (!item) return "";
  if (Array.isArray(item.imageUrls) && item.imageUrls[0]) return cmsImageUrl(item.imageUrls[0]);
  return cmsImageUrl(item.image || item.imageUrl || item.src || "");
}

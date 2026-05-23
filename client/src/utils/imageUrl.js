/**
 * Image URL helpers for static assets and CMS-hosted media.
 */

import { rewriteCmsMediaUrl } from './cmsMediaUrls';

/**
 * Returns the WebP version of local static paths only (client/public/images).
 */
export function getOptimizedImageUrl(path) {
  if (!path || typeof path !== 'string') return path;
  const resolved = rewriteCmsMediaUrl(path);
  if (resolved.startsWith('http://') || resolved.startsWith('https://')) return resolved;
  if (resolved.startsWith('/uploads/')) return resolved;
  if (!resolved.startsWith('/images/')) return resolved;
  return resolved.replace(/\.(png|jpe?g)$/i, '.webp');
}

export function cmsImageUrl(url) {
  return rewriteCmsMediaUrl(url);
}

function pushImageUrl(urls, raw) {
  if (raw == null || raw === '') return;
  const resolved =
    typeof raw === 'string'
      ? cmsImageUrl(raw)
      : raw?.url
        ? cmsImageUrl(raw.url)
        : '';
  if (resolved && !urls.includes(resolved)) urls.push(resolved);
}

/** All CMS image URLs for sliders (imageUrls[], images[], image, imageUrl, src). */
export function pickImages(item) {
  if (!item) return [];
  const urls = [];
  if (Array.isArray(item.imageUrls)) {
    item.imageUrls.forEach((u) => pushImageUrl(urls, u));
  }
  if (Array.isArray(item.images)) {
    item.images.forEach((img) => pushImageUrl(urls, img));
  }
  pushImageUrl(urls, item.image);
  pushImageUrl(urls, item.imageUrl);
  pushImageUrl(urls, item.src);
  return urls;
}

export function pickImage(item) {
  const all = pickImages(item);
  if (all.length) return all[0];
  return '';
}

export function cmsImageFallback(path) {
  return cmsImageUrl(path);
}

/** @deprecated use rewriteCmsMediaUrl — kept for status hook compatibility */
export function setCmsAssetBase(_base) {
  /* Images use same-origin /uploads and /images paths; no runtime base needed */
}

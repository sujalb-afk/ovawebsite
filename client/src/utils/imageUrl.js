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

export function pickImage(item) {
  if (!item) return '';
  if (Array.isArray(item.imageUrls) && item.imageUrls[0]) return cmsImageUrl(item.imageUrls[0]);
  if (Array.isArray(item.images) && item.images[0]?.url) return cmsImageUrl(item.images[0].url);
  return cmsImageUrl(item.image || item.imageUrl || item.src || '');
}

export function cmsImageFallback(path) {
  return cmsImageUrl(path);
}

/** @deprecated use rewriteCmsMediaUrl — kept for status hook compatibility */
export function setCmsAssetBase(_base) {
  /* Images use same-origin /uploads and /images paths; no runtime base needed */
}

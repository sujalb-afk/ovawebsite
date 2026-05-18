/**
 * Returns the WebP version of an image path for smaller payloads.
 * Run `npm run optimize-images` to generate .webp files in public.
 * Falls back to original path for non-PNG/JPG (e.g. already .webp or .svg).
 */
export function getOptimizedImageUrl(path) {
  if (!path || typeof path !== 'string') return path;
  return path.replace(/\.(png|jpe?g)$/i, '.webp');
}

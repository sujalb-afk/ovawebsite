import React, { useState, useEffect, useCallback } from 'react';
import { getOptimizedImageUrl, cmsImageUrl, cmsImageFallback } from '../utils/imageUrl';

/**
 * Manual image carousel for CMS items with multiple imageUrls / images.
 * Shows prev/next arrows when there is more than one slide.
 */
function CmsImageSlider({
  images = [],
  alt = '',
  className = '',
  imgClassName = '',
  placeholderClassName = '',
  loading = 'lazy',
}) {
  const slides = (Array.isArray(images) ? images : []).filter(Boolean);
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    setIndex(0);
  }, [slides.join('|')]);

  const go = useCallback(
    (delta) => {
      if (count <= 1) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  if (!count) {
    return (
      <div className={`cms-image-slider cms-image-slider--empty ${className}`.trim()}>
        <div className={`cms-image-slider-placeholder ${placeholderClassName}`.trim()}>
          <i className="bi bi-camera" aria-hidden="true" />
          <span>Image coming soon</span>
        </div>
      </div>
    );
  }

  const current = slides[Math.min(index, count - 1)];

  return (
    <div className={`cms-image-slider ${className}`.trim()}>
      <img
        src={getOptimizedImageUrl(current)}
        alt={alt}
        className={imgClassName}
        loading={loading}
        decoding="async"
        onError={(e) => {
          const fallback = cmsImageFallback(current);
          if (fallback && e.target.src !== fallback) {
            e.target.src = fallback;
            e.target.onerror = null;
          }
        }}
      />
      {count > 1 && (
        <>
          <button
            type="button"
            className="cms-image-slider-btn cms-image-slider-btn--prev"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              go(-1);
            }}
            aria-label="Previous image"
          >
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="cms-image-slider-btn cms-image-slider-btn--next"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              go(1);
            }}
            aria-label="Next image"
          >
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
          <span className="cms-image-slider-counter" aria-live="polite">
            {index + 1} / {count}
          </span>
        </>
      )}
    </div>
  );
}

export default React.memo(CmsImageSlider);

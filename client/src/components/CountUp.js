import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_DURATION = 2000;

/**
 * Animates a number from 0 to `value` when the element enters the viewport.
 * @param {number} value - Target number
 * @param {string} [suffix=''] - e.g. '+'
 * @param {string} [prefix=''] - e.g. '₹'
 * @param {string} [valueSuffix=''] - e.g. 'L' for "₹10L+"
 * @param {number} [duration] - Animation duration in ms
 */
function CountUp({ value, suffix = '', prefix = '', valueSuffix = '', duration = DEFAULT_DURATION }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof value !== 'number') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting || hasAnimated) return;
        setHasAnimated(true);

        const start = performance.now();
        const endValue = value;

        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic for a smooth slowdown at the end
          const eased = 1 - (1 - progress) ** 3;
          const current = Math.round(eased * endValue);
          setCount(current);
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  const display = `${prefix}${count}${valueSuffix}`;
  return (
    <span ref={ref} className="stat-number-inner">
      {display}<sup>{suffix}</sup>
    </span>
  );
}

export default CountUp;

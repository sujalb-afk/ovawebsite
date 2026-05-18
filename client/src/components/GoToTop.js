import React, { useState, useEffect, useCallback } from 'react';

const GoToTop = React.memo(function GoToTop() {
  const [visible, setVisible] = useState(false);

  const onScroll = useCallback(() => {
    setVisible(window.scrollY > 400);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="go-to-top-btn"
      onClick={scrollToTop}
      aria-label="Go to top"
    >
      <i className="bi bi-arrow-up" aria-hidden="true" />
    </button>
  );
});
GoToTop.displayName = 'GoToTop';
export default GoToTop;

import React, { useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import AboutHeroBg from '../components/AboutHeroBg';
import { EVENTS } from './Events';
import { getOptimizedImageUrl } from '../utils/imageUrl';
import { useCmsEvent } from '../hooks/useCms';
import { mapCmsEventToCard } from '../utils/cmsMappers';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { event: cmsEvent, loading } = useCmsEvent(id);
  const staticEv = EVENTS.find((e) => String(e.id) === String(id));
  const ev = useMemo(() => {
    if (cmsEvent) return mapCmsEventToCard(cmsEvent);
    return staticEv || null;
  }, [cmsEvent, staticEv]);

  if (!loading && !ev) {
    navigate('/events', { replace: true });
    return null;
  }

  if (!ev) {
    return null;
  }

  return (
    <div className="events-page-wrap event-detail-page">
      <SEO
        title={`${ev.title} · Events`}
        description={ev.desc[0]}
        canonical={`/events/${ev.id}`}
        keywords={`${ev.tag}, volunteer events, OVA™ events, ${ev.title}`}
      />

      {/* Hero */}
      <section className="about-hero event-detail-hero">
        <AboutHeroBg />
        <div className="about-hero-overlay" aria-hidden="true" />
        <div className="container about-hero-container">
          <div className="about-hero-content">
            <nav className="event-detail-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span className="event-detail-breadcrumb-sep" aria-hidden="true"> &gt; </span>
              <span>{ev.title}</span>
            </nav>
            <h1 className="about-hero-title event-detail-title">{ev.title}</h1>
            <p className="about-hero-subtext event-detail-tagline">
              <span className="ev-detail-tag">
                <i className={`bi ${ev.tagIcon}`} aria-hidden="true" />
                {ev.tag}
              </span>
              {' · volunteer events'}
            </p>
          </div>
        </div>
      </section>

      <section className="ev-detail-section">
        <div className="ev-detail-container">
          <div className="ev-detail-layout">
            {/* Event image */}
            <div className="ev-detail-media">
              {ev.image ? (
                <img src={getOptimizedImageUrl(ev.image)} alt={ev.title} className="ev-detail-img" width={800} height={500} loading="lazy" decoding="async" onError={(e) => { if (e.target.src !== ev.image) { e.target.src = ev.image; e.target.onerror = null; } }} />
              ) : (
                <div className="ev-detail-placeholder" aria-label="Image coming soon">
                  <i className="bi bi-camera" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Event info card */}
            <aside className="ev-detail-info-card">
              <h2 className="ev-detail-info-title">Event info</h2>
              <dl className="ev-detail-info-list">
                <div className="ev-detail-info-row">
                  <dt>Time</dt>
                  <dd>
                    {ev.date}
                    <br />
                    {ev.time}
                  </dd>
                </div>
                <div className="ev-detail-info-row">
                  <dt>Address</dt>
                  <dd>{ev.address}</dd>
                </div>
                <div className="ev-detail-info-row">
                  <dt>Organization</dt>
                  <dd>{ev.organization}</dd>
                </div>
                <div className="ev-detail-info-row">
                  <dt>Contact</dt>
                  <dd>
                    <a href={`mailto:${ev.contact}`} className="ev-detail-contact-link">{ev.contact}</a>
                  </dd>
                </div>
              </dl>
            </aside>
          </div>

          {/* Full content */}
          <div className="ev-detail-body">
            <h2 className="ev-detail-body-title">{ev.title}</h2>
            <div className="ev-detail-desc">
              {ev.desc.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            {ev.highlights && ev.highlights.length > 0 && (
              <ul className="ev-detail-highlights">
                {ev.highlights.map((h, i) => (
                  <li key={i} className="ev-highlight-item">
                    <span className="ev-highlight-icon">
                      <i className={`bi ${h.icon}`} aria-hidden="true" />
                    </span>
                    {h.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* CTAs */}
          <div className="ev-detail-actions">
            <Link to="/join" className="ev-register-btn ev-register-btn--block">
              Join Us
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default EventDetail;

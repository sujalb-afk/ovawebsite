import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import AboutHeroBg from '../components/AboutHeroBg';
import { SERVICES } from './Services';
import { getOptimizedImageUrl, cmsImageUrl } from '../utils/imageUrl';
import { useCmsService } from '../hooks/useCms';
import { mapCmsServiceToCard } from '../utils/cmsMappers';

function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { service: cmsService, loading } = useCmsService(id);
  const staticSvc = SERVICES.find((s) => String(s.id) === String(id));
  const svc = cmsService ? mapCmsServiceToCard(cmsService) : staticSvc;

  if (!loading && !svc) {
    navigate('/services', { replace: true });
    return null;
  }

  if (!svc) {
    return null;
  }

  return (
    <div className="services-page-wrap service-detail-page">
      <SEO
        title={`${svc.title} · Services`}
        description={svc.desc}
        canonical={`/services/${svc.id}`}
        keywords={`${svc.category}, OVA™ services, ${svc.title}`}
      />

      {/* Hero */}
      <section className="about-hero service-detail-hero">
        <AboutHeroBg />
        <div className="about-hero-overlay" aria-hidden="true" />
        <div className="container about-hero-container">
          <div className="about-hero-content">
            <h1 className="about-hero-title service-detail-title">{svc.title}</h1>
            <p className="about-hero-subtext service-detail-tagline">
              <span className="svc-detail-cat">
                <i className={`bi ${svc.icon}`} aria-hidden="true" />
                {svc.category}
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="svc-detail-section">
        <div className="svc-detail-container">
          <div className="svc-detail-layout">
            {/* Service image */}
            <div className="svc-detail-media">
              {svc.image ? (
                <img src={getOptimizedImageUrl(cmsImageUrl(svc.image))} alt={svc.imageAlt || svc.title} className="svc-detail-img" width={800} height={500} loading="lazy" decoding="async" onError={(e) => { if (e.target.src !== cmsImageUrl(svc.image)) { e.target.src = cmsImageUrl(svc.image); e.target.onerror = null; } }} />
              ) : (
                <div className="svc-detail-placeholder" style={{ background: svc.bg }} aria-label="Program visual">
                  <i className={`bi ${svc.icon}`} aria-hidden="true" />
                </div>
              )}
              <span className="svc-detail-num" aria-hidden="true">{svc.number}</span>
            </div>

            {/* Full content */}
            <div className="svc-detail-body">
              <h2 className="svc-detail-body-title">{svc.title}</h2>
              {svc.fullContent && svc.fullContent.length > 0 ? (
                <div className="svc-detail-desc">
                  {svc.fullContent.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="svc-detail-desc">{svc.desc}</p>
              )}
              {svc.points && svc.points.length > 0 && (
                <ul className="svc-detail-points">
                  {svc.points.map((pt, i) => (
                    <li key={i} className="svc-detail-point">
                      <span className="svc-detail-point-icon" style={{ color: svc.color }}>
                        <i className={`bi ${pt.icon}`} aria-hidden="true" />
                      </span>
                      {pt.text}
                    </li>
                  ))}
                </ul>
              )}
              <div className="svc-detail-actions">
                <Link to="/join" className="svc-pg-btn">
                  Join us
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ServiceDetail;

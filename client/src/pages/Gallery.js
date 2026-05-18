import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import AboutHeroBg from '../components/AboutHeroBg';
import { getOptimizedImageUrl } from '../utils/imageUrl';
import { GALLERY_ITEMS, getUniqueGalleryItems } from '../data/galleryItems';

const MAX_HOVER_LENGTH = 180;

function truncate(str, max = MAX_HOVER_LENGTH) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max).trim() + '…';
}

const PLACEHOLDER = 'https://via.placeholder.com/600x400/2d6a4f/ffffff?text=OVA™+Gallery';

function Gallery() {
  const uniqueGalleryImages = useMemo(() => getUniqueGalleryItems(GALLERY_ITEMS), []);

  return (
    <div className="gallery-page-wrap">
      <SEO
        title="Gallery · Stories of Impact"
        description="OVA™ Gallery - Inspiring stories and images from our volunteer programs, community initiatives, and sustainability events."
        canonical="/gallery"
        keywords="OVA™ gallery, NGO photos, volunteer India"
      />

      {/* Hero – same as About Us, Team, Services, Events */}
      <section className="about-hero">
        <AboutHeroBg />
        <div className="about-hero-overlay" aria-hidden="true" />
        <div className="container about-hero-container">
          <div className="about-hero-content">
            <h1 className="about-hero-title">Gallery</h1>
            <p className="about-hero-subtext">
              OVA™ Gallery | Inspiring stories and images from our programs and events.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery grid */}
      <section className="gallery-section">
        <div className="gallery-container">
          <div className="gallery-grid">
            {uniqueGalleryImages.map((item) => (
              <figure key={item.src} className="gallery-card">
                <div className="gallery-card-inner">
                  <img
                    src={getOptimizedImageUrl(item.src)}
                    alt={item.alt}
                    className="gallery-card-img"
                    width={400}
                    height={300}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.target.src = item.src;
                      e.target.onerror = () => { e.target.src = PLACEHOLDER; e.target.onerror = null; };
                    }}
                  />
                  <div className="gallery-card-overlay">
                    <div className="gallery-card-overlay-content">
                      <span className="gallery-card-caption">{item.title}</span>
                      {item.summary ? (
                        <p className="gallery-card-hover-text">{truncate(item.summary)}</p>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    to={`/gallery/${item.slug}`}
                    className="gallery-card-link"
                    aria-label={`Open ${item.title}`}
                  />
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Gallery;

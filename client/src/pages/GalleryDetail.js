import React from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import AboutHeroBg from '../components/AboutHeroBg';
import { getOptimizedImageUrl } from '../utils/imageUrl';
import { GALLERY_ITEMS, getUniqueGalleryItems } from '../data/galleryItems';

const PLACEHOLDER = 'https://via.placeholder.com/900x675/2d6a4f/ffffff?text=OVA™+Gallery';

function GalleryDetail() {
  const { slug } = useParams();
  const publishedItems = getUniqueGalleryItems(GALLERY_ITEMS);
  const uniqueItem = publishedItems.find((entry) => entry.slug === slug);
  const sourceItem = uniqueItem || GALLERY_ITEMS.find((entry) => entry.slug === slug);
  const item = uniqueItem || (sourceItem ? publishedItems.find((entry) => entry.src === sourceItem.src) : null);
  const currentIndex = publishedItems.findIndex((entry) => entry.slug === item?.slug);
  const hasItems = publishedItems.length > 0 && currentIndex >= 0;
  const prevItem = hasItems
    ? publishedItems[(currentIndex + 1) % publishedItems.length]
    : null;
  const nextItem = hasItems
    ? publishedItems[(currentIndex - 1 + publishedItems.length) % publishedItems.length]
    : null;

  if (!item) {
    return (
      <div className="gallery-detail-page-wrap">
        <SEO
          title="Gallery item not found"
          description="The gallery item you are looking for could not be found."
          canonical="/gallery"
          keywords="OVA gallery"
        />
        <section className="about-hero">
          <AboutHeroBg />
          <div className="about-hero-overlay" aria-hidden="true" />
          <div className="container about-hero-container">
            <div className="about-hero-content">
              <h1 className="about-hero-title">Gallery</h1>
              <p className="about-hero-subtext">Image not found</p>
            </div>
          </div>
        </section>
        <section className="gallery-detail-section">
          <div className="gallery-detail-container">
            <p className="gallery-detail-not-found">The requested gallery item was not found.</p>
            <Link to="/gallery" className="gallery-detail-back">Back to Gallery</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="gallery-detail-page-wrap">
      <SEO
        title={`${item.title} · Gallery`}
        description={item.description}
        canonical={`/gallery/${item.slug}`}
        keywords="OVA gallery, community impact photos"
      />

      <section className="about-hero">
        <AboutHeroBg />
        <div className="about-hero-overlay" aria-hidden="true" />
        <div className="container about-hero-container">
          <div className="about-hero-content">
            <h1 className="about-hero-title">Gallery Details</h1>
            <p className="about-hero-subtext">{item.title}</p>
          </div>
        </div>
      </section>

      <section className="gallery-detail-section">
        <div className="gallery-detail-container">
          <div className="gallery-detail-top-actions">
            <Link to="/gallery" className="gallery-detail-back">← Back to Gallery</Link>
          </div>
          <div className="gallery-detail-layout">
            <div className="gallery-detail-image-wrap">
              <img
                src={getOptimizedImageUrl(item.src)}
                alt={item.alt}
                className="gallery-detail-image"
                width={900}
                height={675}
                decoding="async"
                onError={(e) => {
                  e.target.src = item.src;
                  e.target.onerror = () => { e.target.src = PLACEHOLDER; e.target.onerror = null; };
                }}
              />
            </div>
            <div className="gallery-detail-content">
              <h2 className="gallery-detail-title">{item.title}</h2>
              <p className="gallery-detail-date">{item.displayDate}</p>
              {item.location ? <p className="gallery-detail-meta">Location: {item.location}</p> : null}
              {item.category ? <p className="gallery-detail-meta">Category: {item.category}</p> : null}
              <p className="gallery-detail-description">{item.description}</p>
              {Array.isArray(item.tags) && item.tags.length > 0 ? (
                <div className="gallery-detail-tags">
                  {item.tags.map((tag) => (
                    <span key={tag} className="gallery-detail-tag">#{tag}</span>
                  ))}
                </div>
              ) : null}
              <div className="gallery-detail-nav">
                <Link to={`/gallery/${prevItem.slug}`} className="gallery-detail-nav-link">
                  ← Previous
                </Link>
                <Link to={`/gallery/${nextItem.slug}`} className="gallery-detail-nav-link">
                  Next →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default GalleryDetail;


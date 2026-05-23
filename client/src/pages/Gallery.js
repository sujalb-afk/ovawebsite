import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import AboutHeroBg from '../components/AboutHeroBg';
import { pickImage, pickImages } from '../utils/imageUrl';
import { GALLERY_ITEMS, getUniqueGalleryItems } from '../data/galleryItems';
import { useCmsPage, useCmsGallery } from '../hooks/useCms';
import { stripHtml } from '../utils/cmsHtml';
import CmsImageSlider from '../components/CmsImageSlider';


const MAX_HOVER_LENGTH = 180;

function truncate(str, max = MAX_HOVER_LENGTH) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max).trim() + '…';
}

function Gallery() {
  const { data: cmsData, seo: cmsSeo, fromCms } = useCmsPage('gallery');
  const { gallery: cmsGallery, fromCms: galleryFromCms } = useCmsGallery();

  const uniqueGalleryImages = useMemo(() => {
    if (galleryFromCms && Array.isArray(cmsGallery) && cmsGallery.length > 0) {
      return cmsGallery.map((g) => ({
        src: pickImage(g) || g.imageUrl || g.image,
        images: pickImages(g),
        alt: g.title || 'Gallery image',
        title: g.title,
        summary: g.subtitle || g.category,
        slug: g.slug || g._id || g.id,
      }));
    }
    return getUniqueGalleryItems(GALLERY_ITEMS);
  }, [cmsGallery, galleryFromCms]);

  return (
    <div className="gallery-page-wrap">
      <SEO
        title={cmsSeo?.title || "Gallery · Stories of Impact"}
        description={cmsSeo?.description || "OVA™ Gallery - Inspiring stories and images from our volunteer programs, community initiatives, and sustainability events."}
        canonical="/gallery"
        keywords="OVA™ gallery, NGO photos, volunteer India"
      />

      {/* Hero – same as About Us, Team, Services, Events */}
      <section className="about-hero">
        <AboutHeroBg />
        <div className="about-hero-overlay" aria-hidden="true" />
        <div className="container about-hero-container">
          <div className="about-hero-content">
            <h1 className="about-hero-title">{fromCms && cmsData?.heroHeading ? cmsData.heroHeading : 'Gallery'}</h1>
            <p className="about-hero-subtext">
              {fromCms && cmsData?.heroSubtext ? stripHtml(cmsData.heroSubtext) : 'OVA™ Gallery | Inspiring stories and images from our programs and events.'}
            </p>
          </div>
        </div>
      </section>

      {/* Gallery grid */}
      <section className="gallery-section">
        <div className="gallery-container">
          <div className="gallery-grid">
            {uniqueGalleryImages.map((item) => (
              <figure key={item.slug || item.src} className="gallery-card">
                <div className="gallery-card-inner">
                  <Link
                    to={`/gallery/${item.slug}`}
                    className="gallery-card-link"
                    aria-label={`Open ${item.title}`}
                  />
                  <CmsImageSlider
                    images={item.images?.length ? item.images : item.src ? [item.src] : []}
                    alt={item.alt}
                    className="cms-image-slider--gallery-card"
                    imgClassName="gallery-card-img"
                    loading="lazy"
                  />
                  <div className="gallery-card-overlay">
                    <div className="gallery-card-overlay-content">
                      <span className="gallery-card-caption">{item.title}</span>
                      {item.summary ? (
                        <p className="gallery-card-hover-text">{truncate(item.summary)}</p>
                      ) : null}
                    </div>
                  </div>
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

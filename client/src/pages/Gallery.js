import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import AboutHeroBg from '../components/AboutHeroBg';
import { pickImage, pickImages } from '../utils/imageUrl';
import { GALLERY_ITEMS, getUniqueGalleryItems } from '../data/galleryItems';
import { useCmsPage, useCmsGallery } from '../hooks/useCms';
import { stripHtml } from '../utils/cmsHtml';
import CmsImageSlider from '../components/CmsImageSlider';


function formatGalleryDate(item) {
  if (item?.displayDate) return item.displayDate;
  if (item?.publishedAt) {
    const d = new Date(item.publishedAt);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  return '';
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
        title: g.title || '',
        category: g.category || g.subtitle || '',
        displayDate: g.displayDate || '',
        publishedAt: g.publishedAt || g.date || '',
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
            {uniqueGalleryImages.map((item) => {
              const eventDate = formatGalleryDate(item);
              return (
                <article key={item.slug || item.src} className="gallery-card">
                  <Link
                    to={`/gallery/${item.slug}`}
                    className="gallery-card-hit"
                    aria-label={`Open ${item.title}`}
                  >
                    <div className="gallery-card-inner">
                      <CmsImageSlider
                        images={item.images?.length ? item.images : item.src ? [item.src] : []}
                        alt={item.alt}
                        className="cms-image-slider--gallery-card"
                        imgClassName="gallery-card-img"
                        loading="lazy"
                        counterPosition="between"
                      />
                    </div>
                    <div className="gallery-card-meta">
                      {item.category ? (
                        <p className="gallery-card-category" title={item.category}>
                          {item.category}
                        </p>
                      ) : null}
                      {item.title ? (
                        <h3 className="gallery-card-title" title={item.title}>
                          {item.title}
                        </h3>
                      ) : null}
                      {eventDate ? (
                        <time className="gallery-card-date" dateTime={item.publishedAt || undefined}>
                          {eventDate}
                        </time>
                      ) : null}
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Gallery;

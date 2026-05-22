import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { getOptimizedImageUrl, cmsImageUrl } from '../utils/imageUrl';
import { useCmsPage } from '../hooks/useCms';
import { mapCmsHeroSlides, mapCmsPrograms } from '../utils/cmsMappers';

const HERO_SLIDES = [
  {
    image: '/images/hero/herobg3.webp',
    eyebrow: 'Community · Rural · Education Support',
    headlineParts: ['Every Child Deserves ', { em: 'a Chance' }],
    subtext: 'Notebooks, food, clothing, and education support for rural students. We connect communities with welfare schemes and healthcare so no one is left behind.',
    tags: null,
    btns: [
      { label: 'Donate to Support', to: '/donate', primary: true, arrow: true },
      { label: 'See Our Impact', to: '/about', primary: false },
    ],
  },
  {
    image: '/images/hero/herobg1.webp',
    eyebrow: 'Volunteer India · OVA™',
    headlineParts: ['Green Today, ', { em: 'Better Tomorrow' }],
    subtext: 'Tree planting, waste awareness, and climate education in schools and villages. Small steps that add up to a more sustainable India.',
    tags: null,
    btns: [
      { label: 'Our Programs', to: '/services', primary: true, arrow: true },
      { label: 'Donate', to: '/donate', primary: false },
    ],
  },
  {
    image: '/images/hero-skills.webp',
    eyebrow: 'Career · Internships · Education',
    headlineParts: ['Skills That ', { em: 'Open Doors' }, ' for Everyone'],
    subtext: 'Job readiness, internships, and career coaching for students and women. We help people enter and thrive in the workforce, no matter where they start.',
    tags: null,
    btns: [
      { label: 'Explore Our Programs', to: '/services', primary: true, arrow: true },
      { label: 'Sponsor a Student', to: '/donate', primary: false },
    ],
  },
  {
    image: '/images/hero/herobg4.webp',
    eyebrow: 'Technology · AI · Digital Literacy',
    headlineParts: ['Ethical AI & ', { em: 'Digital Literacy' }],
    subtext: 'AI awareness, digital safety, and responsible tech use. We train people in rural and underserved areas so they can take part in the digital economy with confidence.',
    tags: null,
    btns: [
      { label: 'Our Programs', to: '/services', primary: true, arrow: true },
      { label: 'Join Us', to: '/join', primary: false },
    ],
  },
];

const renderHeadline = (parts) =>
  parts.map((part, i) =>
    typeof part === 'string' ? (
      part
    ) : (
      <em key={i} className="hero-title-highlight">
        {part.em}
      </em>
    )
  );

const SLIDE_INTERVAL = 7000;   // ms between auto-advances
const USER_PAUSE_DELAY = 6000; // ms to wait after dot click before resuming

function Home() {
  const { data: cmsData, seo: cmsSeo } = useCmsPage('home');
  const [heroSlide, setHeroSlide]   = useState(0);
  const [isPaused,  setIsPaused]    = useState(false);
  const intervalRef    = useRef(null);
  const pauseResumeRef = useRef(null);

  const heroSlides = useMemo(() => {
    if (cmsData?.hero?.slides?.length) {
      return mapCmsHeroSlides(cmsData.hero.slides, HERO_SLIDES);
    }
    return HERO_SLIDES;
  }, [cmsData]);
  const programs = useMemo(() => {
    const fallback = [
      { title: 'Job Readiness & Internship Program', icon: 'bi-briefcase', to: '/services/1' },
      { title: 'Community Outreach & Education Support', icon: 'bi-people', to: '/services/2' },
      { title: 'Climate & Sustainability Education', icon: 'bi-tree', to: '/services/3' },
      { title: 'Ethical AI & Digital Literacy', icon: 'bi-cpu', to: '/services/4' },
    ];
    if (cmsData?.programs?.length) {
      return mapCmsPrograms(cmsData.programs, fallback);
    }
    return fallback;
  }, [cmsData]);

  const staticCopy = {
    programsEyebrow: 'What We Do',
    programsHeading: 'Our Programs',
    programsSubtitle: 'Sustainability, job readiness, community support, and digital literacy',
    aboutHeading: 'Communities First, Change That Lasts',
    aboutBody: 'OVA™ is an NGO that uses technology to support volunteers and local projects. We help people connect, run programmes, and measure impact so that more work gets done where it matters.',
    servicesHeading: 'Supporting Communities',
    involvedLabel: 'Get Involved',
    involvedHeading: 'Get involved: Join, Donate, or Support',
    involvedBody: 'Your time or donation goes directly to communities. We channel both into programmes that create real change.',
    eventsHeading: 'Upcoming Events',
    eventsSubtitle: 'Join clean-ups, workshops, health camps, and community events across Kolhapur and other locations. All events are open to volunteers, participants, and partners. Check the calendar below for dates, venues, and how to register.',
    eventsBody: 'We run clean-ups and tree-planting drives, digital and AI literacy workshops, community wellness and health camps, and cultural exchange and language connect programmes. Each event is designed to create real impact: whether you join for a day or take part in a longer programme, your time and effort go directly to communities we serve.',
    eventsCtaLabel: 'View All Events',
  };
  const copy = useMemo(() => {
    if (!cmsData) return staticCopy;
    return {
      programsEyebrow: staticCopy.programsEyebrow,
      programsHeading: cmsData.programsHeading ?? staticCopy.programsHeading,
      programsSubtitle: cmsData.programsSubtitle ?? staticCopy.programsSubtitle,
      aboutHeading: cmsData.aboutHeading ?? staticCopy.aboutHeading,
      aboutBody: cmsData.aboutBody ?? staticCopy.aboutBody,
      servicesHeading: cmsData.servicesHeading ?? staticCopy.servicesHeading,
      involvedLabel: cmsData.involvedLabel ?? staticCopy.involvedLabel,
      involvedHeading: cmsData.involvedHeading ?? staticCopy.involvedHeading,
      involvedBody: cmsData.involvedBody ?? staticCopy.involvedBody,
      eventsHeading: cmsData.eventsHeading ?? staticCopy.eventsHeading,
      eventsSubtitle: cmsData.eventsSubtitle ?? staticCopy.eventsSubtitle,
      eventsBody: cmsData.eventsBody ?? staticCopy.eventsBody,
      eventsCtaLabel: cmsData.eventsCtaLabel ?? staticCopy.eventsCtaLabel,
    };
  }, [cmsData]);

  const startAutoPlay = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, SLIDE_INTERVAL);
  }, [heroSlides.length]);

  // Start on mount
  useEffect(() => {
    startAutoPlay();
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(pauseResumeRef.current);
    };
  }, [startAutoPlay]);

  // Dot click - jump to slide, pause, then resume after delay
  const goToSlide = useCallback((index) => {
    setHeroSlide(index);
    setIsPaused(true);
    clearInterval(intervalRef.current);
    clearTimeout(pauseResumeRef.current);
    pauseResumeRef.current = setTimeout(() => {
      setIsPaused(false);
      startAutoPlay();
    }, USER_PAUSE_DELAY);
  }, [startAutoPlay, heroSlides.length]);

  return (
    <div className="home-page-wrap">
      <div className="home-page-bg-layer" aria-hidden="true">
        <img src={getOptimizedImageUrl(cmsImageUrl('/images/homepage-bg.webp'))} alt="" width={1920} height={1080} loading="lazy" decoding="async" className="home-page-bg-img" onError={(e) => { if (e.target.src !== cmsImageUrl('/images/homepage-bg.webp')) { e.target.src = cmsImageUrl('/images/homepage-bg.webp'); e.target.onerror = null; } }} />
      </div>
      <SEO 
        title={cmsSeo?.title || 'Volunteer India · OVA™ NGO'}
        description={cmsSeo?.description || 'OVA™ runs programmes on sustainability, job readiness, community support, and digital literacy in India. Volunteer or donate. Based in Kolhapur.'}
        canonical="/"
        keywords="volunteer india, OVA NGO, Kolhapur, sustainability, job readiness, donate, volunteer opportunities, rural education"
      />
      {/* Hero Section - first slide as <img> for LCP priority; others as background */}
      <section className="hero-section hero-redesign">
        <div className="hero-redesign-bg">
          {heroSlides.map((slide, index) => {
            const isActive = index === heroSlide;
            const isFirstSlide = index === 0;
            const imageUrl = getOptimizedImageUrl(cmsImageUrl(slide.image));
            return (
              <div
                key={slide.image}
                className={`hero-redesign-slide ${isActive ? 'active' : ''}`}
                style={!isFirstSlide ? { backgroundImage: `url(${imageUrl})` } : undefined}
                aria-hidden={!isActive}
              >
                {isFirstSlide && (
                  <img
                    src={imageUrl}
                    alt="hero background"
                    className="hero-redesign-slide-img"
                    width={1920}
                    height={1080}
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="hero-redesign-overlay" aria-hidden="true" />
        <div className="hero-redesign-accent" aria-hidden="true" />
        <div className="container hero-redesign-container">
          {(() => {
            const slide = heroSlides[heroSlide];
            return (
              <div
                key={heroSlide}
                className={`hero-redesign-content${slide.tags ? ' hero-content-has-tags' : ''}`}
              >
                <p className="hero-redesign-eyebrow">
                  {slide.eyebrow}
                </p>
                <h1 className="hero-redesign-title">{renderHeadline(slide.headlineParts)}</h1>
                <p className="hero-redesign-subtext">{slide.subtext}</p>
                {slide.tags && (
                  <div className="hero-slide-tags">
                    {slide.tags.map((tag) => (
                      <span key={tag} className="hero-slide-tag">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="hero-redesign-btns">
                  {slide.btns.map((btn) => (
                    <Link
                      key={btn.label}
                      to={btn.to}
                      className={`btn ${btn.primary ? 'hero-btn-donate' : 'hero-btn-volunteer'}`}
                    >
                      {btn.label}
                      {btn.arrow && <i className="bi bi-arrow-right ms-2" aria-hidden="true" />}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
        <div className="hero-redesign-dots" aria-label="Hero image slides">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`hero-dot${index === heroSlide ? ' active' : ''}${index === heroSlide && isPaused ? ' paused' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === heroSlide ? 'true' : undefined}
            />
          ))}
        </div>
        <div className="hero-redesign-scroll">
          <span className="hero-scroll-text">Scroll</span>
          <span className="hero-scroll-line" aria-hidden="true" />
        </div>
      </section>

      {/* Programs / Causes */}
      <section className="programs-section" id="programs">
        <div className="programs-container">
          <header className="programs-header">
            <div className="programs-eyebrow">
              <span className="programs-eyebrow-line" aria-hidden="true" />
              {copy.programsEyebrow}
              <span className="programs-eyebrow-line" aria-hidden="true" />
            </div>
            <h2 className="programs-title">{copy.programsHeading}</h2>
            <p className="programs-subtitle">{copy.programsSubtitle}</p>
          </header>
          <div className="programs-grid">
            {programs.map((program, idx) => (
              <Link
                key={idx}
                to={program.to}
                className="program-card"
                style={{ animationDelay: `${0.05 + idx * 0.1}s` }}
              >
                <div className="program-card-top-bar" aria-hidden="true" />
                <div className="program-card-icon-wrap">
                  <i className={`bi ${program.icon} program-card-icon`} aria-hidden="true" />
                </div>
                <h3 className="program-card-title">{program.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="home-section home-section-alt">
        <div className="container home-container home-container-narrow">
          <header className="home-section-header text-center">
            <h2 className="section-title home-section-title">{copy.aboutHeading}</h2>
            <p className="section-subtitle home-section-sub text-center">
              <Link to="/about" className="btn btn-ova home-btn">More about us</Link>
            </p>
          </header>
          <div className="row justify-content-center">
            <div className="col-12 text-center">
              <p className="lead home-about-lead">{copy.aboutBody}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section – editorial asymmetric grid */}
      <section id="services" className="home-section services-section">
        <div className="services-container">
          <header className="services-header services-header--centered">
            <div className="services-header-inner">
              <h2 className="services-title">{copy.servicesHeading}</h2>
            </div>
          </header>
          <div className="services-rule" aria-hidden="true" />

          {/* CTA banner – full width horizontal */}
          <div className="svc-cta-banner">
            <div className="svc-cta-banner-left">
              <div className="svc-cta-banner-icon">
                <i className="bi bi-heart-fill" aria-hidden="true" />
              </div>
              <div>
                <div className="svc-cta-card-label">{copy.involvedLabel}</div>
                <h3 className="svc-cta-card-title">{copy.involvedHeading}</h3>
                <p className="svc-cta-card-desc">{copy.involvedBody}</p>
              </div>
            </div>
            <div className="svc-cta-card-btns">
              <Link to="/donate" className="svc-cta-card-btn-primary">Donate Now</Link>
              <Link to="/join" className="svc-cta-card-btn-outline">Join us</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Events – short teaser + View All Events */}
      <section id="events" className="home-section home-events-teaser">
        <div className="container home-container home-container-narrow">
          <header className="home-section-header text-center">
            <h2 className="section-title home-section-title">{copy.eventsHeading}</h2>
            <p className="section-subtitle home-section-sub text-center">{copy.eventsSubtitle}</p>
            <p className="home-events-body">{copy.eventsBody}</p>
            <div className="home-events-btn-wrap">
              <Link to="/events" className="btn btn-ova home-btn">{copy.eventsCtaLabel}</Link>
            </div>
          </header>
        </div>
      </section>

    </div>
  );
}

export default React.memo(Home);

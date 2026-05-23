import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import OvaBrand from '../components/OvaBrand';
import AboutHeroBg from '../components/AboutHeroBg';
import { useCmsPage } from '../hooks/useCms';
import { mapCmsMvvCards, mapCmsWhyFeatures } from '../utils/cmsMappers';
import { stripHtml, CmsHtml } from '../utils/cmsHtml';

const MVV = [
  {
    icon: 'bi-bullseye',
    title: 'Our Mission',
    body: 'We support communities with technology and partnerships. We work on social change, environmental issues, and volunteerism so more people can enjoy a better quality of life.',
  },
  {
    icon: 'bi-globe-americas',
    title: 'Our Vision',
    body: 'A global community where people work together for sustainable development, fairness, and care for the environment. Every contribution counts.',
  },
  {
    icon: 'bi-stars',
    title: 'Our Values',
    body: 'OVA™ stands for innovation, teamwork, sustainability, inclusion, and recognition. We use technology so everyone can take part and we celebrate volunteers who make a difference.',
  },
];

const WHY = [
  { icon: 'bi-person-check', title: 'Expert Guidance', desc: 'Our team supports volunteers so their time and effort go further.' },
  { icon: 'bi-heart', title: 'Positive Environment', desc: 'We keep a supportive space so volunteers can do their best and feel appreciated.' },
  { icon: 'bi-globe-americas', title: 'Global Reach', desc: 'We link volunteers and organisations across the world to tackle social issues.' },
  { icon: 'bi-people', title: 'Collaborative Partnerships', desc: 'We work with others to take on social challenges and create real change.' },
  { icon: 'bi-trophy', title: 'Proven Track Record', desc: 'Our programmes and partners have a strong record. We are a trusted name in volunteerism.' },
  { icon: 'bi-lightning-charge', title: 'Youth Engagement', desc: 'We involve young people in volunteering so service becomes a lasting habit.' },
];

function About() {
  const { data: cmsData, seo: cmsSeo } = useCmsPage('about');
  const mvv = useMemo(() => {
    if (cmsData?.mvvCards?.length) return mapCmsMvvCards(cmsData.mvvCards, MVV);
    return MVV;
  }, [cmsData]);
  const why = useMemo(() => {
    if (cmsData?.whyFeatures?.length) return mapCmsWhyFeatures(cmsData.whyFeatures, WHY);
    return WHY;
  }, [cmsData]);
  const heroQuote = cmsData?.heroQuote
    ? stripHtml(cmsData.heroQuote)
    : 'We use technology to grow volunteerism, one community at a time.';
  const heroCtaLabel = cmsData?.heroCtaLabel || null;

  useEffect(() => {
    const reveals = document.querySelectorAll('.about-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('about-reveal-visible'), i * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-page-wrap">
      <SEO
        title={cmsSeo?.title || 'About OVA™ · Mission, Vision & Values'}
        description={cmsSeo?.description || 'OVA™ is an NGO that uses technology to support volunteerism in India. Read our mission, vision, and values. Kolhapur-based.'}
        canonical="/about"
        keywords="OVA about, NGO mission, volunteer India, Kolhapur, community, tech NGO"
      />

      {/* ── Hero – same style as Donate: green bg, white text, quote, CTA ── */}
      <section className="about-hero donate-hero-style">
        <AboutHeroBg className="donate-hero-bg" />
        <div className="about-hero-overlay donate-hero-overlay" aria-hidden="true" />
        <div className="container about-hero-container">
          <div className="about-hero-content donate-hero-content">
            <h1 className="about-hero-title">
              {cmsData?.heroHeading ? cmsData.heroHeading : <>About <em>Us</em></>}
            </h1>
            <blockquote className="donate-hero-quote">
              {heroQuote}
              <cite>, {heroCtaLabel ? heroCtaLabel : <OvaBrand />}</cite>
            </blockquote>
            <Link to="/services" className="donate-hero-cta">
              {cmsData?.heroButtonLabel || 'Our Programmes'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── About Intro ── */}
      <section className="about-intro-section">
        <div className="about-intro-inner">
          <span className="about-intro-label">{cmsData?.introLabel ? cmsData.introLabel : 'Who We Are'}</span>
          <h2 className="about-intro-title">
            {cmsData?.introHeading ? (
              cmsData.introHeading
            ) : (
              <>Advancing <em>Volunteerism</em><br />Through Technology</>
            )}
          </h2>
          <div className="about-intro-divider" aria-hidden="true" />
          <div className="about-intro-body">
            {cmsData?.introBody ? (
              <CmsHtml html={cmsData.introBody} />
            ) : (
              <p>
                OVA™ is an NGO that uses technology to support volunteerism. We give communities and volunteers tools to connect, communicate, and track the impact of their work. We run a platform where people and organisations work together on issues that matter: from the environment to fairness in society. We want every contribution to count and every volunteer to have what they need to create real change. We focus on a global community built on sustainable development and care for the environment. OVA™ is committed to inclusion and to recognising those who make a difference. We value the work of individuals and organisations building a fairer future.
              </p>
            )}
          </div>
          <Link to="/donate" className="about-donate-btn">Donate Now</Link>
        </div>
      </section>

      {/* ── Mission / Vision / Values ── */}
      <section className="about-mvv-section">
        <div className="about-mvv-grid">
          {mvv.map((item) => (
            <div key={item.title} className="about-mvv-card about-reveal">
              <div className="about-mvv-icon" aria-hidden="true">
                <i className={`bi ${item.icon}`} />
              </div>
              <h3 className="about-mvv-title">{item.title}</h3>
              <p className="about-mvv-body">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why OVA™ ── */}
      <section className="about-why-section">
        <div className="about-why-header about-reveal">
          <h2>{cmsData?.whyHeading ? cmsData.whyHeading : 'Why work with OVA™'}</h2>
          <p>{cmsData?.whyBody ? cmsData.whyBody : 'When you partner with OVA™, you work with an NGO that uses technology for real impact. We help volunteers and communities communicate and engage better, and we promote sustainability and inclusion so that social change can happen.'}</p>
        </div>
        <div className="about-why-grid">
          {why.map((item, idx) => (
            <div key={item.title} className="about-feature-card about-reveal">
              <span className="about-feature-num">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="about-feature-icon" aria-hidden="true">
                <i className={`bi ${item.icon}`} />
              </div>
              <h4 className="about-feature-title">{item.title}</h4>
              <p className="about-feature-body">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default About;

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import AboutHeroBg from '../components/AboutHeroBg';
import { getOptimizedImageUrl, cmsImageUrl } from '../utils/imageUrl';
import { useCmsPage, useCmsServices } from '../hooks/useCms';
import { mapCmsServiceCards } from '../utils/cmsMappers';
import { stripHtml } from '../utils/cmsHtml';

const GREEN_BG = 'linear-gradient(135deg, #1a3d2b 0%, #2d6a4f 60%, #40916c 100%)';
const GREEN_COLOR = '#2d6a4f';

export const SERVICES = [
  {
    id: 1,
    slug: 'job-readiness-internship',
    number: '01',
    icon: 'bi-briefcase',
    category: 'Career',
    color: GREEN_COLOR,
    bg: GREEN_BG,
    title: 'Job Readiness & Internship Program',
    desc: 'We help students, women, and others gain the skills, confidence, and experience they need to get and keep jobs. With internships and career coaching, we support everyone, no matter where they start.',
    image: '/images/services/job-readiness-program.webp',
    imageAlt: 'Team collaboration: professionals reviewing documents and laptop in an office',
    points: [
      { icon: 'bi-file-earmark-person', text: 'Resume building & interview coaching' },
      { icon: 'bi-person-check',        text: 'Mentorship from industry professionals' },
      { icon: 'bi-tools',               text: 'Vocational & digital skill training' },
      { icon: 'bi-award',               text: 'Internship placements & certification support' },
    ],
    fullContent: [
      'We help students, women, and others gain the skills, confidence, and experience they need to get and keep jobs. With internships and career coaching, we support everyone, no matter where they start.',
      'The programme includes resume building and interview coaching so participants can present themselves well to employers. We offer vocational and digital skill training suited to local job markets and connect learners with industry mentors.',
      'Eligible participants get help with internship placements and certifications so they can build a strong base for long-term work. Whether you are a student, returning to work, or looking to upskill, OVA™ is here to support you.',
    ],
  },
  {
    id: 2,
    slug: 'community-outreach-education',
    number: '02',
    icon: 'bi-people',
    category: 'Community',
    color: GREEN_COLOR,
    bg: GREEN_BG,
    title: 'Community Outreach & Education Support',
    desc: 'OVA™ connects rural and underserved communities with what they need: notebooks, food, and clothing for students, plus healthcare camps and links to government welfare schemes. We believe everyone deserves dignity, opportunity, and a chance at a better life.',
    image: '/images/services/community-outreach-education.webp',
    imageAlt: 'Rural classroom: teacher with children seated on mats in a community learning space',
    points: [
      { icon: 'bi-journal-bookmark', text: 'Notebooks, food & clothing for rural students' },
      { icon: 'bi-hospital',         text: 'Healthcare camp coordination & awareness' },
      { icon: 'bi-house-heart',      text: 'Community welfare & outreach drives' },
      { icon: 'bi-bank',             text: 'Linkage to government welfare schemes' },
    ],
    fullContent: [
      'OVA™ connects underserved and rural communities with essential educational resources and social support. We believe every individual deserves dignity, opportunity, and access to a better life.',
      'Our outreach includes providing notebooks, food, and clothing for rural students so that basic needs do not stand in the way of learning. We coordinate healthcare camps and awareness sessions, and run community welfare and outreach drives in partnership with local organisations.',
      'We also help families and communities connect with government welfare schemes, ensuring that eligible beneficiaries can access entitlements. From education support to health and welfare linkage, our Community Outreach & Education Support programme aims for real change on the ground.',
    ],
  },
  {
    id: 3,
    slug: 'climate-sustainability-education',
    number: '03',
    icon: 'bi-tree',
    category: 'Climate',
    color: GREEN_COLOR,
    bg: GREEN_BG,
    title: 'Climate & Sustainability Education',
    desc: 'OVA™ runs community-led work on the environment and sustainable living. We do tree-planting, waste management workshops, and climate education in rural schools so communities can protect nature and build a greener future.',
    image: '/images/services/sustainability-tree-planting.webp',
    imageAlt: 'Community tree planting: hands together around a sapling',
    points: [
      { icon: 'bi-tree-fill',    text: 'Tree plantation & green awareness campaigns' },
      { icon: 'bi-recycle',      text: 'Waste management & recycling workshops' },
      { icon: 'bi-cloud-sun',    text: 'Climate education sessions in rural schools' },
      { icon: 'bi-people-fill',  text: 'Community partnerships with eco-organisations' },
    ],
    fullContent: [
      'OVA™ runs community-led work on the environment and sustainable living. We help communities protect nature and build a greener future.',
      'Our programmes include tree-planting and green awareness campaigns, waste management and recycling workshops, and climate education in rural schools. We work with local communities and eco-partners to widen our impact.',
      'Through hands-on activities and education, we help people and families adopt sustainable habits, from cutting plastic use to understanding climate change. Every tree planted and every workshop are a step towards a more sustainable India.',
    ],
  },
  {
    id: 4,
    slug: 'ethical-ai-digital-literacy',
    number: '04',
    icon: 'bi-cpu',
    category: 'Technology',
    color: GREEN_COLOR,
    bg: GREEN_BG,
    title: 'Ethical AI & Digital Literacy',
    desc: 'AI awareness and responsible technology use matter everywhere. OVA™ gives hands-on training on AI tools, digital safety, and ethical tech use, especially in rural and underserved areas, so people can take part in the digital economy with confidence.',
    image: '/images/ethical-ai-classroom.webp',
    imageAlt: 'Ethical AI and digital literacy classroom session',
    points: [
      { icon: 'bi-robot',            text: 'AI awareness & responsible use training' },
      { icon: 'bi-shield-lock',      text: 'Cybersecurity & safe online practices' },
      { icon: 'bi-credit-card',      text: 'Digital financial literacy & UPI training' },
      { icon: 'bi-file-spreadsheet', text: 'Productivity tools: spreadsheets & documents' },
    ],
    fullContent: [
      'AI awareness and responsible technology use matter everywhere. OVA™ gives hands-on training on AI tools, digital safety, and ethical tech use, especially in rural and underserved areas.',
      'The programme covers AI awareness and responsible use, cybersecurity and staying safe online, digital financial literacy and UPI, and productivity tools like spreadsheets and documents. We make technology accessible and safe for everyone.',
      'Participants learn to use the digital economy with confidence while understanding privacy, security, and ethics. OVA™ brings this training to schools, community centres, and villages where it is needed.',
    ],
  },
];

function Services() {
  const { data: cmsData, seo: cmsSeo } = useCmsPage('services');
  const { services: cmsServiceList } = useCmsServices();
  const services = useMemo(() => {
    if (cmsData?.cards?.length) {
      return mapCmsServiceCards(cmsData.cards, SERVICES);
    }
    if (cmsServiceList?.length) {
      return mapCmsServiceCards(cmsServiceList, SERVICES);
    }
    return SERVICES;
  }, [cmsData, cmsServiceList]);
  const heroQuote = cmsData?.heroQuote
    ? stripHtml(cmsData.heroQuote)
    : 'Four programmes that create real impact: climate education, career readiness, community outreach, and digital literacy.';
  const ctaHeading = cmsData?.cta?.heading
    ? cmsData.cta.heading
    : 'Ready to Make a Difference?';
  const ctaBody = cmsData?.cta?.body
    ? cmsData.cta.body
    : 'Every contribution, big or small, helps communities in need. Join OVA™ today.';

  const [imgErrors, setImgErrors] = useState({});
  const showImage = (idx, url) => url && !imgErrors[idx];
  return (
    <div className="services-page-wrap">
      <SEO
        title={cmsSeo?.title || 'Our Services · Job Readiness, Outreach, Climate, Digital Literacy'}
        description={cmsSeo?.description || 'OVA™ runs four programmes: Job Readiness & Internships, Community Outreach & Education, Climate & Sustainability, and Ethical AI & Digital Literacy. Kolhapur NGO.'}
        canonical="/services"
        keywords="NGO services India, job readiness, internship, sustainability, AI literacy, community outreach, digital literacy Kolhapur"
      />

      {/* ── Hero – same style as Donate: green bg, white text, quote, CTA ── */}
      <section className="about-hero donate-hero-style">
        <AboutHeroBg className="donate-hero-bg" />
        <div className="about-hero-overlay donate-hero-overlay" aria-hidden="true" />
        <div className="container about-hero-container">
          <div className="about-hero-content donate-hero-content">
            <p className="donate-hero-eyebrow">Our Programmes</p>
            <h1 className="about-hero-title">Our <em>Services</em></h1>
            <blockquote className="donate-hero-quote">
              {heroQuote}
              <cite>, OVA™</cite>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ── Services detail sections ── */}
      <div id="programmes" className="svc-pg-sections">
        {services.map((svc, idx) => (
          <section
            key={svc.number}
            className={`svc-pg-item${idx % 2 === 1 ? ' svc-pg-item--reverse' : ''}`}
          >
            {/* Visual panel – space for image or icon */}
            <div className="svc-pg-visual" style={{ background: svc.bg }}>
              <span className="svc-pg-num" aria-hidden="true">{svc.number}</span>
              <div className="svc-pg-visual-inner">
                {showImage(idx, svc.image) ? (
                  <img
                    src={getOptimizedImageUrl(cmsImageUrl(svc.image))}
                    alt={svc.imageAlt || ''}
                    className="svc-pg-img"
                    width={400}
                    height={300}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (e.target.src !== cmsImageUrl(svc.image)) { e.target.src = cmsImageUrl(svc.image); e.target.onerror = null; return; }
                      setImgErrors((prev) => ({ ...prev, [idx]: true }));
                    }}
                  />
                ) : (
                  <div className="svc-pg-icon-wrap">
                    <i className={`bi ${svc.icon}`} aria-hidden="true" />
                  </div>
                )}
              </div>
              <span className="svc-pg-cat">{svc.category}</span>
            </div>

            {/* Content panel */}
            <div className="svc-pg-content">
              <h2 className="svc-pg-title">{svc.title}</h2>
              <p className="svc-pg-desc">{svc.desc}</p>

              <ul className="svc-pg-points">
                {svc.points.map((pt, i) => (
                  <li key={i} className="svc-pg-point">
                    <span className="svc-pg-point-icon" style={{ color: svc.color }}>
                      <i className={`bi ${pt.icon}`} aria-hidden="true" />
                    </span>
                    <span>{pt.text}</span>
                  </li>
                ))}
              </ul>

              <div className="svc-pg-btns">
                <Link to={`/services/${svc.id}`} className="ev-read-more-btn">
                  Read more
                </Link>
                <Link to="/join" className="svc-pg-btn">
                  Join us
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ── CTA banner ── */}
      <section className="svc-pg-cta">
        <div className="svc-pg-cta-inner">
          <h2 className="svc-pg-cta-title">{ctaHeading}</h2>
          <p className="svc-pg-cta-desc">{ctaBody}</p>
          <div className="svc-pg-cta-btns">
            <Link to="/donate" className="svc-cta-card-btn-primary">Donate Now</Link>
            <Link to="/join" className="svc-cta-card-btn-outline">Volunteer With Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Services;

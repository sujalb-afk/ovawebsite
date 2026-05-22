import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import AboutHeroBg from '../components/AboutHeroBg';
import { getOptimizedImageUrl, cmsImageUrl, cmsImageFallback } from '../utils/imageUrl';
import { useCmsPage, useCmsEvents } from '../hooks/useCms';
import { mapCmsEventToCard, normalizeEventsPageCopy } from '../utils/cmsMappers';
import { stripHtml } from '../utils/cmsHtml';

export const EVENTS = [
  {
    id: 1,
    tag: 'Cultural',
    tagIcon: 'bi-globe-americas',
    title: 'Language Connect: Cultural Exchange Day',
    date: 'Oct 26, 2024',
    month: 'OCT',
    day: '26',
    time: '11:00 AM',
    address: 'Chavan-dafale colony, Uchgaon, Kolhapur, Maharashtra 416005',
    organization: 'OVA™',
    contact: 'support@ova.ngo',
    image: '/images/events/cultural-gathering.webp',
    desc: [
      'Language Connect: Cultural Exchange Day brings people together through language. The day includes free language classes, cultural performances, and language exchange sessions with native speakers.',
      'Learning new languages and meeting people from different backgrounds helps break down barriers and build real connections. The event is a space where traditions and experiences are shared so everyone can learn from each other.',
      'The day also includes cultural performances: music, dance, and storytelling from different communities. Hands-on workshops cover cooking, art, and cultural history. It is a chance to celebrate diversity and build a more inclusive community.',
    ],
    highlights: [
      { icon: 'bi-translate',        text: 'Free language classes' },
      { icon: 'bi-music-note-beamed', text: 'Cultural performances' },
      { icon: 'bi-chat-dots',        text: 'Language exchange sessions' },
      { icon: 'bi-palette',          text: 'Hands-on cultural workshops' },
    ],
  },
  {
    id: 2,
    tag: 'Wellness',
    tagIcon: 'bi-heart-pulse',
    title: 'Community Wellness Camp',
    date: 'Oct 29, 2024',
    month: 'OCT',
    day: '29',
    time: '11:00 AM',
    address: 'Chavan-dafale colony, Uchgaon, Kolhapur, Maharashtra 416005',
    organization: 'OVA™',
    contact: 'support@ova.ngo',
    image: '/images/events/wellness-community.webp',
    desc: [
      'The Community Wellness Camp brings health services to the community. This free one-day camp offers medical check-ups, mental health counselling, and wellness education for residents of Uchgaon.',
      'Healthcare professionals and volunteers run health screenings, distribute essential medicines, and give guidance on nutrition and preventive care. We focus on families and senior citizens who have limited access to healthcare.',
      'The camp includes sessions on mental health, hygiene, and lifestyle diseases so participants can make better choices for their health. Join us to build a healthier community.',
    ],
    highlights: [
      { icon: 'bi-hospital',         text: 'Free medical check-ups' },
      { icon: 'bi-emoji-smile',      text: 'Mental health counselling' },
      { icon: 'bi-capsule',          text: 'Medicine distribution' },
      { icon: 'bi-heart',            text: 'Nutrition & wellness education' },
    ],
  },
  {
    id: 3,
    tag: 'Training',
    tagIcon: 'bi-shield-check',
    title: 'Disaster Preparedness Training Workshop',
    date: 'Oct 30, 2024',
    month: 'OCT',
    day: '30',
    time: '10:00 AM',
    address: 'Chavan-dafale colony, Uchgaon, Kolhapur, Maharashtra 416005',
    organization: 'OVA™',
    contact: 'support@ova.ngo',
    image: '/images/events/disaster-preparedness.webp',
    desc: [
      'The Disaster Preparedness Training Workshop teaches people how to respond during disasters and emergencies. Certified trainers run this hands-on workshop on first aid, evacuation planning, and emergency communication.',
      'Participants learn to spot hazards, prepare emergency kits, and practise life-saving techniques such as CPR and rescue breathing. The session also covers how to help children, the elderly, and people with disabilities in a crisis.',
      'The workshop is open to all and is especially useful for local volunteers, teachers, and healthcare workers. You will receive a certificate of participation and the confidence to act when it matters.',
    ],
    highlights: [
      { icon: 'bi-bandaid',          text: 'First aid & CPR training' },
      { icon: 'bi-map',              text: 'Evacuation planning' },
      { icon: 'bi-bag-plus',         text: 'Emergency kit preparation' },
      { icon: 'bi-award',            text: 'Certificate of participation' },
    ],
  },
  {
    id: 4,
    tag: 'Technology',
    tagIcon: 'bi-cpu',
    title: 'OVA™ Impact Day: Tech for Change',
    date: 'Nov 17, 2024',
    month: 'NOV',
    day: '17',
    time: '12:30 PM',
    address: 'Akshya Nagar 1st Block 1st Cross, Rammurthy nagar, Bangalore - 560016',
    organization: 'OVA™',
    contact: 'support@ova.ngo',
    image: '/images/events/tech-education-classroom.webp',
    desc: [
      'OVA™ Impact Day is a one-day event on using technology for social impact. It includes keynotes, hands-on workshops, a hackathon, and a panel discussion. Volunteers, NGOs, and tech enthusiasts come together to work on solutions for society.',
      'The event has keynote sessions by industry leaders on tech for social good, workshops on tools and strategies for volunteerism, and a hackathon to build solutions for sustainability and social equity.',
      'A panel discussion on the future of volunteerism in the digital age and a recognition ceremony for outstanding volunteers and organisations close the day. Come ready to collaborate and make an impact.',
    ],
    highlights: [
      { icon: 'bi-mic',              text: 'Industry keynote sessions' },
      { icon: 'bi-tools',            text: 'Interactive tech workshops' },
      { icon: 'bi-lightning-charge', text: 'Collaborative hackathon' },
      { icon: 'bi-trophy',           text: 'Volunteer recognition ceremony' },
    ],
  },
];

const EVENTS_PAGE_DEFAULTS = {
  heroHeading: 'Our Events',
  heroSubtext:
    "Join clean-ups, digital workshops, health camps, and fundraising events. See what's on and register to take part.",
  listHeading: 'Events & Programmes',
  listSubtitle:
    'See our upcoming events and take part. Each one is a chance to learn, connect, and give back.',
};

function Events() {
  const { data: cmsData, seo: cmsSeo } = useCmsPage('events');
  const { events: cmsEvents } = useCmsEvents();
  const pageCopy = useMemo(
    () => (cmsData ? normalizeEventsPageCopy(cmsData, EVENTS_PAGE_DEFAULTS) : EVENTS_PAGE_DEFAULTS),
    [cmsData]
  );
  const events = useMemo(() => {
    if (Array.isArray(cmsEvents) && cmsEvents.length) {
      return cmsEvents.map(mapCmsEventToCard);
    }
    return EVENTS;
  }, [cmsEvents]);
  const heroTitleParts = pageCopy.heroHeading.includes('Events')
    ? <>Our <em>Events</em></>
    : pageCopy.heroHeading;

  return (
    <div className="events-page-wrap">
      <SEO
        title={cmsSeo?.title || 'Events · OVA™ NGO Kolhapur'}
        description={cmsSeo?.description || 'OVA™ runs community events: clean-ups, language exchange, digital workshops, health camps. Join or volunteer. Kolhapur and Bangalore.'}
        canonical="/events"
        keywords="NGO events Kolhapur, volunteer events, community events, health camp, digital workshop"
      />

      {/* Hero – same style as Donate: green bg, white text, quote, CTA ── */}
      <section className="about-hero donate-hero-style">
        <AboutHeroBg className="donate-hero-bg" />
        <div className="about-hero-overlay donate-hero-overlay" aria-hidden="true" />
        <div className="container about-hero-container">
          <div className="about-hero-content donate-hero-content">
            <p className="donate-hero-eyebrow">Get Involved</p>
            <h1 className="about-hero-title">{heroTitleParts}</h1>
            <blockquote className="donate-hero-quote">
              {stripHtml(pageCopy.heroSubtext)}
              <cite>, OVA™</cite>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Detailed Events: 2-col vertical cards */}
      <section id="events-list" className="ev-list-section">
        <div className="ev-list-container">

          <div className="ev-list-header">
            <h2 className="ev-list-title">{pageCopy.listHeading}</h2>
            <p className="ev-list-subtitle">{pageCopy.listSubtitle}</p>
          </div>

          <div className="ev-cards-grid">
            {events.map((ev) => (
              <article key={ev.id} className="ev-card-v">
                <div className="ev-card-v-img-wrap">
                  {ev.image ? (
                    <img
                      src={getOptimizedImageUrl(cmsImageUrl(ev.image))}
                      alt={ev.title}
                      className="ev-card-v-img"
                      width={400}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const fallback = cmsImageFallback(ev.image);
                        if (fallback && e.target.src !== fallback) {
                          e.target.src = fallback;
                          e.target.onerror = null;
                        }
                      }}
                    />
                  ) : (
                    <div className="ev-card-v-placeholder" aria-label="Image coming soon">
                      <i className="bi bi-camera ev-card-v-placeholder-icon" aria-hidden="true" />
                      <span className="ev-card-v-placeholder-text">Image coming soon</span>
                    </div>
                  )}
                  <div className="ev-card-tag ev-card-tag--on-image">
                    <i className={`bi ${ev.tagIcon}`} aria-hidden="true" />
                    {ev.tag}
                  </div>
                </div>

                <div className="ev-card-v-content">
                  <div className="ev-card-v-body">
                    <h3 className="ev-card-v-title">{ev.title}</h3>
                    <div className="ev-card-v-meta">
                      <span className="ev-meta-item">
                        <i className="bi bi-calendar3" aria-hidden="true" />
                        {ev.date}
                      </span>
                      <span className="ev-meta-item">
                        <i className="bi bi-clock" aria-hidden="true" />
                        {ev.time}
                      </span>
                      <span className="ev-meta-item">
                        <i className="bi bi-geo-alt" aria-hidden="true" />
                        {ev.address}
                      </span>
                    </div>
                    <div className="ev-card-v-desc" title={ev.desc[0]}>
                      {ev.desc[0]}
                    </div>
                    <ul className="ev-card-v-highlights">
                      {ev.highlights.map((h, i) => (
                        <li key={i} className="ev-highlight-item">
                          <span className="ev-highlight-icon">
                            <i className={`bi ${h.icon}`} aria-hidden="true" />
                          </span>
                          {h.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="ev-card-v-footer">
                    <div className="ev-card-v-footer-btns">
                      <Link to={`/events/${ev.id}`} className="ev-read-more-btn">
                        Read more
                      </Link>
                      <Link to="/join" className="ev-register-btn ev-register-btn--block">
                        Join Us
                        <i className="bi bi-arrow-right" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}

export default Events;

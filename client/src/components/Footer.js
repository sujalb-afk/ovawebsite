import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import OvaBrand from './OvaBrand';
import { useCmsGlobal } from '../hooks/useCms';

const SOCIAL = [
  { icon: 'bi-facebook',  href: 'http://facebook.com/OpenVolunteerAssociation/',                          label: 'Facebook'   },
  { icon: 'bi-instagram', href: 'https://www.instagram.com/ovango2024',                                  label: 'Instagram'  },
  { icon: 'bi-linkedin',  href: 'https://www.linkedin.com/company/bharatiya-open-volunteer-association', label: 'LinkedIn'   },
  { icon: 'bi-youtube',   href: 'https://www.youtube.com/@OVA2024',                                      label: 'YouTube'    },
];

const Footer = React.memo(function Footer() {
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const mainRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { global: cmsGlobal, fromCms } = useCmsGlobal();
  const address = fromCms && cmsGlobal?.address ? cmsGlobal.address : 'Chavan-dafale colony, Uchgaon,\nKolhapur, Maharashtra 416005';
  const phone = fromCms && cmsGlobal?.phone ? cmsGlobal.phone : '+91 8080677811';
  const emailAddr = fromCms && cmsGlobal?.email ? cmsGlobal.email : 'support@ova.ngo';
  const aboutText = fromCms && cmsGlobal?.footerAbout ? cmsGlobal.footerAbout : 'is an NGO that uses technology to support volunteerism and community work. We run programs on sustainability, job readiness, and digital literacy.';
  const socials = fromCms && cmsGlobal?.socials ? cmsGlobal.socials : SOCIAL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post('/api/newsletter', { email });
      if (res.data && res.data.success === false) {
        setMessage(res.data.message || 'This email is already subscribed.');
      } else {
        setMessage('Thank you! You will be notified when something new appears.');
        setEmail('');
        e.target?.reset?.();
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setMessage(serverMessage && typeof serverMessage === 'string' ? serverMessage : 'Subscription failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer-ova">

      {/* ── Main footer grid ── */}
      <div ref={mainRef} className={`footer-main${inView ? ' footer-inview' : ''}`}>

        {/* 1. About Us + OVA™ info – same column structure as Contact / Stay Updated */}
        <div className="footer-col footer-col-brand">
          <h5 className="footer-col-heading">
            <Link to="/about" className="footer-col-heading-link" aria-label="About Us">
              About Us
            </Link>
          </h5>
          <p className="footer-about-text">
            <OvaBrand /> {aboutText}
          </p>
          <div className="footer-legal-links footer-legal-links-below-about">
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/refund">Refund Policy</Link>
          </div>
        </div>

        {/* 2. Contact (center) */}
        <div className="footer-col footer-col-contact">
          <h5 className="footer-col-heading">Contact</h5>
          <ul className="footer-contact-list">
            <li>
              <i className="bi bi-geo-alt" aria-hidden="true" />
              <span style={{ whiteSpace: 'pre-line' }}>{address}</span>
            </li>
            <li>
              <i className="bi bi-telephone" aria-hidden="true" />
              <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>
            </li>
            <li>
              <i className="bi bi-envelope" aria-hidden="true" />
              <a href={`mailto:${emailAddr}`}>{emailAddr}</a>
            </li>
          </ul>
          <div className="footer-socials footer-socials-below-contact">
            {socials.map((s) => (
              <a
                key={s.label || s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label || 'Social'}
                className="footer-social-icon"
              >
                <i className={`bi ${s.icon || 'bi-globe'}`} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {/* 3. Newsletter (Stay Updated) – right */}
        <div className="footer-col footer-col-newsletter">
          <h5 className="footer-col-heading">Stay Updated</h5>
          <p className="footer-newsletter-desc">
            Subscribe to our newsletter for the latest updates, events, and impact stories.
          </p>
          <form onSubmit={handleSubmit} className="footer-newsletter-form" autoComplete="off">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (message) setMessage('');
              }}
              required
              className="footer-newsletter-input"
            />
            <button type="submit" className="footer-newsletter-btn" disabled={loading}>
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
          {message && <p className="footer-newsletter-msg">{message}</p>}
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">

          <p className="footer-copy-line footer-copy-primary">
            © {new Date().getFullYear()} <OvaBrand />. All rights reserved.
          </p>

          <p className="footer-copy-line footer-copy-sub">
            OVA is the public brand of Bharatiya Open Volunteer Association
            <br />
            (A Section 8 Company, India)
          </p>
          <p className="footer-copy-line footer-copy-sub footer-copy-partner">
            Technology partner:{' '}
            <a href="https://orelse.ai" target="_blank" rel="noopener noreferrer">
              ORELSE Private Limited
            </a>.
          </p>

        </div>
      </div>

    </footer>
  );
});
Footer.displayName = 'Footer';
export default Footer;

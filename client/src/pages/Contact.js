import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import axios from 'axios';
import { MapPin, Mail, Phone } from 'lucide-react';
import SEO from '../components/SEO';
import AboutHeroBg from '../components/AboutHeroBg';
import { loadRecaptchaScript } from '../utils/recaptchaLoader';
import { useCmsPage } from '../hooks/useCms';
import { stripHtml } from '../utils/cmsHtml';

const ReCAPTCHA = lazy(() => import('react-google-recaptcha'));

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || import.meta.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LdpmIUsAAAAAFjnXdOOSY5wDXZelXs0RD4EZ-uh';

const SUBJECT_OPTIONS = [
  'General Inquiry',
  'Volunteer Opportunity',
  'Donation / Partnership',
  'Media / Press',
  'Other',
];

const FAQ_ITEMS = [
  { q: 'How can I volunteer with OVA™?', a: 'Visit our Join page to apply. We\'ll get back to you within 2–3 business days.' },
  { q: 'Where is OVA™ located?', a: 'We are based in Kolhapur, Maharashtra. Our office is at Chavan-dafale colony, Uchgaon.' },
  { q: 'How can I make a donation?', a: 'Visit our Donate page for bank details and 80G tax exemption information.' },
  { q: 'What are your working hours?', a: 'We are available Monday–Saturday, 9:00 AM – 6:00 PM IST.' },
];

const INITIAL_CONTACT_FORM = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

function Contact() {
  const { data: cmsData, seo: cmsSeo } = useCmsPage('contact');
  const faqList =
    Array.isArray(cmsData?.faqItems) && cmsData.faqItems.length
      ? cmsData.faqItems
      : Array.isArray(cmsData?.faqs) && cmsData.faqs.length
        ? cmsData.faqs.map((item) => ({
            q: item.q || item.question || '',
            a: item.a || item.answer || '',
          }))
        : FAQ_ITEMS;
  const recaptchaRef = useRef(null);
  const submitWrapRef = useRef(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [captchaKey, setCaptchaKey] = useState(0);
  useEffect(() => {
    loadRecaptchaScript().then(() => setRecaptchaReady(true)).catch(() => setRecaptchaReady(false));
  }, [captchaKey]);
  const [faqOpenIndex, setFaqOpenIndex] = useState(0);
  const [formData, setFormData] = useState({ ...INITIAL_CONTACT_FORM });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({ ...INITIAL_CONTACT_FORM });
    setErrors({});
    setCaptchaKey((k) => k + 1);
    setFormKey((k) => k + 1);
  };

  const apiBase = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || '';

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email';
    if (!formData.subject) newErrors.subject = 'Please select a subject';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCaptcha = () => {
    const token = recaptchaRef.current?.getValue?.();
    if (!token) {
      setErrors((prev) => ({ ...prev, captcha: 'Please complete the captcha.' }));
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setStatus('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors((prev) => ({ ...prev, captcha: '' }));
    if (!validate()) return;
    if (!validateCaptcha()) return;

    const recaptchaToken = recaptchaRef.current?.getValue?.() ?? null;
    setIsSubmitting(true);
    setStatus('');
    try {
      const res = await axios.post(`${apiBase}/api/contact`, {
        ...formData,
        recaptchaToken,
      });
      if (res.data?.success === false) {
        setStatus('error');
        return;
      }
      resetForm();
      setStatus('success');
      submitWrapRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title={cmsSeo?.title || "Contact Us · Get in Touch"}
        description={cmsSeo?.description || "Contact OVA™. Address: Chavan-dafale colony, Uchgaon, Kolhapur. Phone: +91 8080677811 | Email: support@ova.ngo"}
        canonical="/contact"
        keywords="OVA™ contact, NGO Kolhapur, volunteer contact, support ova.ngo"
      />

      <div className="contact-page">
        {/* 1. Hero – same as About Us, Team, Services, Events */}
        <section className="about-hero">
          <AboutHeroBg />
          <div className="about-hero-overlay" aria-hidden="true" />
          <div className="container about-hero-container">
            <div className="about-hero-content">
              <h1 className="about-hero-title">{cmsData?.heroHeading || 'Get in Touch'}</h1>
              <p className="about-hero-subtext">
                {cmsData?.heroSubtext ? stripHtml(cmsData.heroSubtext) : 'We\'d love to hear from you. Reach out for inquiries, partnerships, or to learn how you can make a difference.'}
              </p>
              <a href="#contact-form" className="btn btn-light btn-lg px-5 py-3 fw-bold contact-hero-cta">
                {cmsData?.heroCtaLabel || 'Send a Message'}
              </a>
            </div>
          </div>
        </section>

        {/* 2. Contact Section - Two Columns */}
        <section className="contact-section">
          <div className="container">
            <div className="row g-4 g-lg-5">
              {/* Left Column - Contact Info */}
              <div className="col-lg-5">
                <div className="contact-info-card">
                  <h3 className="contact-info-title">{cmsData?.infoHeading || 'Contact Information'}</h3>
                  <ul className="contact-info-list">
                    <li>
                      <MapPin size={20} className="contact-info-icon" />
                      <div>
                        <strong>Address</strong>
                        <p>Chavan-dafale colony, Uchgaon, Kolhapur, Maharashtra 416005</p>
                      </div>
                    </li>
                    <li>
                      <Mail size={20} className="contact-info-icon" />
                      <div>
                        <strong>Email</strong>
                        <p><a href="mailto:support@ova.ngo">support@ova.ngo</a></p>
                      </div>
                    </li>
                    <li>
                      <Phone size={20} className="contact-info-icon" />
                      <div>
                        <strong>Phone</strong>
                        <p><a href="tel:+918080677811">+91 8080677811</a></p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column - Contact Form */}
              <div className="col-lg-7">
                <div id="contact-form" className="contact-form-card">
                  <h3 className="contact-form-title">{cmsData?.formHeading || 'Send a Message'}</h3>
                  <form key={formKey} onSubmit={handleSubmit} noValidate autoComplete="off">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          name="name"
                          className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                          placeholder="Your name"
                          value={formData.name}
                          onChange={handleChange}
                        />
                        {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email <span className="text-danger">*</span></label>
                        <input
                          type="email"
                          name="email"
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={handleChange}
                        />
                        {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                      </div>
                      <div className="col-12">
                        <label className="form-label">Phone <span className="text-muted">(optional)</span></label>
                        <input
                          type="tel"
                          name="phone"
                          className="form-control"
                          placeholder="Your phone number"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Subject <span className="text-danger">*</span></label>
                        <select
                          name="subject"
                          className={`form-select ${errors.subject ? 'is-invalid' : ''}`}
                          value={formData.subject}
                          onChange={handleChange}
                        >
                          <option value="">Select a subject</option>
                          {SUBJECT_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {errors.subject && <div className="invalid-feedback d-block">{errors.subject}</div>}
                      </div>
                      <div className="col-12">
                        <label className="form-label">Message <span className="text-danger">*</span></label>
                        <textarea
                          name="message"
                          className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                          rows="4"
                          placeholder="How can we help you?"
                          value={formData.message}
                          onChange={handleChange}
                        />
                        {errors.message && <div className="invalid-feedback d-block">{errors.message}</div>}
                      </div>
                      <div className="col-12 contact-recaptcha-wrap" style={{ minHeight: 78 }}>
                        {recaptchaReady && (
                          <Suspense fallback={null}>
                            <ReCAPTCHA
                              key={captchaKey}
                              ref={recaptchaRef}
                              sitekey={RECAPTCHA_SITE_KEY}
                              theme="light"
                              size="normal"
                            />
                          </Suspense>
                        )}
                        {errors.captcha && <div className="invalid-feedback d-block mt-2">{errors.captcha}</div>}
                      </div>
                      <div ref={submitWrapRef} className="col-12 contact-submit-wrap">
                        <button type="submit" className="btn btn-ova btn-lg px-4" disabled={isSubmitting}>
                          {isSubmitting ? 'Sending...' : 'Submit'}
                        </button>
                        {status === 'success' && (
                          <p className="contact-success-msg mt-3 mb-0">
                            Message sent successfully! We&apos;ll get back to you soon.
                          </p>
                        )}
                        {status === 'error' && (
                          <p className="contact-error-msg mt-3 mb-0">
                            Failed to send. Please try again or email us directly at support@ova.ngo
                          </p>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Map Section */}
        <section className="contact-map-section">
          <div className="contact-map-header">
            <h2 className="contact-map-title">{cmsData?.mapHeading || 'Find Us'}</h2>
            <p className="contact-map-desc">
              {cmsData?.mapBody ? stripHtml(cmsData.mapBody) : 'OVA™ is located in Chavan-dafale colony, Uchgaon, Kolhapur. Use the map below to get directions or plan your visit. We are available Monday–Saturday, 9:00 AM – 6:00 PM IST.'}
            </p>
          </div>
          <div className="contact-map-wrapper">
            <iframe
              title="OVA™ Office - Chavan-dafale colony, Uchgaon, Kolhapur"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3825.5!2d74.274345!3d16.696154!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc1000cdec00001%3A0x1!2sChavan%20Dafale%20Colony%2C%20Uchgaon%2C%20Kolhapur%2C%20Maharashtra%20416005!5e0!3m2!1sen!2sin!4v1709000000000"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        {/* 4. FAQ / Quick Help: same accordion style as Donate page */}
        <section className="d-section d-section-grey d-faq-section contact-faq-section">
          <div className="d-faq-section-header">
            <h2 className="d-faq-title">{cmsData?.faqHeading || 'Quick Help'}</h2>
            <p className="d-faq-subtitle">{cmsData?.faqSubtitle || 'Common questions answered'}</p>
            <div className="d-section-line d-faq-line" />
          </div>
          <div className="d-faq-accordion">
            {faqList.map((item, idx) => (
              <div
                key={idx}
                className={`d-faq-accordion-item ${faqOpenIndex === idx ? 'd-faq-accordion-item--open' : ''}`}
              >
                <button
                  type="button"
                  className="d-faq-accordion-trigger"
                  onClick={() => setFaqOpenIndex(faqOpenIndex === idx ? -1 : idx)}
                  aria-expanded={faqOpenIndex === idx}
                  aria-controls={`contact-faq-answer-${idx}`}
                  id={`contact-faq-question-${idx}`}
                >
                  <span className="d-faq-accordion-question">{item.q}</span>
                  <span className="d-faq-accordion-icon" aria-hidden="true">
                    {faqOpenIndex === idx ? (
                      <i className="bi bi-dash" aria-hidden="true" />
                    ) : (
                      <i className="bi bi-plus" aria-hidden="true" />
                    )}
                  </span>
                </button>
                <div
                  id={`contact-faq-answer-${idx}`}
                  className="d-faq-accordion-answer"
                  role="region"
                  aria-labelledby={`contact-faq-question-${idx}`}
                  hidden={faqOpenIndex !== idx}
                >
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default Contact;

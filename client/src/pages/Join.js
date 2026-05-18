import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AboutHeroBg from '../components/AboutHeroBg';
import { Sparkles, GraduationCap, Users, Award, Send, CheckCircle2, MapPin, Rocket, BookOpen, Globe, Calendar, ClipboardList } from 'lucide-react';
import SEO from '../components/SEO';
import { loadRecaptchaScript } from '../utils/recaptchaLoader';

const ReCAPTCHA = lazy(() => import('react-google-recaptcha'));
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || import.meta.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LdpmIUsAAAAAFjnXdOOSY5wDXZelXs0RD4EZ-uh';

const INITIAL_JOIN_FORM = {
  name: '', email: '', phone: '', role: '', skills: '', message: '',
};

function AnimatedStat({ target, suffix = '', duration = 2000, isVisible }) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafId = useRef(null);

  useEffect(() => {
    if (!isVisible) return;
    setDisplayValue(0);
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = progress >= 1 ? target : Math.floor(eased * target);
      setDisplayValue(current);
      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    rafId.current = requestAnimationFrame(animate);
    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, [target, duration, isVisible]);

  return (
    <span className="join-stat-value">
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}

function Join() {
  const formRef = useRef(null);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [formData, setFormData] = useState({ ...INITIAL_JOIN_FORM });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [captchaKey, setCaptchaKey] = useState(0);
  const recaptchaRef = useRef(null);

  const resetForm = () => {
    setFormData({ ...INITIAL_JOIN_FORM });
    setTermsAccepted(false);
    setSubmitError('');
    setCaptchaKey((k) => k + 1);
    setFormKey((k) => k + 1);
  };

  useEffect(() => {
    loadRecaptchaScript().then(() => setRecaptchaReady(true)).catch(() => setRecaptchaReady(false));
  }, [captchaKey]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.05, rootMargin: '40px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const benefits = [
    { icon: Sparkles, title: 'Real Impact', desc: 'See the direct difference your efforts make in communities.' },
    { icon: GraduationCap, title: 'Learning & Growth', desc: 'Develop new skills and gain hands-on experience.' },
    { icon: Users, title: 'Community', desc: 'Join a supportive network of like-minded changemakers.' },
    { icon: Award, title: 'Recognition', desc: 'Earn certificates and formal acknowledgment of your contributions.' },
  ];

  const roles = [
    { icon: BookOpen, title: 'Education Support', desc: 'Tutor, mentor, or assist in educational programs.' },
    { icon: Globe, title: 'Community Outreach', desc: 'Engage with local communities and spread awareness.' },
    { icon: Calendar, title: 'Event Coordination', desc: 'Help plan and run OVA™ events and campaigns.' },
    { icon: ClipboardList, title: 'Administrative Support', desc: 'Assist with coordination, communications, and logistics.' },
  ];

  const steps = [
    { icon: Send, title: 'Apply', desc: 'Fill out the application form below.' },
    { icon: CheckCircle2, title: 'Orientation', desc: 'Attend a brief orientation session.' },
    { icon: MapPin, title: 'Get Assigned', desc: 'We match you with a role that fits your skills.' },
    { icon: Rocket, title: 'Start Volunteering', desc: 'Begin making an impact in your community.' },
  ];

  const impactStats = [
    { target: 100, suffix: '+', label: 'Volunteers' },
    { target: 40, suffix: '+', label: 'Schools Served' },
    { target: 500, suffix: '+', label: 'Lives Touched' },
  ];

  const testimonials = [
    { quote: 'Volunteering with OVA™ gave me purpose and a community that truly cares.', author: '- Volunteer, Mumbai' },
    { quote: 'I learned more in six months here than in years elsewhere. Real impact, real growth.', author: '- Member, Pune' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitStatus('');
    if (!termsAccepted) {
      setSubmitError('Please accept the terms to proceed.');
      return;
    }
    const token = recaptchaRef.current?.getValue?.();
    if (!token) {
      setSubmitError('Please complete the captcha.');
      return;
    }
    const apiBase = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || '';
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${apiBase}/api/join`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        skills: formData.skills,
        message: formData.message,
        recaptchaToken: token,
      });
      if (res.data?.success === false) {
        setSubmitError(res.data.message || 'Failed to submit. Please try again.');
        setSubmitStatus('error');
        return;
      }
      resetForm();
      setSubmitStatus('success');
      formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit. Please try again.';
      setSubmitError(msg);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Join as a Volunteer · Become a Member"
        description="Join OVA™ as a volunteer or member. Create impact, learn, and be part of a community of changemakers."
        canonical="/join"
        keywords="join OVA™, become volunteer, NGO membership, volunteer India, OVA™ volunteer"
      />

      <div className="join-page">
        {/* 1. Hero – same style as About, Services, Events: green bg, silhouettes, quote, CTA */}
        <section className="about-hero donate-hero-style">
          <AboutHeroBg className="donate-hero-bg" />
          <div className="about-hero-overlay donate-hero-overlay" aria-hidden="true" />
          <div className="container about-hero-container">
            <div className="about-hero-content donate-hero-content">
              <p className="donate-hero-eyebrow">Volunteer</p>
              <h1 className="about-hero-title">Become a Volunteer. Create <em>Impact</em>.</h1>
              <blockquote className="donate-hero-quote">
                Join OVA™ and be part of a community that empowers lives and transforms futures.
                <cite>, OVA™</cite>
              </blockquote>
              <button type="button" onClick={scrollToForm} className="donate-hero-cta">
                Apply Now
              </button>
            </div>
          </div>
        </section>

        {/* 2. Why Join OVA™ */}
        <section className="join-section join-section-white">
          <div className="container">
            <h2 className="join-section-title text-center">Why Join OVA™</h2>
            <div className="join-benefits-grid join-benefits-compact">
              {benefits.map((b, idx) => (
                <div key={idx} className="join-benefit-card">
                  <div className="join-benefit-icon">
                    <b.icon size={32} strokeWidth={1.5} />
                  </div>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Volunteer / Member Roles */}
        <section className="join-section join-roles-section">
          <div className="container join-roles-container">
            <div className="join-roles-header">
              <h2 className="join-section-title">Volunteer / Member Roles</h2>
              <p className="join-roles-subtitle">
                Find a role that matches your skills and interests.
              </p>
            </div>
            <div className="join-roles-grid">
              {roles.map((r, idx) => (
                <div key={idx} className="join-role-card">
                  <div className="join-role-card-icon">
                    <r.icon size={28} strokeWidth={1.5} aria-hidden />
                  </div>
                  <h3 className="join-role-card-title">{r.title}</h3>
                  <p className="join-role-card-desc">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. How It Works */}
        <section className="join-section join-section-white join-how-section">
          <div className="container">
            <h2 className="join-section-title join-how-title text-center">How It Works</h2>
            <p className="join-how-subtitle text-center">Four simple steps to start volunteering with OVA™.</p>
            <div className="join-steps">
              {steps.map((s, idx) => (
                <div key={idx} className="join-step">
                  <div className="join-step-icon">
                    <s.icon size={28} strokeWidth={1.5} />
                  </div>
                  <div className="join-step-content">
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Join Form */}
        <section ref={formRef} className="join-section join-section-green join-form-section">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <h2 className="join-section-title text-center">Apply to Join</h2>
                <p className="join-why-subtitle text-center">
                  Fill out the form below. We&apos;ll get back to you soon.
                </p>
                <form key={formKey} onSubmit={handleSubmit} className="join-apply-form" autoComplete="off">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name <span className="join-required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Your name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email <span className="join-required">*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="your@email.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone <span className="join-required">*</span></label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="Your phone number"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Preferred Role</label>
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="">Select a role</option>
                        {roles.map((r, idx) => (
                          <option key={idx} value={r.title}>{r.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Skills / Interests</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. teaching, communication, coordination"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Message</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Tell us why you want to join OVA™ (optional)"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <div className="join-checkbox-row">
                        <input
                          type="checkbox"
                          id="termsAccepted"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="join-checkbox"
                        />
                        <label htmlFor="termsAccepted" className="join-checkbox-label">
                          I agree to the privacy policy and terms. <span className="join-required">*</span>
                        </label>
                      </div>
                    </div>
                    <div className="col-12" style={{ minHeight: 78 }}>
                      {recaptchaReady && (
                        <Suspense fallback={<span>Loading captcha…</span>}>
                          <ReCAPTCHA
                            key={captchaKey}
                            ref={recaptchaRef}
                            sitekey={RECAPTCHA_SITE_KEY}
                            theme="light"
                            size="normal"
                          />
                        </Suspense>
                      )}
                    </div>
                    <div className="col-12 text-center join-submit-wrap">
                      <button type="submit" className="btn btn-ova btn-lg px-5 py-3" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting…' : 'Submit Application'}
                      </button>
                    </div>
                    {submitStatus === 'success' && (
                      <div className="col-12 alert alert-success mb-0">Application submitted successfully! We&apos;ll get back to you soon.</div>
                    )}
                    {submitError && <p className="join-submit-error col-12">{submitError}</p>}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Impact Stats / Testimonials */}
        <section className="join-section join-section-white">
          <div className="container">
            <div ref={statsRef} className="join-impact-stats">
              {impactStats.map((s, idx) => (
                <div key={idx} className="join-stat-item">
                  <AnimatedStat target={s.target} suffix={s.suffix} isVisible={statsVisible} />
                  <span className="join-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="join-testimonials">
              <h3 className="join-section-title text-center">What Volunteers Say</h3>
              <div className="join-testimonial-grid">
                {testimonials.map((t, idx) => (
                  <blockquote key={idx} className="join-testimonial-card">
                    <p>&quot;{t.quote}&quot;</p>
                    <footer>{t.author}</footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Donate CTA */}
        <section className="join-section join-section-green join-cta-section">
          <div className="container text-center">
            <p className="join-cta-desc mb-3">Want to support our work financially?</p>
            <Link to="/donate#feed-children" className="btn btn-ova btn-lg px-4 py-3">Donate Now</Link>
          </div>
        </section>
      </div>
    </>
  );
}

export default Join;

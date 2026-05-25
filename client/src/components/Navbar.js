import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { useCmsGlobal } from '../hooks/useCms';
import { cmsImageUrl } from '../utils/imageUrl';

const HERO_SCROLL_THRESHOLD = 80;

const ABOUT_ITEMS = [
  { path: '/about', label: 'About Us' },
  { path: '/team', label: 'Our Team' },
];

const EVENTS_ITEMS = [
  { path: '/events', label: 'All Events' },
  { path: '/gallery', label: 'Gallery' },
];

const NAV_ITEMS = [
  { type: 'link',     path: '/',        label: 'Home',         icon: 'bi-house'         },
  { type: 'dropdown', key: 'about',     label: 'About',        icon: 'bi-people',       items: ABOUT_ITEMS  },
  { type: 'link',     path: '/services',label: 'Services',     icon: 'bi-grid'          },
  { type: 'dropdown', key: 'events',    label: 'Events',       icon: 'bi-calendar-event',items: EVENTS_ITEMS },
  { type: 'link',     path: '/join',    label: 'Join Us',       icon: 'bi-person-plus'   },
  { type: 'link',     path: '/contact', label: 'Contact',      icon: 'bi-envelope'      },
];

const MOBILE_BREAKPOINT = 768;
const PUBLIC_URL = (import.meta.env.BASE_URL || '').replace(/\/$/, '');
const OVA_CONNECT_URL = 'https://connect.ova.ngo/';

const DROPDOWN_DEFAULTS = {
  about: ABOUT_ITEMS,
  events: EVENTS_ITEMS,
};

/** CMS sometimes duplicates OVA Connect / Donate as nav links; those stay in the CTA area only. */
function isNavCtaDuplicate(item) {
  if (!item || item.type === 'dropdown') return false;
  const path = String(item.path || item.to || '').toLowerCase().trim();
  const label = String(item.label || '').toLowerCase().trim();
  if (path.includes('connect.ova.ngo') || path === '/donate' || path.startsWith('/donate#')) return true;
  if (/^donate(\s+now)?$/i.test(label) || /^ova\s*connect$/i.test(label)) return true;
  return false;
}

function sanitizeNavItems(items) {
  if (!Array.isArray(items)) return NAV_ITEMS;
  return items
    .filter((item) => item && !isNavCtaDuplicate(item))
    .map((item) => {
      if (item.type !== 'dropdown') return item;
      const key = item.key || '';
      const subs = Array.isArray(item.items) && item.items.length ? item.items : DROPDOWN_DEFAULTS[key];
      return subs?.length ? { ...item, items: subs } : null;
    })
    .filter(Boolean);
}

/* Transparent navbar (on hero) → ovalogo1; white navbar → ovalogo2. */
function getLogoUrls(onHero, cmsGlobal = null) {
  if (cmsGlobal && cmsGlobal.site_settings) {
    const settings = cmsGlobal.site_settings;
    if (onHero && settings.logo_secondary) {
      const src = cmsImageUrl(settings.logo_secondary);
      return { src, srcSet: undefined, sizes: undefined, fallback: src };
    }
    if (!onHero && settings.logo_primary) {
      const src = cmsImageUrl(settings.logo_primary);
      return { src, srcSet: undefined, sizes: undefined, fallback: src };
    }
  }

  const base = `${PUBLIC_URL}/images`;
  const name = onHero ? 'ovalogo1' : 'ovalogo2';
  return {
    src: `${base}/${name}-90w.webp`,
    srcSet: `${base}/${name}-90w.webp 90w, ${base}/${name}-180w.webp 180w`,
    sizes: '90px',
    fallback: `${base}/${name}.png`,
  };
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [onHero, setOnHero] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT);
  const location = useLocation();
  const { global: cmsGlobal } = useCmsGlobal();
  const navItems = useMemo(
    () => sanitizeNavItems(cmsGlobal?.navItems?.length ? cmsGlobal.navItems : NAV_ITEMS),
    [cmsGlobal?.navItems]
  );
  const donateLabel = cmsGlobal?.donateLabel || 'Donate Now';
  const connectLabel = cmsGlobal?.connectLabel || 'OVA Connect';
  const logoUrls = useMemo(() => getLogoUrls(onHero, cmsGlobal), [onHero, cmsGlobal]);

  const isHome = location.pathname === '/';
  const isDonatePage = location.pathname === '/donate';
  const donateTo = isMobile ? '/donate#donation-form' : '/donate';

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isHome) {
      setOnHero(false);
      return;
    }
    const check = () => setOnHero(window.scrollY < HERO_SCROLL_THRESHOLD);
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, [isHome]);

  const isActive = (path) => location.pathname === path;
  const isAboutActive = () => location.pathname === '/about' || location.pathname === '/team';
  const isEventsActive = () => location.pathname === '/events' || location.pathname === '/gallery';

  /* Close sidebar when route changes (e.g. after clicking a link) – like classic drawer behavior */
  useEffect(() => {
    setIsOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  /* Lock body scroll when mobile drawer is open */
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = prev;
        document.body.style.touchAction = '';
      };
    }
  }, [isOpen]);

  const favicon = cmsGlobal?.site_settings?.favicon ? cmsImageUrl(cmsGlobal.site_settings.favicon) : null;

  return (
    <>
      {favicon && (
        <Helmet>
          <link rel="icon" href={favicon} />
          <link rel="apple-touch-icon" href={favicon} />
        </Helmet>
      )}
      <nav className={`navbar-ova-updated fixed-top${onHero ? ' navbar-on-hero' : ''}${!isHome ? ' navbar-off-hero' : ''}${isDonatePage ? ' navbar-page-donate' : ''}${isOpen ? ' navbar-drawer-open' : ''}`}>
        <div className="navbar-ova-updated-container">

        {/* Mobile backdrop – tap outside to close */}
        {isOpen && (
          <div
            className="navbar-mobile-backdrop"
            aria-hidden="true"
            onClick={() => { setIsOpen(false); setOpenDropdown(null); }}
          />
        )}

        {/* Logo: WebP 90w/180w (run optimize-images.js); fallback to PNG */}
        <Link className="navbar-brand navbar-brand-updated" to="/" aria-label="OVA™ Home">
          <img
            src={logoUrls.src}
            srcSet={logoUrls.srcSet}
            sizes={logoUrls.sizes}
            alt="OVA™"
            className="navbar-logo-ova"
            width={90}
            height={90}
            decoding="async"
            onError={(e) => {
              const { fallback } = logoUrls;
              if (fallback && !e.target.src.endsWith('.png') && !e.target.src.includes(fallback)) {
                e.target.src = fallback;
                e.target.onerror = null;
              }
            }}
          />
        </Link>

        {/* Nav links – middle (mobile drawer); close via same hamburger toggle or backdrop */}
        <div className={`navbar-ova-menu${isOpen ? ' navbar-ova-menu-open' : ''}`}>

          {/* ── Nav list ── */}
          <ul className="navbar-nav-updated">
            {navItems.map((item) => {
              if (item.type === 'dropdown') {
                const isActiveDropdown = item.key === 'about' ? isAboutActive() : isEventsActive();
                const isOpenThis = openDropdown === item.key;
                return (
                  <li
                    key={item.key}
                    className={`nav-item nav-item-dropdown${isOpenThis ? ' dropdown-open' : ''}${isActiveDropdown ? ' nav-item-active' : ''}`}
                    onMouseEnter={() => !isOpen && setOpenDropdown(item.key)}
                    onMouseLeave={() => !isOpen && setOpenDropdown(null)}
                  >
                    <button
                      type="button"
                      className={`nav-link-updated nav-link-dropdown-trigger${isActiveDropdown ? ' active' : ''}`}
                      onClick={() => setOpenDropdown(isOpenThis ? null : item.key)}
                      aria-expanded={isOpenThis}
                      aria-haspopup="true"
                    >
                      <span className="nav-dropdown-label">{item.label}</span>
                      <i
                        className={`bi bi-chevron-down nav-dropdown-chevron${isOpenThis ? ' nav-dropdown-chevron--open' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                    <div className={`nav-dropdown-menu${isOpenThis ? ' open' : ''}`}>
                      {(item.items || []).map((sub) => (
                        <Link
                          key={sub.path}
                          className={`nav-dropdown-item${isActive(sub.path) ? ' active' : ''}`}
                          to={sub.path}
                          onClick={() => { setIsOpen(false); setOpenDropdown(null); }}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </li>
                );
              }
              return (
                <li key={item.path} className={`nav-item${isActive(item.path) ? ' nav-item-active' : ''}`}>
                  <Link
                    className={`nav-link-updated${isActive(item.path) ? ' active' : ''}`}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ── Mobile CTAs ── */}
          <div className="mobile-drawer-footer">
            <a
              className="btn-nav-donate-mobile btn-nav-connect-mobile"
              href={OVA_CONNECT_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
            >
              {connectLabel}
            </a>
            <Link
              className="btn-nav-donate-mobile"
              to={donateTo}
              onClick={() => setIsOpen(false)}
            >
              {donateLabel}
            </Link>
          </div>
        </div>

        {/* OVA Connect + Donate – right (desktop) */}
        <div className="navbar-cta-wrap">
          <a
            className="btn-nav-donate-updated btn-nav-connect-updated"
            href={OVA_CONNECT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
          >
            {connectLabel}
          </a>
          <Link className="btn-nav-donate-updated" to={donateTo} onClick={() => setIsOpen(false)}>
            {donateLabel}
          </Link>
        </div>

        {/* Mobile toggler – last in container so it appears on the right */}
        <button
          className="navbar-toggler-updated"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
        >
          <span className={`navbar-toggler-icon-bar${isOpen ? ' bar-open' : ''}`} />
          <span className={`navbar-toggler-icon-bar${isOpen ? ' bar-open' : ''}`} />
          <span className={`navbar-toggler-icon-bar${isOpen ? ' bar-open' : ''}`} />
        </button>

      </div>
    </nav>
    </>
  );
}

export default React.memo(Navbar);

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

const NAV_LABEL_BY_PATH = {
  '/': 'Home',
  '/services': 'Services',
  '/join': 'Join Us',
  '/contact': 'Contact',
};
const NAV_LABEL_BY_KEY = {
  about: 'About',
  events: 'Events',
};

function normalizeNavItem(item) {
  if (!item) return null;
  if (item.type === 'dropdown' || Array.isArray(item.items)) {
    const key =
      item.key
      || (String(item.label || '').toLowerCase() === 'about'
        ? 'about'
        : String(item.label || '').toLowerCase() === 'events'
          ? 'events'
          : '');
    if (!key) return null;
    const subs = Array.isArray(item.items) && item.items.length ? item.items : DROPDOWN_DEFAULTS[key];
    if (!subs?.length) return null;
    return {
      ...item,
      type: 'dropdown',
      key,
      label: NAV_LABEL_BY_KEY[key] || item.label,
      items: subs,
    };
  }
  const path = item.path || item.to || '/';
  const label = NAV_LABEL_BY_PATH[path] || normalizeNavLabel(item.label);
  return {
    ...item,
    type: 'link',
    path,
    label,
  };
}

function normalizeNavLabel(label) {
  const key = String(label || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const aliases = {
    'join us today': 'Join Us',
    'join us now': 'Join Us',
    'contact me': 'Contact',
    'contact us': 'Contact',
  };
  return aliases[key] || label;
}

function sanitizeNavItems(items) {
  if (!Array.isArray(items) || !items.length) return NAV_ITEMS;
  const normalized = items
    .filter((item) => item && !isNavCtaDuplicate(item))
    .map((item) => normalizeNavItem(item))
    .filter(Boolean);
  return normalized.length ? normalized : NAV_ITEMS;
}

/** Static OVA logos in client/public/images (ovalogo1 on hero, ovalogo2 on inner pages). */
function getLogoUrls(onHero) {
  const base = `${PUBLIC_URL}/images`;
  const name = onHero ? 'ovalogo1' : 'ovalogo2';
  const webp90 = `${base}/${name}-90w.webp`;
  const webp180 = `${base}/${name}-180w.webp`;
  const png = `${base}/${name}.png`;
  return {
    src: webp90,
    srcSet: `${webp90} 90w, ${webp180} 180w`,
    sizes: '90px',
    fallbacks: [png, `${base}/ova-logo.png`, `${base}/logo.png`],
  };
}

function applyLogoFallback(e, fallbacks) {
  const el = e.target;
  const tried = Number(el.dataset.fallbackIdx || 0);
  if (tried < fallbacks.length) {
    el.dataset.fallbackIdx = String(tried + 1);
    el.removeAttribute('srcset');
    el.removeAttribute('sizes');
    el.src = fallbacks[tried];
    return;
  }
  el.onerror = null;
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [onHero, setOnHero] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT);
  const location = useLocation();
  const { global: cmsGlobal } = useCmsGlobal();
  /* Canonical nav structure; CMS must not reorder or duplicate Connect/Donate links. */
  const navItems = useMemo(() => sanitizeNavItems(NAV_ITEMS), []);
  const donateLabel = cmsGlobal?.donateLabel || 'Donate Now';
  const connectLabel = cmsGlobal?.connectLabel || 'OVA Connect';
  const logoUrls = useMemo(() => getLogoUrls(onHero), [onHero]);

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
            onError={(e) => applyLogoFallback(e, logoUrls.fallbacks)}
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

const PROGRAM_ICONS = ['bi-briefcase', 'bi-people', 'bi-tree', 'bi-cpu'];
const MVV_ICONS = ['bi-bullseye', 'bi-globe-americas', 'bi-stars'];
const WHY_ICONS = [
  'bi-person-check',
  'bi-heart',
  'bi-globe-americas',
  'bi-people',
  'bi-trophy',
  'bi-lightning-charge',
];
import { pickImage, cmsImageUrl } from './imageUrl';

const SERVICE_ICONS = {
  Career: 'bi-briefcase',
  Community: 'bi-people',
  Climate: 'bi-tree',
  Technology: 'bi-cpu',
};

const DEFAULT_EVENT_TAG_ICON = 'bi-calendar-event';

/** Preserve hero `<em>` styling: CMS may send headlineParts, highlight field, or *markers* in heading. */
export function mapCmsHeadlineParts(slide, fallbackParts = []) {
  const base = Array.isArray(fallbackParts) ? fallbackParts : [];

  if (Array.isArray(slide?.headlineParts) && slide.headlineParts.length) {
    return slide.headlineParts.map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part === 'object') {
        const em = part.em || part.highlight || part.text || '';
        return em ? { em: String(em) } : '';
      }
      return '';
    }).filter((p) => p !== '');
  }

  const heading = (slide?.heading || slide?.title || '').trim();
  const highlight = (
    slide?.headingHighlight
    || slide?.highlight
    || slide?.headingEm
    || slide?.em
    || ''
  ).trim();

  if (!heading) return base;

  if (highlight) {
    const idx = heading.toLowerCase().indexOf(highlight.toLowerCase());
    if (idx >= 0) {
      const parts = [];
      const before = heading.slice(0, idx);
      const emText = heading.slice(idx, idx + highlight.length);
      const after = heading.slice(idx + highlight.length);
      if (before) parts.push(before);
      parts.push({ em: emText });
      if (after) parts.push(after);
      return parts.length ? parts : base;
    }
  }

  const markerMatch = heading.match(/\*\*([^*]+)\*\*/) || heading.match(/\*([^*]+)\*/);
  if (markerMatch) {
    const idx = heading.indexOf(markerMatch[0]);
    const parts = [];
    const before = heading.slice(0, idx);
    const after = heading.slice(idx + markerMatch[0].length);
    if (before) parts.push(before);
    parts.push({ em: markerMatch[1] });
    if (after) parts.push(after);
    return parts.length ? parts : base;
  }

  const emEntry = base.find((p) => typeof p === 'object' && p.em);
  if (emEntry?.em) {
    const idx = heading.toLowerCase().indexOf(String(emEntry.em).toLowerCase());
    if (idx >= 0) {
      const parts = [];
      const before = heading.slice(0, idx);
      const emText = heading.slice(idx, idx + emEntry.em.length);
      const after = heading.slice(idx + emEntry.em.length);
      if (before) parts.push(before);
      parts.push({ em: emText });
      if (after) parts.push(after);
      return parts;
    }
    const emWordCount = String(emEntry.em).trim().split(/\s+/).filter(Boolean).length;
    const words = heading.split(/\s+/).filter(Boolean);
    if (emWordCount > 0 && words.length > emWordCount) {
      const emText = words.slice(-emWordCount).join(' ');
      const before = words.slice(0, -emWordCount).join(' ');
      const parts = [];
      if (before) parts.push(`${before} `);
      parts.push({ em: emText });
      return parts;
    }
  }

  return [heading];
}

function formatEventDate(ev) {
  if (ev.dateLabel) return ev.dateLabel;
  if (ev.date) {
    try {
      return new Date(ev.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return String(ev.date);
    }
  }
  return '';
}

export function mapCmsHeroSlides(cmsSlides, fallbackSlides) {
  const slides = Array.isArray(cmsSlides) ? cmsSlides : [];
  if (!slides.length) return fallbackSlides;

  return slides.map((slide, i) => {
    const base = fallbackSlides[i] || fallbackSlides[0] || {};
    return {
      ...base,
      image: pickImage(slide) || base.image,
      eyebrow: (slide.eyebrow || slide.kicker || base.eyebrow || '').trim() || base.eyebrow,
      headlineParts: mapCmsHeadlineParts(slide, base.headlineParts),
      subtext: (slide.subheading || slide.body || slide.subtext || slide.description || base.subtext || '').trim() || base.subtext,
      tags: slide.tags ?? base.tags,
      btns: (() => {
        if (Array.isArray(slide.cta) && slide.cta.length) {
          return slide.cta.map((c) => ({
            label: c.label || c.text || 'Learn more',
            to: c.to || c.href || '/',
            primary: Boolean(c.primary),
            arrow: Boolean(c.arrow),
          }));
        }
        const primary = (slide.ctaLabel || slide.cta || '').trim();
        const secondary = (slide.ctaSecondaryLabel || slide.secondaryCta || '').trim();
        if (primary || secondary) {
          const btns = [];
          if (primary) {
            btns.push({
              label: primary,
              to: slide.ctaTo || slide.ctaHref || '/services',
              primary: true,
              arrow: true,
            });
          }
          if (secondary) {
            btns.push({
              label: secondary,
              to: slide.ctaSecondaryTo || slide.ctaSecondaryHref || '/donate',
              primary: false,
            });
          }
          return btns.length ? btns : base.btns;
        }
        return base.btns;
      })(),
    };
  });
}

export function mapCmsPrograms(cmsPrograms, fallbackPrograms) {
  const items = Array.isArray(cmsPrograms) ? cmsPrograms : [];
  if (!items.length) return fallbackPrograms;

  return items.map((p, i) => {
    const base = fallbackPrograms[i] || {};
    const id = p.id || String(i + 1);
    return {
      title: p.title || base.title,
      icon: p.icon || PROGRAM_ICONS[i] || 'bi-star',
      to: p.to || p.link || `/services/${id}`,
    };
  });
}

export function mapCmsMvvCards(cards, fallback) {
  const items = Array.isArray(cards) ? cards : [];
  if (!items.length) return fallback;
  return items.map((c, i) => ({
    icon: c.icon || MVV_ICONS[i] || 'bi-star',
    title: c.title || '',
    body: c.body || c.description || '',
  }));
}

export function mapCmsWhyFeatures(features, fallback) {
  const items = Array.isArray(features) ? features : [];
  if (!items.length) return fallback;
  return items.map((f, i) => ({
    icon: f.icon || WHY_ICONS[i] || 'bi-star',
    title: f.title || '',
    desc: f.body || f.desc || f.description || '',
  }));
}

export function mapCmsServiceCards(cmsCards, fallbackServices) {
  const cards = Array.isArray(cmsCards) ? cmsCards : [];
  if (!cards.length) return fallbackServices;

  return cards.map((card, idx) => {
    const base = fallbackServices.find((s) => String(s.id) === String(card.id))
      || fallbackServices[idx]
      || {};
    const tag = card.tag || card.category || base.category || 'Program';
    const bullets = Array.isArray(card.bullets) ? card.bullets : [];
    return {
      ...base,
      id: Number(card.id) || base.id || idx + 1,
      slug: card.slug || base.slug,
      number: String(idx + 1).padStart(2, '0'),
      icon: card.icon || SERVICE_ICONS[tag] || base.icon || 'bi-star',
      category: tag,
      title: card.title || base.title,
      desc: card.body || card.desc || base.desc,
      image: pickImage(card) || base.image,
      points: bullets.length
        ? bullets.map((text, i) => ({
            icon: base.points?.[i]?.icon || 'bi-check-circle',
            text: typeof text === 'string' ? text : text.text || '',
          }))
        : base.points,
      fullContent: Array.isArray(card.fullContent) && card.fullContent.length
        ? card.fullContent
        : base.fullContent,
    };
  });
}

export function mapCmsEventToCard(ev) {
  const id = ev._id || ev.sourceId || ev.id || ev.slug;
  const desc = Array.isArray(ev.desc) && ev.desc.length
    ? ev.desc
    : ev.description
      ? [ev.description]
      : [''];
  const tag = ev.tag || (Array.isArray(ev.categories) && ev.categories[0]) || 'Event';

  return {
    id,
    tag,
    tagIcon: ev.tagIcon || DEFAULT_EVENT_TAG_ICON,
    title: ev.title || '',
    date: formatEventDate(ev),
    month: ev.month || '',
    day: ev.day || '',
    time: ev.time || '',
    address: ev.address || ev.location || '',
    organization: ev.organization || 'OVA™',
    contact: ev.contact || ev.contactEmail || 'support@ova.ngo',
    image: pickImage(ev) || (Array.isArray(ev.images) && ev.images[0]?.url ? cmsImageUrl(ev.images[0].url) : ''),
    desc,
    highlights: Array.isArray(ev.highlights) ? ev.highlights : [],
  };
}

function firstSection(data) {
  const sections = data?.sections;
  return Array.isArray(sections) && sections[0] && typeof sections[0] === 'object'
    ? sections[0]
    : null;
}

/** Home may store copy under sections.hero, sections.programs, etc. */
function flattenNestedSections(data) {
  if (!data || typeof data !== 'object') return data;
  const sections = data.sections;
  if (!sections || typeof sections !== 'object' || Array.isArray(sections)) {
    return { ...data };
  }
  const out = { ...data };
  for (const [key, value] of Object.entries(sections)) {
    if (value == null) continue;
    if (key === 'hero' && typeof value === 'object' && !Array.isArray(value)) {
      out.hero = { ...(out.hero && typeof out.hero === 'object' ? out.hero : {}), ...value };
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Join benefits/roles/steps: CMS uses title + body; UI uses title + desc + icon from fallback. */
export function mapCmsTextCards(items, fallback, descKey = 'desc') {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return fallback;
  return list.map((item, i) => {
    const base = fallback[i] || {};
    const text = item.body || item[descKey] || item.desc || item.description || '';
    return {
      ...base,
      title: item.title || base.title || '',
      [descKey]: text || base[descKey] || '',
    };
  });
}

export function mapCmsTestimonials(items, fallback) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return fallback;
  return list.map((t, i) => ({
    quote: t.quote || t.body || fallback[i]?.quote || '',
    author: t.author || t.attribution || fallback[i]?.author || '',
  }));
}

export function mapCmsFaqs(items, fallback) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return fallback;
  return list.map((item) => ({
    q: item.q || item.question || '',
    a: item.a || item.answer || item.body || '',
  }));
}

export function mapCmsTaxCard(taxCard, fallback) {
  if (!taxCard || typeof taxCard !== 'object') return fallback;
  return {
    title: taxCard.title || fallback.title,
    paragraphs: Array.isArray(taxCard.paragraphs) && taxCard.paragraphs.length
      ? taxCard.paragraphs
      : fallback.paragraphs,
    implementingPartners: Array.isArray(taxCard.implementingPartners) && taxCard.implementingPartners.length
      ? taxCard.implementingPartners
      : fallback.implementingPartners,
  };
}

export function normalizeEventsPageCopy(data, defaults) {
  const d = data && typeof data === 'object' ? data : {};
  const heroSubtext = (d.heroSubtext || d.heroQuote || '').trim();
  return {
    heroHeading: d.heroHeading || defaults.heroHeading,
    heroSubtext: heroSubtext || defaults.heroSubtext,
    listHeading: d.listHeading || defaults.listHeading,
    listSubtitle: d.listSubtitle || defaults.listSubtitle,
  };
}

/** Align CMS API fields with what OVA_Web page components read. Mirrors server/lib/cmsPageNormalize.js */
export function normalizeSitePageData(slug, data, title = '') {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return data && typeof data === 'object' ? data : {};
  }

  let out = flattenNestedSections({ ...data });
  const pageTitle = (title || '').trim();
  const sec = firstSection(out);

  if (slug === 'terms' || slug === 'privacy' || slug === 'refund') {
    const html = (out.contentHtml || '').trim();
    if (html && !out.body) out.body = out.contentHtml;
    if (!out.heroHeading && pageTitle) out.heroHeading = pageTitle;
    if (!out.heroSubtext && out.introLead) out.heroSubtext = out.introLead;
    else if (!out.heroSubtext && out.lead) out.heroSubtext = out.lead;
  }

  if (slug === 'thankyou') {
    if (!out.heroHeading && out.heading) out.heroHeading = out.heading;
    if (!out.heroSubtext && out.message) out.heroSubtext = out.message;
  }

  if (slug === 'contact' || slug === 'join') {
    if (sec) {
      if (!out.heroHeading && sec.heading) out.heroHeading = sec.heading;
      if (!out.heroSubtext && sec.body) out.heroSubtext = sec.body;
    }
  }

  if (slug === 'contact') {
    if (!out.mapHeading && out.mapTitle) out.mapHeading = out.mapTitle;
    if (Array.isArray(out.faqs) && out.faqs.length && !out.faqItems?.length) {
      out.faqItems = out.faqs.map((item) => ({
        q: item.q || item.question || '',
        a: item.a || item.answer || '',
      }));
    }
  }

  if (slug === 'donate') {
    if (!out.heroHeading && pageTitle) out.heroHeading = pageTitle;
    if (!out.heroSubtext && out.quote) out.heroSubtext = out.quote;
    if (!out.heroQuoteAuthor && out.quoteAuthor) out.heroQuoteAuthor = out.quoteAuthor;
    if (sec) {
      if (!out.bankHeading && sec.heading) out.bankHeading = sec.heading;
      if (!out.bankBody && sec.body) out.bankBody = sec.body;
    }
  }

  if (slug === 'about') {
    if (!out.heroQuote && out.heroSubtext) out.heroQuote = out.heroSubtext;
    if (!out.heroButtonLabel && out.ctaLabel) out.heroButtonLabel = out.ctaLabel;
    if (!out.heroCtaLabel && out.heroButtonLabel) out.heroCtaLabel = out.heroButtonLabel;
  }

  if (slug === 'join' && !out.heroCtaLabel && out.heroButtonLabel) {
    out.heroCtaLabel = out.heroButtonLabel;
  }

  return out;
}

const SOCIAL_ICON_BY_LABEL = {
  facebook: 'bi-facebook',
  instagram: 'bi-instagram',
  linkedin: 'bi-linkedin',
  youtube: 'bi-youtube',
};

function mapNavbarLink(item, index) {
  if (!item || typeof item !== 'object') return null;
  if (item.type === 'dropdown' || Array.isArray(item.items)) {
    const label = (item.label || '').trim();
    const key =
      item.key
      || (label.toLowerCase() === 'about' ? 'about' : label.toLowerCase() === 'events' ? 'events' : `dropdown-${index}`);
    return {
      type: 'dropdown',
      key,
      label,
      icon: item.icon || 'bi-chevron-down',
      items: (item.items || []).map((sub) => ({
        path: sub.path || sub.to || '/',
        label: sub.label || '',
      })),
    };
  }
  return {
    type: 'link',
    path: item.path || item.to || '/',
    label: item.label || '',
    icon: item.icon || 'bi-link',
  };
}

/** Map GET /api/public/global → Navbar + Footer (mirrors server/lib/cmsPageNormalize.js). */
export function normalizeCmsGlobal(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const g = { ...raw };
  const navbar = g.navbar && typeof g.navbar === 'object' ? g.navbar : {};
  const footer = g.footer && typeof g.footer === 'object' ? g.footer : {};

  if ((!g.navItems || !g.navItems.length) && Array.isArray(navbar.links) && navbar.links.length) {
    g.navItems = navbar.links.map(mapNavbarLink).filter(Boolean);
  }
  if (navbar.donateLabel) g.donateLabel = navbar.donateLabel;
  if (navbar.connectLabel) g.connectLabel = navbar.connectLabel;

  if (!g.address && footer.contactAddress) g.address = footer.contactAddress;
  if (!g.phone && footer.contactPhone) g.phone = footer.contactPhone;
  if (!g.email && footer.contactEmail) g.email = footer.contactEmail;
  if (!g.footerAbout && footer.aboutText) g.footerAbout = footer.aboutText;
  if (!g.footerAboutHeading && footer.aboutHeading) g.footerAboutHeading = footer.aboutHeading;
  if (!g.contactHeading && footer.contactHeading) g.contactHeading = footer.contactHeading;
  if (!g.newsletterHeading && footer.newsletterHeading) g.newsletterHeading = footer.newsletterHeading;
  if (!g.newsletterText && footer.newsletterText) g.newsletterText = footer.newsletterText;

  const socialSource = Array.isArray(g.socials) && g.socials.length ? g.socials : footer.socials;
  if (Array.isArray(socialSource) && socialSource.length) {
    g.socials = socialSource.map((s) => {
      const label = (s.label || '').toLowerCase();
      let icon = s.icon;
      if (!icon) {
        for (const [name, bi] of Object.entries(SOCIAL_ICON_BY_LABEL)) {
          if (label.includes(name)) {
            icon = bi;
            break;
          }
        }
      }
      return {
        ...s,
        icon: icon || 'bi-globe',
        href: s.href || s.url || '#',
        label: s.label || '',
      };
    });
  }

  return g;
}

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
    const heading = (slide.heading || slide.title || '').trim();
    return {
      ...base,
      image: pickImage(slide) || base.image,
      eyebrow: slide.eyebrow || slide.subheading || base.eyebrow,
      headlineParts: heading ? [heading] : base.headlineParts,
      subtext: slide.subheading || slide.body || slide.subtext || base.subtext,
      btns: Array.isArray(slide.cta) && slide.cta.length
        ? slide.cta.map((c) => ({
            label: c.label || c.text || 'Learn more',
            to: c.to || c.href || '/',
            primary: Boolean(c.primary),
            arrow: Boolean(c.arrow),
          }))
        : base.btns,
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

/** Align CMS API fields with what OVA_Web page components read (legal, contact, thankyou, etc.). */
export function normalizeSitePageData(slug, data, title = '') {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return data && typeof data === 'object' ? data : {};
  }
  const out = { ...data };
  const pageTitle = (title || '').trim();
  const firstSection =
    Array.isArray(out.sections) && out.sections[0] && typeof out.sections[0] === 'object'
      ? out.sections[0]
      : null;

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
    if (firstSection) {
      if (!out.heroHeading && firstSection.heading) out.heroHeading = firstSection.heading;
      if (!out.heroSubtext && firstSection.body) out.heroSubtext = firstSection.body;
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

  return out;
}

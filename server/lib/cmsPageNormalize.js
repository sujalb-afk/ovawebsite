/**
 * Map CMS-OVA published page.data → fields OVA Web React pages read.
 * Keep in sync with client/src/utils/cmsMappers.js normalizeSitePageData().
 */

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

function normalizeSitePageData(slug, data, title = '') {
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

module.exports = {
  normalizeSitePageData,
  flattenNestedSections,
  firstSection,
};

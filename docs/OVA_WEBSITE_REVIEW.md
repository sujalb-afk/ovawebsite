# OVA Website Review — What You Can Do Better

*Review based on the [OVA Website Design Guide](OVA_WEBSITE_DESIGN_GUIDE.md) and NGO best practices. Scope: Home, About Us, Services, Events.*

---

## 1. Align everything to the four objectives

Your design guide defines **four objectives**. The site should name them clearly and map all content to them:

1. **Sustainability awareness and mitigation**
2. **AI awareness and training**
3. **Job Readiness Programs**
4. **Charity services to the underprivileged rural students**

**What to do better:**

- **Home — Programs grid:** The four cards are close but not identical. Consider labelling them exactly as the four objectives (e.g. "Sustainability awareness & mitigation", "AI awareness & training", "Job Readiness Programs", "Charity for rural students") and linking each to the relevant section on Services or About.
- **Home — Services section:** You show six service cards. Consider grouping or renaming so the **four pillars** are obvious (e.g. one card per objective, with sub-points if needed). Right now "AI awareness and training" is mixed into "Computer Literacy and Cyber Security" and "Charity / rural students" is not a clear, separate block.
- **Services page:** Structure the page into **four main sections** (one per objective). Each section: what it is, who it’s for, what you do, and a CTA (Donate / Join / Learn more). Today you have six items; collapsing or reframing into four will make the message clearer.

---

## 2. Mission and clarity (above the fold)

**What’s good:** Hero has a clear headline and one main CTA (Donate Now). Slider and no overlay keep focus.

**What to do better:**

- Add a **one-line mission** in the hero (e.g. under the headline): e.g. *"OVA is a tech-driven NGO advancing sustainability, AI literacy, job readiness, and support for rural students."* So in ~5 seconds visitors know who you are and the four focus areas.
- On **About** and **Services**, add a short mission line near the top (e.g. "We focus on four areas: …") so every page reinforces the same story.

---

## 3. Trust and impact

**What’s good:** Stats (25+ volunteers, 300+ children, etc.) and testimonials are in place.

**What to do better:**

- **Impact numbers:** Where possible, tie numbers to the four objectives (e.g. "X students supported in rural areas", "Y people trained in AI/digital literacy", "Z sustainability events"). Even approximate numbers build trust.
- **Testimonials:** Change the section heading from "Client feedbacks" to something like "What people say" or "Stories from the community." Optionally tag each quote by objective (e.g. "Sustainability", "Job readiness") so visitors see impact per pillar.
- **About page:** Add **where** you work (e.g. Kolhapur, Maharashtra) and **who** you serve (e.g. rural students, volunteers, communities). A short "Where we work" or "Our reach" line helps credibility.

---

## 4. Services page — four pillars, not six

**What to do better:**

- **Reduce to four blocks** (or four clearly labelled sections):
  1. **Sustainability awareness and mitigation** — tree planting, waste management, climate education, etc.
  2. **AI awareness and training** — digital literacy, AI basics, ethics, cyber safety (can sit under this pillar).
  3. **Job Readiness Programs** — who it’s for (e.g. youth, women, recovering individuals), what you offer, how to join or refer.
  4. **Charity services to underprivileged rural students** — what support (e.g. education, materials, mentorship), who is eligible, how to apply or donate for this.
- Keep "Join Hands" / "Volunteer, Donate" as a **single CTA block** (e.g. at the end or in the sidebar), not as a fifth “service”.
- For each pillar: **who it’s for**, **what you do**, and **one primary CTA** (Donate / Join / Contact).

---

## 5. Events page

**What’s good:** Event cards with title, date, time. Clear "Join us" messaging.

**What to do better:**

- **Tag each event with an objective** (e.g. badge or label: "Sustainability", "AI & digital", "Job readiness", "Rural education") so visitors see how events support the four pillars.
- **Participation:** Add a short line on *how* to join (e.g. "Register via Contact" or "Email us to volunteer") and, if possible, a link/button to register or contact.
- **Dates:** Events are Oct–Nov 2024; update to upcoming dates or add a note like "Past events" vs "Upcoming" so the page doesn’t feel outdated.

---

## 6. Copy and consistency

**What to do better:**

- Use the **same terms** for the four objectives everywhere (Home, About, Services, Events). Avoid mixing "Social Services", "Community Outreach", "Computer Literacy" without tying them to "Sustainability", "AI awareness & training", "Job Readiness", "Charity for rural students".
- **About — "Why choose us":** Relate each point to the four objectives or to impact (e.g. "We run job readiness programs for…", "Our sustainability initiatives…") so it doesn’t feel generic.

---

## 7. Accessibility and UX

**What to do better:**

- Ensure **hero slider** has a pause/play or visible controls so users who need more time can stop auto-advance (you already have dots; consider pausing on focus or adding a pause button).
- Use **semantic headings** in order (one `h1` per page, then `h2`/`h3`) so screen readers and SEO get a clear outline.
- Check **contrast** on the green CTA buttons and white text on hero images (you added text-shadow; verify on real devices).

---

## 8. If you use Stitch later

Once Stitch MCP is connected and working, you can:

- Use **extract_design_context** on your current hero or key screens to capture your "design DNA" (colours, type, spacing).
- Use **generate_screen_from_text** to draft new sections (e.g. "Four pillars section with cards for Sustainability, AI, Job Readiness, Rural students") and then adapt the code to your stack.
- Use **fetch_screen_code** / **fetch_screen_image** to pull layout or asset ideas and align new UI with your guide.

---

## Quick checklist

| Area | Action |
|------|--------|
| **Four objectives** | Name them on Home, About, Services; structure Services in four sections. |
| **Mission line** | One sentence in hero (and top of About/Services) stating the four focus areas. |
| **Impact** | Tie stats/testimonials to objectives; add location (e.g. Kolhapur) and "who we serve". |
| **Services** | Four pillars + one CTA block; each pillar: who, what, CTA. |
| **Events** | Tag events by objective; clarify how to join; update or label past vs upcoming. |
| **Copy** | Same terminology across pages; "Why choose us" tied to objectives. |
| **A11y / UX** | Slider pause option; heading order; contrast check. |

Focusing on these will make the site clearer, more trustworthy, and aligned with your four objectives. If you want, we can implement these step by step (e.g. starting with Home mission line and Services four-pillar structure).

# CMS API Integration Plan

This plan details the steps required to complete the first-time CMS integration for the remaining pages of the `ova.ngo` React application. Previous work has already established the `cmsProxy` backend routes, the `useCmsPage` hook, and successfully integrated the CMS into `Home`, `About`, `Services`, and `Events` pages. We will extend this to all remaining routes as specified.

## User Review Required

- Ensure that any hardcoded strings currently in the remaining components accurately reflect the fallback text we should preserve when the CMS returns `null` or is disabled.
- Please confirm if `Navbar` and `Footer` components are globally wrapping the pages (e.g., inside `App.js`), as this determines how we fetch and pass the global CMS data to them.

## Open Questions

1. Should `EventDetail.js`, `GalleryDetail.js`, and `ServiceDetail.js` use `useCmsEvent()`, `useCmsGalleryItem()`, and `useCmsService()` respectively to fetch their individual content based on the `:id` param? (The prompt table mentions `GET /api/public/events/:id` and `GET /api/public/services/:id`). I will implement hooks for these if they don't exist in `useCms.js`.
2. Do we need to update the `README.md` with instructions for running the CMS locally, or is it already updated? (I'll check this and update it if missing).

## Proposed Changes

### client/src/hooks/useCms.js
- Ensure `useCmsEvent` and `useCmsService` are correctly implemented.
- Add `useCmsGallery` and `useCmsGalleryItem` hooks if they do not exist, mapping to `fetchCmsGallery()` / `GET /gallery`.
- Add `useCmsGlobal` to fetch the layout data (Navbar/Footer).

### client/src/components/Navbar.js & Footer.js
- **[MODIFY] Navbar.js**: Integrate `useCmsGlobal()` to retrieve global navigation data, while keeping fallback arrays.
- **[MODIFY] Footer.js**: Integrate `useCmsGlobal()` for footer links and copy.

### client/src/pages
- **[MODIFY] Gallery.js**: Integrate `useCmsPage("gallery")` + `useCmsGallery()`.
- **[MODIFY] Team.js**: Integrate `useCmsPage("team")` + dynamic team list fetch if applicable.
- **[MODIFY] Contact.js**: Integrate `useCmsPage("contact")`.
- **[MODIFY] Join.js**: Integrate `useCmsPage("join")`.
- **[MODIFY] Donate.js**: Integrate `useCmsPage("donate")`.
- **[MODIFY] ThankYou.js**: Integrate `useCmsPage("thankyou")`.
- **[MODIFY] Terms.js**: Integrate `useCmsPage("terms")`.
- **[MODIFY] Privacy.js**: Integrate `useCmsPage("privacy")`.
- **[MODIFY] Refund.js**: Integrate `useCmsPage("refund")`.
- **[MODIFY] EventDetail.js**: Integrate dynamic fetch for single event.
- **[MODIFY] GalleryDetail.js**: Integrate dynamic fetch for single gallery item.
- **[MODIFY] ServiceDetail.js**: Integrate dynamic fetch for single service.

### README.md
- **[MODIFY] README.md**: Add a short section explaining how to run locally against `http://localhost:5000` vs `ngrok` for the CMS API.

## Verification Plan

### Automated Tests
- Run `npm run preview` in the `client` directory or check the Vite build to ensure no React errors.

### Manual Verification
- Test all modified routes (`/contact`, `/donate`, `/gallery`, `/team`, etc.) in the browser or via API to ensure that they gracefully fallback to static content if the CMS is unavailable.
- Ensure that the dynamic data fetching logic preserves existing form and UI functionality.

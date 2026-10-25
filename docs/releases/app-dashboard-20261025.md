# GTH PRO app dashboard — 25 October 2026

The owner supplied app-screen references and requested a dedicated app experience with large service icons, category navigation and automatic promotional banners. The existing /app PWA now has its own dashboard, reusing approved GTH design tokens, booking flows and public discovery data. This is not an APK/AAB/IPA or store publication.

- Compact masthead reuses the exact approved website logo-motion asset/component and GTH PRO identity, replacing the inconsistent wide wordmark in app headers.
- Four service categories (All, Travel, Property, Tenders), 14 fixed service destinations, a service search and expandable icon grid. Core services keep their app routes; existing website/provider tools retain their established destinations and authentication rules.
- Editorial service banners rotate every 6 seconds while visible, with next/previous, touch swipe and pause controls. Rotation pauses for focus/hover, hidden tabs and offscreen content, and is disabled for reduced motion. These are GTH service promotions, without invented discounts, availability, revenue or paid-ad claims.
- Category-filtered source-backed destination/hotel/property/tender rails, installation guidance and the existing fixed five-tab navigation remain. Whole-page automatic scrolling is not introduced.
- No new database/API credentials, ad network, auth permissions, global CSS or protected Real Estate changes. PR #131 flight/hotel width and service fixes are retained.

Validation: regression tests plus service-filter behavior tests; strict TypeScript/lint; 138-page production build. Browser checks cover five screen widths (360/390/430/768/1440), large touch targets, all categories, service search, More expansion, banner controls/autoplay/pause/reduced motion, matching circular brand, day/night and no document overflow. No physical OS installation, supplier checkout or payment claim.

Release: one Git→Vercel merge after exact-head CI, with branch previews disabled. Rollback reference is main 66d14fdf84c2254dfe4add505f4c004605f465da, production dpl_EjA2GdyMtVptgFPDGLUDrVMwzraP.

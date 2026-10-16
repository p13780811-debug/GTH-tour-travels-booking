# GTH PRO Global — Production SEO & Search Console Runbook

**Verified production hostname:** `https://www.gthproglobal.com`  
**Apex:** `https://gthproglobal.com` permanently redirects to `https://www.gthproglobal.com` (Vercel HTTP 308).  
**Project:** existing `gth-pro` on Vercel team `etios-profession`; source repo `p13780811-debug/GTH-tour-travels-booking`.  
**Preview/testing alias:** `https://gth-pro.vercel.app` (not a search canonical).  
**Last technical domain review:** 17 October 2026.

## Launch contract

- Production indexing is explicitly controlled by `GTH_PUBLIC_LAUNCH_ENABLED=true` in **Vercel Production only**, together with `VERCEL_ENV=production`. This variable was created in Vercel on 17 October 2026. It is not enabled for Preview or Development.
- A **new successful production build and deployment** is required after changing the variable; updating the environment setting alone does not replace a deployed build's metadata.
- On a released production build, `siteOrigin()` resolves to `https://www.gthproglobal.com` across metadata, Open Graph, canonical URLs, JSON-LD, `robots.txt` and `sitemap.xml`. Preview builds remain `noindex` with the non-production origin.
- Do not rewrite the global design, approved Real Estate pages or live travel partner scripts to perform SEO launch work.
- Continue to exclude account/private routes, mobile app shell, internal search/results and affiliate redirect routes from organic discovery. A `robots.txt` exclusion is **not** a replacement for access control or `noindex` on sensitive pages.
- Only put existing, substantive, publicly accessible pages into the XML sitemap. Do not bulk index unverified inventory, invented offers or low-quality generated pages.

## Production verification

After the final production release, inspect the following publicly without login:

1. `https://www.gthproglobal.com/` responds successfully and has a canonical link to `https://www.gthproglobal.com/` (or equivalent normalized slash). Its robots meta directive must allow indexing and following.
2. `https://gthproglobal.com/` permanently redirects to the same `www` hostname without a redirect loop.
3. `https://www.gthproglobal.com/robots.txt` allows public pages, disallows private/transactional discovery and declares `Sitemap: https://www.gthproglobal.com/sitemap.xml`.
4. `https://www.gthproglobal.com/sitemap.xml` contains the actual public landing pages and published editorial URLs, not an empty XML urlset. Inspect each submitted URL for 200 responses, correct canonical and non-`noindex` content.
5. Check `/travel`, `/real-estate`, `/tender`, `/blog`, `/destinations` and key legal/contact pages on mobile and desktop. Verify forms, affiliate handoffs and legitimate content remain functional.

## Google Search Console ownership verification — user Google account needed

Google Search Console ownership is separate from domain verification in Vercel and **cannot** be assumed from the production DNS/SSL status.

1. Sign into `https://search.google.com/search-console/welcome` with the Google account that should own GTH PRO search data.
2. Add a **Domain property** with exactly `gthproglobal.com` (no protocol and no `www`). The Domain property covers both apex and `www`.
3. Copy the unique DNS **TXT** record supplied by Google; it begins with `google-site-verification=`. Do not invent a token.
4. In the DNS provider that hosts the authoritative zone (currently Vercel DNS), add a TXT record to the root (`@` or blank host per provider form) with that exact value. Do **not** replace existing ALIAS/CAA/other DNS records.
5. After DNS propagation, click **Verify** in Search Console. Preserve the verification TXT record.
6. In **Sitemaps**, submit `https://www.gthproglobal.com/sitemap.xml` only after it is nonempty and publicly fetchable.
7. Use **URL Inspection** on the homepage, travel hub, real estate landing page, tender hub and a few genuine destination/editorial pages. Check Google-selected canonical and indexing status; request indexing selectively when helpful.
8. Review Pages indexing, HTTPS, Core Web Vitals, queries/clicks and mobile usability as data becomes available. Set up GA4 independently using an actual measurement ID and appropriate privacy/consent controls, if desired.

## Search-quality safeguards

- Use factual Organization/WebSite information and legitimate editorial, destination, hotel, tour and property metadata. No invented ratings, partners, prices, availability, testimonials or legal identities.
- Do not automatically add thousands of unverified property records or thin supplier pages to the sitemap. Validate publication state, data accuracy, content uniqueness and source permissions first.
- Maintain consistent titles, descriptions, internal links and HTTPS canonicals; do not keyword-stuff or duplicate content to manufacture city pages.
- A sitemap helps Google discover URLs; Search Console submission, ownership verification and schema markup **do not guarantee indexing or ranking**.
- Keep testing aliases and preview builds out of Google's index.

**Release blocker protocol:** If Vercel refuses new builds due to a build-rate limit, keep the currently working production deployment intact, record the exact error, and do not claim the SEO release is live. After capacity is available, deploy the already-tested release and rerun the public verification checks.

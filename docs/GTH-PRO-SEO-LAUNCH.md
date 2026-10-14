# GTH PRO Global — SEO Launch Runbook
**Reserved brand decision (NOT purchased):** `gthproglobal.com`
**Existing testing origin:** `https://gth-pro.vercel.app`
**Scope:** global Travel, Real Estate and Tender discovery; business identity and affiliate transparency.
**Status:** preparation only; Google indexing stays disabled until explicitly authorised.

## SEO release contract
- `GTH_PUBLIC_LAUNCH_ENABLED` is deliberately not enabled. Production pages remain meta `noindex`; public read/crawl access can still support affiliate reviewers. Preview deployments must never be indexed.
- All metadata, Open Graph, JSON-LD, dynamic canonicals, `robots.txt` sitemap links and XML sitemap origin choose `gthproglobal.com` **only after the production launch flag is explicitly enabled**.
- Until then, previews consistently reference `gth-pro.vercel.app`. Never point canonical metadata to an unpurchased or unconnected domain.
- One indexable destination per duplicate content group: `/activities` canonicalises to `/tours`. Search and filter results, private dashboards and unsupported inventory variants stay out of the XML sitemap.
- No fictitious legal entity, office, reviews, partner status, ratings, fares, author identities or launch dates should appear in schema or SEO copy.

## When the domain is purchased (not today)
1. Register `gthproglobal.com` in the *correct* Vercel team only after checking registration price, renewal, WHOIS registrant and auto-renew. Never buy without final explicit approval.
2. In the **existing** Vercel `gth-pro` project, add the apex `gthproglobal.com` and optional `www.gthproglobal.com`. Follow Vercel DNS verification instructions exactly. Check certificate/HTTPS and that the approved homepage and all three pillars work on the domain.
3. Make `gthproglobal.com` the primary production hostname. Configure HTTPS permanent redirects for `www` to the primary hostname. Keep `gth-pro.vercel.app` as an accessible testing alias or use a verified, permanent redirect to the primary when fully ready. Do not break API or preview routes.
4. Recheck travel search, forms and private security endpoints, Real Estate property pages, tender reference links, ad destinations, mobile UI, analytics consent, Core Web Vitals and booking handoffs; remove any unverified launch claims before indexing.
5. In the Vercel **Production** environment only, add `GTH_PUBLIC_LAUNCH_ENABLED=true`; do **not** add it to Preview or Development. Redeploy production after verification. Confirm public pages emit `index,follow`, sitemap lists primary-domain URLs and robots points to `https://gthproglobal.com/sitemap.xml`. Private/profile/search paths must stay `noindex`.
6. Verify the new domain in Google Search Console via DNS. Submit `https://gthproglobal.com/sitemap.xml` only after step 5. Use URL Inspection for homepage, `/travel`, `/real-estate`, `/tender`, one real destination, one genuine editorial blog, and one legitimate property detail. Check canonical selected by Google, crawl status, excluded URLs and any enhancements.
7. Set up Google Analytics/consent as appropriate. Observe GSC performance, crawl/index coverage, Core Web Vitals and broken URLs. Improve real editorial information, internal navigation, mobile performance and trust pages based on measured data—not invented SEO keywords or spam pages.
8. Monitor DNS, SSL, sitemap validity, robots, redirect loops and broken affiliate handoffs. Review every published content source and supplier usage licence.

## Technical scope and limits
- Public page categories have per-route metadata/canonicals; article and destination pages have factual JSON-LD. Home has WebSite/Organization identity using official contact details.
- Dynamic hotel-city and tour pages only point to their own canonical paths when valid. Unknown hotel variants must not be indexed.
- Property detail metadata and the Real Estate layout obey **the same launch flag**. No property can override beta `noindex`.
- Submission, profile, saved, search results, tender assistant and admin pages are not intended as search landing pages. Tender notice details remain `noindex` until an editorial/public-data quality review.
- Rankings and rich results are **not guaranteed** by metadata, backlinks, structured data, or buying a domain. Google discovery and indexing can take time after site verification.
- The website design, Real Estate UI and all CSS assets are outside scope. No manual CSS edits required.

## SEO readiness checklist before enabling indexing
- [ ] Domain registered and attached with verified SSL and primary-hostname strategy
- [ ] Core URLs load successfully (including mobile and without authenticated session)
- [ ] All public links, external affiliates, lead/enquiry submissions and booking handoffs tested
- [ ] Proper title/description, canonical/OG and crawlable textual content on published pages
- [ ] No duplicate-content aliases in public sitemap; no invented structured-data claims
- [ ] Live inventory/source licences confirmed; company/operator/contact info consistent
- [ ] Google Search Console property verified and sitemap submitted
- [ ] Launch environment variable switched on **only with explicit approval**
- [ ] Post-launch redirects, index coverage, Core Web Vitals and broken-link monitoring active

Do not purchase a domain, enable indexing, remove noindex, or edit visual design as part of this preparation work.

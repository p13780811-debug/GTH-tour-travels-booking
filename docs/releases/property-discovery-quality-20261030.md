# Property discovery and seller-control upgrade

This batch builds on the already deployed property workspace. It preserves existing registry/marketplace separation, approved-media gates, claims, submissions, enquiries, financial tools, comparisons, private offers and the sticky mobile CTA. No CSS file, credentials, paid resource, importer or ingestion schedule changes. One main merge triggers the normal production deployment; feature-branch deployments remain disabled.

## Competitor audit

Official references reviewed 30 October 2026:

- Zillow advanced discovery: https://www.zillow.com/learn/zillow-advanced-search/ — bathrooms, square footage, listing types, media, saved searches and account continuity.
- Zillow hide homes: https://www.zillow.com/news/a-top-requested-new-zillow-feature-lets-shoppers-hide-homes-theyve-ruled-out/ — reversible suppression of ruled-out homes.
- Magicbricks filters: https://www.magicbricks.com/help/category-content-detail/how-do-i-narrow-refine-or-filter-my-search — area, ownership/transaction characteristics and amenities.
- JamesEdition discovery: https://help.jamesedition.com/en/how-do-i-find-properties-on-jamesedition — area, rooms, tours and feature filters.
- JamesEdition professional services: https://www.jamesedition.com/professional_seller/real_estate — seller workflow and performance tools.

The meaningful gaps that can be addressed with existing recorded inventory are implemented below. Proprietary valuations, school/commute data, payments, professional fulfillment, email/push delivery and external CRM integrations are not claimed operational without their real data/configuration/providers. Furnishing and amenities are not inferred from old registry or generated seed fields.

## Delivered flows

1. Same-unit advanced search: minimum bathrooms, minimum/maximum area, explicit carpet/built-up/plot basis, stated submitter role, publication age (7/30/90 days), units actually marked verified and projects with a current reviewed virtual-tour link. Unknown fields do not count as matches. Area limits require a basis; no hidden conversion or FX. All existing filters remain. Duplicate supported URL parameters fail before DB work. Saved searches preserve and label the new filters.
2. Browser-specific hide/restore: ruled-out homes disappear from both current grid and map, with an accessible restore list. Preferences are bounded to 200 public references and 90 days, not uploaded to an account or used to alter server pagination. Visible-versus-returned counts explain suppressed results. Shortlists remain independent.
3. Seller own-listing dashboard: latest 100 units owned by the authenticated account, public fields only, including their withdrawn units. Formula-safe CSV export contains only these loaded units. A seller can withdraw an owned published unit after an explicit UI warning. Client grants cannot change price, ownership, verification or publish/reinstate a unit. Watch subscribers receive a private off-market update identifying the project/unit.
4. Private property issue reporting: a project-specific support brief is sent to the existing administrator queue. Reports do not automatically hide someone else's listing or imply a resolution. Existing private support responses/inbox keep working.
5. Sign-in continuity: a strict same-origin workspace return allowlist preserves selected project/unit/service context. External redirects, duplicate keys, control/backslash tricks and unrelated paths are rejected. Account changes clear previous account submission data and stale responses.
6. Usability corrections: the drawn-region map moves out of the narrow filter sidebar into the main results area; all original filter controls remain. Read-only market research says Researching/Research completed rather than claiming to save records.
7. Sale asking-price per area: exact ft²/m² conversion shown only when a valid asking price, area and recorded basis exist. No monthly rent period or valuation is inferred.

## Verification

Pure tests cover advanced parser/saved filters, bounded/expiring hidden preferences, redirect attacks, CSV formula/quote/line safety, area-rate arithmetic, truthful form labels and strict withdrawal/report contracts. Full repository tests, TypeScript, ESLint and production build run before release.

Rollback SQL fixtures test existing workspace privacy plus actual advanced RPC matches and false-match rejection, area-basis requirements, unrelated-account withdrawal denial, owner verification denial, owner withdrawal visibility, inability to self-republish and subscriber off-market notices. Test users/inventory/evidence are always rolled back. GitHub runs both old and new SQL fixtures in disposable PostgreSQL before main is updated.

Live QA verifies public filters, map placement, sign-in boundary/context, hide/restore using actual public project references, report routing and truthful empty evidence states. It does not claim a physical Android test, real seller withdrawal or signed-in seller CSV download when no owned production inventory is available.

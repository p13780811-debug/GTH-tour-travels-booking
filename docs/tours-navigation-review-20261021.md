# Tours discovery and travel navigation review

Based on release PR #121 at `ced80d13d59f6dd33bb8970683faea0c419d9283`. Changes stay in the single staged release; production/main and its audience are unchanged.

## Findings and behavior

A read-only production query found 110 legacy tour rows and zero rows meeting BOTH public publication and media approval. This explains the empty Tours result; it is not proof a destination is sold out. No publication flag, permission or database row has been changed.

The default Tours/Activities page now keeps existing partner links, six useful category choices, destination-specific direct Klook search and community-mapped place discovery available when individual offers are not published. Direct searches are clearly separate from existing affiliate program links. They do not invent inventory, rates, dates, reviews or affiliate identifiers.

Reviewed records retain the two publication gates and a narrow public DTO. Added Unicode destination validation, city/slug matching, server-side stable sorting, exact public counts and bounded 24-record pagination. Price filtering and price sorting use one chosen currency. Invalid inputs, empty matches, missing backend configuration and data errors have distinct recovery behavior. Existing API array responses remain compatible, with pagination headers added. Activities searches and resets retain the Activities route.

The travel category rail is no longer rendered above page children by 12 category layouts. It appears after the actual hero/intro/photo area in travel landing pages, details, shared guides, transport pages and Tours loading. The global navbar remains intact. Redundant Hotel and Travel-home rails are removed; flight categories are consolidated into the shared rail while the flight-search anchor stays available. All existing category links are retained, with Insurance added to the shared rail. No DOM reparenting, portal, second theme or global CSS rewrite is used.

## Checks

New functional regression fixtures cover Unicode/input boundaries, publication gates on every count/row request, narrow DTOs, single-currency prices, stable pagination, exhausted pages, empty/error separation, safe internal navigation, fixed-host provider search and rendered empty/invalid search summaries. Updated route/source contracts follow the extracted shared Tours renderer. Full TypeScript, test suite, lint and optimized build must pass at the final head before integration.

The local execution environment and browser became unavailable while resuming. Do not describe earlier uncommitted edits, CI validation or browser/mobile checks as completed until actual evidence is available. GitHub CI provides the build/test evidence. Actual browser interactions, phone-width visual review and independent provider checkout remain unverified.

## Release boundaries

No Real Estate/Tender implementation, global CSS, shared navbar/footer/policies, secrets, supplier license, public inventory or database migration is changed by this contribution. Existing SmartSynergy integration is preserved. Feature and release previews stay disabled. Integrate this contribution into PR #121 after checks, without a separate production deployment. Existing migration/storage/owner-release gates for the combined release remain independent.

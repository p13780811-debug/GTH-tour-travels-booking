# GTH PRO — Mumbai Market Intelligence (isolated research)

## Scope

Public research route: `/real-estate/market-intelligence`. Full input is the Kaggle dataset *Mumbai Real Estate Sales and Rentals 2020–2026*, version 1, creator Sergey Nefedov. It contains **model-generated** individual listings; despite actual station/locality reference points, its 50,000 sale, 25,000 rental, and 12,000 under-construction rows are **not real available inventory**. Data extends to **April 2026**, so do not call it a live feed or a verified 2026 price index.

`src/data/market-intelligence/mumbai-research.json` contains only immutable aggregated research: 84 locality-level 76-month synthetic price time series, 1,237 2025–2026 segment/BHK synthetic percentile summaries, and 75 source-supplied station references. No raw apartment listing, generated RERA reference, generated project listing, broker contact, or fake inventory is published. React page and helpers read the bundled JSON without querying or modifying Supabase.

**Visible disclaimer**: simulated inputs and bands, unverified transit references, no transaction prices, no investment advice, not official valuations. A quoted model percentile band is not an error bar or confidence interval. Do not use these values to update `public.properties`, live listing cards, MahaRERA status, or verified real estate pricing.

## Model scenario

With selection `(locality, segment, 1..5 bedrooms, carpet area 150..10,000 sqft)`, choose the 2025–2026 aggregated synthetic profile for that BHK; use the locality/segment pooled profile only where a BHK profile has fewer than 5 observations. Multiply the 25th/50th/75th simulated INR per-carpet-sqft values by area; rental outputs are INR/month. This is a **descriptive generated-data estimator**, not trained/validated against real sales, not a property-specific prediction. No reported performance metric (accuracy, MAPE, etc.) is claimed.

## Provenance and license

Original dataset: https://www.kaggle.com/datasets/sergionefedov/mumbai-real-estate-sales-and-rentals-2020-2026/versions/1

The submitted machine-readable dataset metadata labels its license **Apache 2.0**, while its prose description states **CC0**; retain attribution, follow the stricter Apache notice terms provisionally, and independently resolve the discrepancy before expanded redistribution or publication. The bundled data is a transformed aggregation of the supplied dataset, not a scraped listing feed. Source's claimed geographic anchors are unverified for operations/navigation.

## Refresh and release

Publication is disabled by default. The route returns 404 unless the server-only
`GTH_MARKET_RESEARCH_ENABLED=true` flag is deliberately configured after the
source licensing discrepancy has been resolved. No flag is enabled by this release.
The approved main property explorer remains available independently.

- Update only from a reviewed replacement dataset with a version, source checksum, documented licensing and a working independent source check.
- Recompute aggregates offline, check raw row counts, reconcile segment names/dates, ensure no raw or generated identifiers, run `node --test tests/market-intelligence.test.mjs`, then typecheck/build in PR CI.
- Product release stays in the user's single consolidated release. **Do not merge or deploy this PR separately.** This route is `noindex` because it is a development/research sandbox.
- No key, Supabase table, migration, RLS policy, verification flag, repository-wide CSS or existing main RE listing route is modified.

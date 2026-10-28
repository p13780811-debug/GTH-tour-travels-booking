# Database stabilization — 29 October 2026

## Incident evidence
Production Supabase was returning widespread SQLSTATE 57014 cancellations plus 522/504 gateway failures. Failures affected attraction aggregate views, tenders, property reads and Supabase Realtime/internal catalog queries. The source attraction table was not deleted; the audit observed 174,931 OSM rows.

## Safe recovery
The deployed \`gth-osm-attractions-ingest\` function was temporarily replaced with a 503 write-pause response. No attraction row, RLS policy or public source record was deleted.

## Permanent architecture
1. Keep attraction ingestion default-paused through \`GTH_OSM_ATTRACTIONS_WRITES_ENABLED\`.
2. Add normalized public city/country indexes.
3. Add compact RLS-protected country/city summary tables.
4. Refresh only the completed country's summaries after a successful importer run.
5. Preserve existing public count-view contracts, but switch them to summary tables only after verified backfill.
6. Add tender country/deadline, sector/deadline, imported-at and title trigram indexes.
7. Replace repeated PostgREST exact-count requests with one RLS-respecting \`gth_tender_market_metrics\` RPC.
8. Keep RLS enabled. Performance changes do not weaken publication/security rules.

## Two-phase DB rollout
- Phase 1 is additive and does not change existing public attraction views.
- Phase 2 performs the one-time backfill and only then switches the views.
- If phase 1 or backfill fails, existing public views remain intact.

## Release gates
- Production DB must accept simple SQL reliably before migration.
- Apply phase 1 and verify tables/functions/indexes.
- Run phase 2 while importer remains paused.
- Verify anon reads of summary-backed views and tender RPC.
- Run Supabase Security + Performance Advisors.
- Verify Registry, Attractions, Guides, Destinations, Tours and Tender APIs.
- Only then explicitly set \`GTH_OSM_ATTRACTIONS_WRITES_ENABLED=true\` and restore the repository Edge Function.
- No website deployment is required for the DB-only attraction view cutover; Tender client code ships only in the next approved one-shot website release.

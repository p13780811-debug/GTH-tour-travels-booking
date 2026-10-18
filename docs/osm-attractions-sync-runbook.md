# GTH PRO · Worldwide OSM attractions ingestion — operating contract

**Scope:** OpenStreetMap community **place directory** only. Source: official Geofabrik extracts under ODbL 1.0. These rows are not verified attractions, ticket products, booking inventory, prices or licensed photos.

## Architecture and ownership

| Area | Existing file | Expected state |
|---|---|---|
| Source catalogue / region fairness | `scripts/attractions/geofabrik_registry.py` | Official HTTPS Geofabrik index; single-country leaf extraction; prefers unfinished region, then never-processed region, then least-recently-completed source |
| Protected job | `.github/workflows/gth-osm-attractions-sync.yml` | One region per scheduled hour (`37 * * * *`); OIDC-signed status preflight, download, Osmium conversion, bounded batches and final receipt |
| Importer | `scripts/attractions/import_osm_attractions.py` | Strict source validation, exact source ID deduplication, 100-row batches with 5.5-second pacing; 18,000 unique *accepted* OSM IDs maximum per job |
| Gateway | `supabase/functions/gth-osm-attractions-ingest/index.ts` | GitHub repo ID + main workflow + RS256 audience validated for both status and ingest; no exposed secret keys |
| Database | `public.gth_osm_attractions` / `public.gth_osm_attraction_sync_runs` | Source-ID primary key, public read RLS, service-role-only write RPC, durable resume cursors |
| User-facing visibility | `/attractions/progress` | Actual country counts, successful source receipts and full/partial regional scan states |

## Bounded full-region completion

1. A signed preflight reads the **latest successfully completed** `next_offset` and `complete` for each previously scanned region. If status is unavailable, the job fails rather than silently restarting an unfinished region.
2. The registry chooses a reviewed Geofabrik single-country leaf that is in a suitable time window. **Partial > not yet visited > oldest completed** is the priority within that eligible set.
3. For a partial leaf, the importer first skips exactly `next_offset` **valid unique** named OSM source IDs, then ingests up to 18,000 more. It examines the next eligible ID to determine whether more remain; it does not falsely report a full scan when the batch limit is reached.
4. A **final signed success receipt** commits `next_offset` and `complete`. If a download, upload, token refresh or receipt fails, that cursor is not advanced and the next eligible attempt is safe to replay.
5. Once the whole extract is scanned, the receipt resets `next_offset=0, complete=true`; later regional visits recheck the full extract for changes. The unique `source_id` key prevents duplicates and the SQL `IS DISTINCT FROM` condition skips unchanged conflicts.

**Source caveat:** Geofabrik extracts may change between resumed jobs; source position is a bounded resume optimisation, not an immutable remote snapshot. A subsequent complete re-scan reconciles additions/edits (the importer deliberately **does not auto-delete** an OSM record based solely on changed extracts). Regional **data coverage grows over time**; this does not promise that every country or source point has already been imported.

## Operational boundaries

- **No paid-plan requirement:** existing GitHub Actions and Supabase Free configuration remains; verify current quotas and Actions limits periodically.
- **Quota safety:** new database RPC refuses an ingestion batch at or above **450 MiB** database size. Check size via `select pg_size_pretty(pg_database_size(current_database()));`. There is no automatic table deletion.
- **Security:** no service role tokens in workflows, Vercel or browser code. GitHub OIDC identity is refreshed for each actual upload; signed status is limited to the exact workflow and repository ID.
- **Privacy / licensing:** source-attributed source IDs, names, categories and coordinates only. No speculative hotel/ticket stock, private contributor information, arbitrary image URLs, or automatic SEO indexing.

## Release gates — consolidated release only

1. **Feature branch / draft PR:** review changed paths, test Python registry and importer, run Node source contract tests and the existing Next.js production build + related source checks. Do not merge for partial results.
2. **Before merging:** in the planned single authorised release window, apply **additive** `20261018080000_osm_sync_resume_and_idempotence.sql` to the correct `dqprqjmhxjnrllczqyhz` project; confirm new RPC exists and execute permissions only allow service role. Existing records must remain unchanged. Deploy the updated **Supabase Edge function** only as part of the same coordinated release. The new workflow relies on its new private status action.
3. Merge with other approved PRs in **one coordinated main release**, then let GitHub's existing scheduling and Vercel's automatic main deployment operate. Do not trigger ad-hoc Vercel deployments or change the Hobby plan.
4. Verify public progress, signed workflow success/partial receipts, source count parity, one country filter, one source link, and 500 MB plan headroom. **Do not mark production complete before observed green checks**.

## Read-only audit SQL

```sql
SELECT count(*) AS places, count(DISTINCT source_id) AS distinct_ids,
       count(DISTINCT country_code) AS countries
FROM public.gth_osm_attractions;

SELECT source_region, country_code, accepted, next_offset, complete, completed_at
FROM public.gth_osm_attraction_sync_runs
ORDER BY completed_at DESC LIMIT 20;

SELECT pg_size_pretty(pg_database_size(current_database())) AS total_database,
       pg_size_pretty(pg_total_relation_size('public.gth_osm_attractions')) AS osm_including_indexes;
```

**On-call failure policy:** GitHub Actions job failure and a missing success receipt are not evidence of completion. Re-run the workflow only on the authorised main branch after fixing the actual error. Resume state remains tied to the last acknowledged success. Do not reset cursors or remove source data as a workaround.

**Baseline audited 2026-10-18:** 41,583 distinct source IDs across 7 countries; whole Postgres database ~119 MB; OSM table with indexes ~23 MB. Counts are a dated snapshot, not guaranteed current totals.

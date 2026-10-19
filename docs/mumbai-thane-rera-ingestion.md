# Mumbai and Thane registry ingestion

Entrypoint: `scripts/ingest_mumbai_thane_rera.py` (Python 3.10+).

This extends the existing source-aware registry pipeline without replacing the `properties` table, approved UI, global CSS or existing importer. Missing information stays null. A RERA registration is not a GTH/AI verification, ownership certification, current inventory confirmation or media license.

## Direct endpoint bulk engine: 1,000-project target and resume

Bulk entrypoint: `scripts/ingest_rera_endpoints.py`. It reuses the same transport, validators and protected 50-row Supabase sink. The original `backend/MahaRERA` Python files were not present in the checked repository/branches; this is a reconstructed collector using the exact general-details endpoint from the user's saved endpoint list and the previously shared `POST {"projectId":"4"}` request shape.

```bash
# Private execution host; no portal API subscription/key or CSV export required.
python scripts/ingest_rera_endpoints.py \
  --limit 1000 --id-start 1 --id-end 20000 --delay 5 \
  --fetch-budget 2500 --run-dir .gth-rera/endpoint-bulk

# Same checkpoint and range resume completed project IDs, including after interruption.
# With the existing server-only database variables and GTH_INGESTION_ENABLED=true:
python scripts/ingest_rera_endpoints.py \
  --limit 1000 --id-start 1 --id-end 20000 --delay 5 \
  --fetch-budget 2500 --run-dir .gth-rera/endpoint-bulk \
  --commit --expected-project-ref dqprqjmhxjnrllczqyhz
```

The numeric range is an explicit bounded public-ID candidate range, **not evidence that every number is a project**. If the earlier `valid_rera_ids.txt` contains numeric internal project IDs, use `--ids-file /private/valid-project-ids.txt` to avoid unnecessary discovery requests. Registration references such as `P517…` are not internal project IDs and are never converted into them. No unsupported search/list endpoint or undocumented district payload is invented.

Only explicit **Mumbai Suburban, Mumbai City and Thane** district records are retained. Other districts are counted and discarded. Missing district, mismatched project ID, conflicting identities, changed schema, authorization/session responses or unreadable robots stop the run without marking the failed ID complete. Known legacy district-prefix consistency is required; a new registration format requires a separately validated mapping. The adapter currently accepts explicitly named project/legal-address fields; its live response schema must be confirmed before treating the source as operational.

`--limit 1000` means 1,000 distinct in-scope registry projects in this checkpoint. Existing database IDs may be among them; it does not promise 1,000 new listings or 1,000 records in a single HTTP response. At five-second pacing, even 1,000 successful detail requests take at least about 83 minutes, plus district misses/retries/database operations. The five-hour invocation budget pauses safely; rerun the same command and directory to continue. Exit 0 means target collected, exit 3 means safely paused below target, exit 2 means source/configuration failure. Every successful detail is atomically checkpointed before the next fetch. Commits stream at 50 rows; each completed batch is acknowledged separately. After an uncertain write, rerunning reconciles through the existing conflict-safe sink.

The checkpoint contains normalized public fields only in a private SQLite file. It is bound to the source selection and selected database, protected by an OS writer lock, and not committed/uploaded as a public artifact. Keep it on persistent private storage when moving between cloud workers; a fresh ephemeral GitHub runner alone does not retain it. No recurring bulk schedule is enabled by this change.

No raw endpoint response, portal token, private contact/bank field, guessed unit size, price or stock project photo is stored. Registry/GTH/AI verification is not auto-promoted by this reconstructed adapter. The separate existing CSV/HTML entrypoint below remains compatible.

## Setup

From the repository root:

```bash
python -m venv .venv-rera
# Linux/macOS:
. .venv-rera/bin/activate
# Windows PowerShell instead: .\.venv-rera\Scripts\Activate.ps1
python -m pip install -r scripts/requirements-rera.lock
cp scripts/rera.env.example .env
```

Use the `.env` file only on your private execution host or equivalent encrypted job secrets:

```dotenv
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
GTH_INGESTION_ENABLED=false
RERA_USER_AGENT=GTH-PRO-Registry-Ingest/1.0 (+https://gthproglobal.com)
OVERPASS_URL=
RERA_MEDIA_HOSTS=
```

Fill the service-role/secret value locally. Do not paste it into a chat, commit it, expose it through `NEXT_PUBLIC_*`, put it in a URL or pass it as a CLI argument. The new importer reads only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; it does not fall back to a browser/anonymous key. Existing environment values take precedence over `.env`.

The exact tested dependency set is locked. `scripts/requirements-rera.txt` lists the direct packages; Pillow validates image bytes/dimensions, and SOCKS support allows normal proxy-configured Python clients. Default URL validation requires normal DNS resolution and rejects non-public destinations.

## Database contract

The additive migration is `supabase/migrations/20261018205239_mumbai_thane_registry_contract.sql`. It adds the requested public fields plus evidence/OSM/illustration metadata. Existing `hero_image`, `rera_id`/`slug` unique indexes, identity-generated IDs, policies and other columns are reused. Apply this migration once through the established migration workflow or Supabase SQL Editor before commit-mode ingestion; do not recreate the table.

| Requested field | Compatibility and meaning |
| --- | --- |
| `project_name`, `developer_name` | Source facts; new records also populate existing `title`, `developer`, `builder_name` aliases. Existing display aliases are preserved. |
| `district`, `locality` | Explicit source district and locality/address text; no east/west inference from a project name. |
| `property_type`, `unit_types` | Source-backed classifications/configurations only. Unknown type is null; unknown units are an empty array. |
| `min_carpet_sqft`, `max_carpet_sqft` | Positive numeric source values. Explicit square metres are converted using 10.7639104167; built-up area is not treated as carpet area. |
| `possession_date` | Recorded proposed completion/possession date, not evidence of actual completion. |
| `latitude`, `longitude` | Recorded official coordinates, or conservative OSM overlay matches with attribution/accuracy metadata. Existing approved map aliases are preserved. |
| `hero_image`, `gallery_images` | High-resolution assets with documented commercial-use rights and an explicit exact-project RERA match review. |
| `verified_status` | **Defaults false.** True only after name, RERA reference and district match a fetched official project detail page. This is registry identity verification only. |
| Existing `verified` | New imports remain false. Existing completed GTH verification is never inferred from registry data. |
| `illustrative_media` | Separately labelled category/unit-type imagery; never written into project hero/gallery fields. |

Current UI media approval remains separate; a populated URL alone does not approve its display.

## Validate an authorized CSV without HTTP or credentials

```bash
python scripts/ingest_mumbai_thane_rera.py \
  --source csv --csv /private/mumbai-suburban.csv --csv /private/thane.csv \
  --offline --output .gth-rera/normalized.json
```

Recognized column names include:

```csv
rera_id,project_name,developer_name,district,locality,project_address,property_type,unit_types,min_carpet_sqft,max_carpet_sqft,possession_date,latitude,longitude,official_source_url
```

Use JSON arrays or semicolon-separated unit types in CSV; standard CSV quoting is supported. ISO dates are preferred; `DD/MM/YYYY` is also supported. PAN, Aadhaar, phone, email, bank/account, credentials and unknown columns are discarded. Input `verified_status`, `verified`, image and raw JSON columns are never trusted.

The cluster order is Andheri, Borivali, Kurla, Dombivli, Thane West, Palava. Palava is chosen when an address explicitly includes it in the Dombivli belt. District/prefix consistency is checked (`P518…` Mumbai Suburban; `P517…` Thane). Records without confirmed target locality are excluded. `--district-only` explicitly permits useful unverified district records without pretending that a cluster was confirmed.

## Live discovery and fallback

```bash
python scripts/ingest_mumbai_thane_rera.py \
  --source auto --csv /private/mumbai-suburban.csv --csv /private/thane.csv \
  --delay 5 --limit 100 --output .gth-rera/normalized.json
```

The collector reads the official [MahaRERA public search](https://www.maharera.maharashtra.gov.in/projects-search-result), checks robots, discovers supported public GET form options and follows explicit next-page links. It parses identity-qualified tables and linked detail pages with labelled fields. It does not invent endpoint URLs, query hidden APIs, submit transient POST form state, rotate identities, bypass access challenges or automate login. A changed/unsupported structure, unreadable robots policy, 401/403/303, access challenge, repeated page or page budget aborts that live collection. `auto` can fall back to supplied authorized CSVs; `live` reports the source failure.

Default pacing is five seconds between **all** transport attempts and DB operations; `--delay` cannot be below 1.5 seconds. `urllib3.util.retry.Retry` supplies bounded exponential backoff. Retry-After is respected; a long requested pause stops the run. Responses are size-bounded, HTTPS destinations are allowlisted and DNS targets must be public. No source response body or private field is logged.

## Optional OSM overlay

Set `OVERPASS_URL` to an operator-approved HTTPS endpoint, then add `--osm`. Choose a self-hosted or appropriately permitted provider for recurring commercial workloads. There is no automatic provider rotation and no public Nominatim dependency.

Requests are sequential, exact-name/reference queries within district search envelopes; results are cached seven days. An OSM join requires either an exact RERA reference or exact project name **and** independently tagged locality, plus a unique result inside the search envelope. Ambiguous/name-only/nearest-building matches are discarded. Closed `building=*` ways can supply GeoJSON footprints; relation rings are not guessed. OSM points and bounding-box centres are not surveyed exact coordinates or legal boundaries. Official coordinates take precedence.

Preserve `osm_evidence` attribution in any consumer: **© OpenStreetMap contributors; ODbL 1.0**, [license](https://www.openstreetmap.org/copyright). Keep OSM-derived geometry/metadata distinct from registry facts and observe applicable database sharing obligations. See [Overpass usage guidance](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances).

## Optional reviewed media

Set `RERA_MEDIA_HOSTS` to comma-separated public image CDN hostnames and pass `--media-manifest /private/reviewed-media.json`. Every manifest entry needs:

```json
{
  "url": "https://your-approved-public-cdn.example/project-exterior.jpg",
  "source_url": "https://your-rights-source.example/asset-license",
  "license": "owner-authorized",
  "permission_reference": "your-written-permission-reference",
  "attribution": "required creator or rights-holder attribution",
  "reviewed_at": "2026-10-17T12:00:00+00:00",
  "match_kind": "exact_project",
  "rera_id": "the-exact-official-rera-reference",
  "project_match_reviewed": true
}
```

The example is a template, not a usable asset or real project record. Put entries in a JSON array. Supported evidence labels are CC0-1.0, CC-BY-4.0, CC-BY-SA-4.0, owner-authorized and Pexels License; license and attribution obligations remain applicable. The supplied review/permission reference is an accountable operator assertion, not an automatic legal-rights determination.

JPEG/PNG/WebP bytes must decode, with at least 720 pixels on the shorter edge and 1280 on the longer edge. The source hash, actual dimensions, rights reference and match kind are retained. Signed or credential-bearing URLs are rejected. Existing hero/gallery choices are preserved.

For stock/category assets use `match_kind: illustrative_category`, a `property_type` (Residential/Commercial/Mixed), and optional `unit_types` array. They are stored only in `illustrative_media` with the disclosure “Illustrative category image; not a photograph of this project or unit”. Searching a stock API by project name does not prove an exact property-photo match.

## Intentional database write

After a useful dry-run, set `GTH_INGESTION_ENABLED=true` in the private job environment and run:

```bash
python scripts/ingest_mumbai_thane_rera.py \
  --source csv --csv /private/mumbai-suburban.csv --csv /private/thane.csv \
  --commit --expected-project-ref your-project-ref --limit 100 --delay 5
```

Optional flags (`--osm`, `--media-manifest`) may be combined with commit mode. Do not use `--offline` with commit mode. The expected project ref must match the server URL exactly.

The sink chunks at 50, preloads existing records and upserts on `rera_id` with `default_to_null=False`. Sparse updates are grouped by identical keys so unknown fields do not erase stored data. Existing slugs, generated identities, display aliases, reviewed/GTH-verified records, owner submissions and selected media are preserved. Unverified exports fill missing registry fields only; exact matched official detail evidence can refresh registry facts. Uncertain writes are not blindly retried; acknowledged batch counts and an uncertainty flag are retained. Run only one importer for this target at a time, and coordinate concurrent human edits.

## Validation and execution evidence

```bash
python -m unittest discover -s tests -p 'test_mumbai_thane_ingestion.py' -v
python -m compileall -q scripts/rera_ingestion scripts/ingest_mumbai_thane_rera.py
```

Tests use explicitly synthetic in-memory fixtures, never production inserts. They cover retry spacing, Retry-After, denial/session stops, public-host checks, private-field removal, district/locality checks, conflicting duplicates, exact detail verification, OSM ambiguity/footprints, category versus exact media, identity handling, 50-row upserts, stable existing fields, partial acknowledgements and credential-free offline execution.

Initial execution on 18 October 2026 UTC: direct official HTTP probe returned 503; this managed runtime also lacked direct DNS resolution for the official host during the hardened collector run. The available older 10-row CSV produced nine valid district records plus one invalid row, but none had a confirmed target-cluster locality. The scoped run therefore wrote **zero** records. No new records or photos were represented as successfully imported or verified.

The endpoint engine removes manual CSV export as a prerequisite for bulk collection. Source availability remains a real execution requirement: the 18 October 2026 UTC GitHub-hosted public endpoint probe also failed before receiving project JSON; its run is [39169678128](https://github.com/p13780811-debug/GTH-tour-travels-booking/actions/runs/39169678128). The cloud environment reported both database secret variables absent; no values were accessed or logged. The database audit found 812 existing `rera` rows, including 116 Mumbai Suburban and 90 Thane rows; these are existing records, not new imports from this work. No 1,000-record live success is claimed.

Run summaries are private under `.gth-rera/` by default. Keep source exports, numeric ID lists, checkpoints and media-review manifests out of a public repository.

This data change does not deploy the website. `vercel.json` disables automatic deployment for its dedicated ingestion branch; production deployment behavior for other branches is unchanged.


## Operator-supplied historical MahaRERA ZIP: direct CSV bulk fallback (19 October 2026)

The user's original `archive(2).zip` contains **43,943 CSV rows across 11 files**, with **43,926 unique RERA registration IDs** in the complete bundle. It has district-specific datasets (including Pune, Nashik, Palghar, Raigarh, Nagpur and other districts) plus a revoked-project exclusions file. These are **historical public registry snapshots, not real-time listings**; the latest `date_last_modified` in the files is **23 March 2024**. The upload does not contain verified current property prices, contact-approved agents, original project photographs, live inventory, bookings or an official per-project detail URL.

PR #93's original model and sink intentionally cover **Mumbai Suburban, Thane and Mumbai City only**; no claim of statewide ingestion is made. Their three regular CSV files contain **12,042 rows**. After keeping the recorded district consistent with the expected RERA registration prefix and excluding 61 conflicting rows, the preliminary registration/name audit yields **11,981 eligible candidate registrations**. Only records passing the actual validated importer contract qualify for database submission. The revoked list is mandatory; revoked references are excluded, not listed as available. An arbitrary ZIP cannot be trusted as proof of license rights or registry verification.

This release adds **`scripts/ingest_rera_archive.py`**, reusing PR #93's existing `Project` model, private SQLite `Checkpoint`, protected `SupabaseSink` and 50-record upserts. It does not need the blocked official endpoint. It processes exactly the supplied CSV schema (`MM/DD/YYYY` completion dates, combined source latitude/longitude, reported sanction/area/unit-count metrics and postal code). Original project land area is never mislabeled carpet area. Source public counts go to explicitly marked `registry_evidence.snapshot_metrics`, not prices or bedrooms. `verified_status` and `verified` stay false; unavailable values stay null. Existing approved property records, identifiers, photos, prices and moderation are protected by the shared sink.

Use a local/private runner with the ZIP file; **the ZIP itself must not be committed to this public GitHub repository**, and chat uploads are not automatically present in GitHub Actions:

```bash
# No API calls, secrets, Supabase writes or deployment; prepare a deterministic 1000-record window.
python scripts/ingest_rera_archive.py --zip "/private/archive(2).zip" \
  --limit 1000 --offset 0 --run-dir .gth-rera/archive-0

# Subsequent nonoverlapping batches, once the previous batch is reviewed:
python scripts/ingest_rera_archive.py --zip "/private/archive(2).zip" \
  --limit 1000 --offset 1000 --run-dir .gth-rera/archive-1000

# Only after confirming source redistribution/import rights and reviewing the dry-run,
# use protected server-only credentials already configured in the private job:
GTH_INGESTION_ENABLED=true python scripts/ingest_rera_archive.py \
  --zip "/private/archive(2).zip" --limit 1000 --offset 0 \
  --run-dir .gth-rera/archive-0 \
  --commit --authorized-snapshot --expected-project-ref dqprqjmhxjnrllczqyhz
```

The default selection interleaves the three target districts, avoiding 1,000 records exclusively from the first CSV. An interrupted run can reuse **the same source ZIP, offset, limit and private run directory** to reconcile acknowledged 50-row batches safely. Changing source archive or window in an existing checkpoint fails closed. No background schedule, database mutation or release deployment is activated by adding the importer.

The ZIP's source/update dates are retained as historical metadata; `captured_at` means when GTH parsed the file, **not** when the underlying registry facts were refreshed. The provided archive lacks live source permission/license evidence, so no automated write or public asset publication should occur before authorization and the release gates. Full-state/district expansion outside these three districts needs a separately reviewed schema and sourcing contract rather than weakening the current district validator.

Validation: `python -m unittest discover -s tests -p 'test_mumbai_thane_*.py' -v`. Existing public endpoint probe remains a distinct diagnostic; its TLS/source-access failure does not validate or invalidate the supplied offline CSV.

# GTH PRO Tenders — Local functional setup

This branch implements working search, filters, pagination, tender detail pages,
read-only API, a conservative schema, and an authorisation-gated CSV importer.
**There are no fabricated tenders. No live database changes have been applied.**

## 1. Connect development only

With the consolidated project open in VS Code, set `NEXT_PUBLIC_SUPABASE_URL`
and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your existing untracked `.env.local`.
Never commit these environment files, any service-role key, or source CSV files.

Run `npm ci --legacy-peer-deps`, then `npm run dev` and open `/tender`.
It will show a transparent unavailable/empty state until the migration is applied.

## 2. Apply schema in a reviewed environment

Review `supabase/migrations/20261013224500_tender_catalog_v1.sql`.
Apply it only to the correct Supabase project when ready. It is additive,
creates `public.tenders` and `public.tender_ingestion_runs`, enables RLS, and
inserts no rows. Public reads require: `status='published'`,
`is_public=true`, `source_verified=true`, and an unexpired deadline.
Public writes are blocked.

## 3. Prepare an authorised source CSV

Required headers:
`source_reference,source_url,title,buyer,country_code,sector,deadline_at`.

Optional headers:
`region,summary,published_at,estimated_value,currency`.

`sector` is `works`, `goods`, `services`, `consultancy`, or `other`.
Dates must include a timezone: ISO-8601, e.g. `2027-01-20T12:30:00+00:00`.
Country is an ISO 3166-1 alpha-2 code. **Only ingest files you are entitled
to reuse, with a source URL from an authority you independently checked.**

Dry-run (no network, no DB writes):
```powershell
python scripts/import_tenders.py C:\\authorised-data\\tenders.csv --source-name CPPP --allowed-host eprocure.gov.in
python -m unittest discover -s tests -p "test_tender_import.py"
```

For private review ingestion (never automatic publication), the operator
must explicitly set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`GTH_TENDER_INGESTION_ENABLED=true`, and pass:
```powershell
python scripts/import_tenders.py C:\\authorised-data\\tenders.csv --source-name CPPP --allowed-host eprocure.gov.in --commit --expected-project-ref YOUR_SUPABASE_PROJECT_REF
```

Existing source references are not modified by later imports. New records stay
`review`, `is_public=false`, and `source_verified=false`.

## 4. Independent verification & publication

An authorised admin must verify each notice on its official portal, including
buyer, dates, documents, revision notices, licence/redistribution permissions
and source. Only then may a privileged database operator intentionally promote
that record to `status='published'`, `is_public=true`,
`source_verified=true`. No public promotion API exists.

## 5. APIs & presentation

`GET /api/tender?q=...&country=IN&sector=works&page=1`
returns `{items,total,page,pageSize}`, max 12 per page; no results means
an empty list. `GET /api/tender/{uuid}` returns the individual notice.
`POST /api/tender` returns HTTP 405. Database unavailable returns 503,
not fake listings. All detail links connect to source via a validated HTTPS
URL. No payment or e-bidding capability is claimed.

The project's production release remains under the user's control.

## AI-powered tender preparation (non-submitting)

The /tender/assistant route is a **six-step, functional** browser workspace:
notice details, bidder profile, source requirements, conservative eligibility
comparison, documents checklist and generated editable cover-letter/bid
preparation packet. Download a plain-text draft without signing in, or opt into
Gemini coaching via `POST /api/tender/assistant` when `GEMINI_API_KEY` and
shared Upstash rate limiting are configured. AI receives only the explicitly
consented typed business/tender summary, not uploaded files. No automatic
filing, uploading, payment or legally certified eligibility is provided.

`supabase/migrations/20261013232000_tender_ai_assistant_v1.sql` adds
source requirements fields (default unverified) and an owner-only
`tender_bid_workspaces` RLS table. Signed-in users can save and resume via
`GET/POST /api/tender/workspaces`; unauthenticated requests return HTTP 401.
The bearer token comes from an existing Supabase sign-in session; this is not
a service-role API. This migration requires the preceding tender schema.
Until applied, the browser-only drafting workflow is available, but private
server save and source requirements queries may show a safe unavailable state.

Eligibility is a cautious **screening**, not an approval: no source criteria
means insufficient information, manually entered criteria mean needs review,
missing user answers mean unknown, documented mismatches are flagged, and even
a matching profile must be verified against official procurement documents.
Tender source constraints and amendments always take precedence.

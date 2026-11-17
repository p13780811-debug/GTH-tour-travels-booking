# Source-fed intelligence and private enquiries

Travel bookings stay with the existing supplier/affiliate handoffs. OSM records
are mapped directories, not room offers, affiliate hotel IDs or sale inventory.
No promoter inventory is manufactured from registry entries.

`/enquire` accepts buyer, tender-support and group-travel requirements without an
existing property ID. Email is required; phone is optional unless phone follow-up
is requested. Consent, same-origin checks, request-size limits, rate limits,
server sanitization and idempotency remain enforced. The business WhatsApp
number is optional and is not needed to capture or manage a request.

`/admin/enquiries` requires the existing authenticated administrator role.
Contacts remain service-only in the database, with no anonymous or general-user
read/write grant. Operators can track review status, notes and follow-up dates.
Compare-and-set updates reject concurrent edits. Draft copying does not send any
message, confirm suppliers, mark a lead contacted or guarantee a deal.

A dedicated signed GitHub workflow refreshes the source index every six hours.
It reads only current public tender and mapped-attraction sources through the
existing native gte-small function, scans at most 12 rows per sector and embeds
at most three per sector per run. Private cursor/lease state prevents replay
bursts; new embedding writes share the 475 MB capacity reserve. No service-role
key is stored in GitHub, no paid AI endpoint or supplier room API is called,
and the existing semantic inference gateway keeps JWT verification enabled.

The scheduled enquiry-review automation prepares internal drafts and reports
new/due work once per 24 hours. It does not send email/WhatsApp messages or
advance due follow-ups without actual action.

## Supplied MahaRERA Python skeleton

Use `scripts/registry/maharera_engine.py` for a locally supplied, authorised JSON
export containing a `Data` array. It reuses the official registry validator and
compact private writer; the real destination is `gth_official_registry_records`,
not a guessed `real_estate` table. A source manifest must identify the real
regulator/dataset URL and reviewed reuse rights. No hidden/dummy endpoint is
queried, no status defaults to Ongoing, proper names are preserved, and nulls,
markup, duplicates and oversized inputs fail before import starts.

Example (offline preparation only):

```sh
python scripts/registry/maharera_engine.py --input /path/export.json \
  --manifest /path/source-manifest.json --output /path/new-private-rows.jsonl \
  --descriptions /path/new-research-drafts.jsonl --max-rows 100
```

The source manifest uses `authority: MAHARERA`, an actual official `source_url`,
`license`, `rights_confirmed`, and optional explicit `columns` mappings. Missing
reuse approval permits offline preparation but blocks `--commit`. Commit mode
requires server-injected `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, uses
insert-only batches of at most 25 and leaves locality verification false.
No Gemini key is required and no model call runs. Descriptions contain only
supplied facts and explicit research boundaries, never prime-location,
upcoming-project, growth or availability claims. Google AI subscription access
and API billing/credits must be verified separately before any optional provider
integration is enabled. Credentials must never be pasted into source code.

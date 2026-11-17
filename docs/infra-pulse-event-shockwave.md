# Infra-Pulse and Event-Shockwave integration

## Evidence and public behavior

PR #220 includes PR #218 through a merge preserving both histories. Main has not been merged or deployed by this work.

- `src/lib/intelligence/infraPulse.ts` reads one bounded, anonymous/RLS-scoped SQL RPC for at most 24 property IDs. A 60-second shared cache reduces read load. Expired displayed notices suppress stale cached signals. Only published, public, source-verified, unexpired `works` notices match; country AND exact normalized region/state/district/city must agree. The recovered RERA rows' hardcoded Mumbai city is explicitly excluded. Private global registry stubs are not included in public cross-links.
- Cards and project detail panels show actual tender titles, issuing authority, deadlines and geographic match scope. The count describes public works activity. It does not assert a high-growth corridor, awarded construction, local walking distance, investment value or price appreciation. No fixture records are written into production.
- No tender coordinates exist in the current live schema. Therefore no PostGIS distance match is asserted. Adding fabricated coordinates or country-only matches would violate the evidence contract.
- Stadium and both major attraction route families reuse the VIP enquiry module and the existing Nuitee white-label destination. `hotels` has no latitude/longitude columns or verified-operating-status field, so exact recorded city + country matches are explicitly **City-Level Stay Options**. A public/source-tagged record is not described as a verified, nearby or bookable hotel. Empty results retain a direct booking search. Existing OSM directory proximity stays separate and is labeled as a bounded directory sample, not live supplier inventory.
- Hospitality requests cover corporate hospitality, ground group transport and hotel blocks. They are requests for supplier review, not confirmations that corporate boxes, vehicles or rooms are available.

## Private leads and WhatsApp

`/api/intelligence/leads` has same-site checks, bounded JSON, normalized text validation, explicit consent, an E.164 phone validator, existing shared fail-closed rate limits and a service-only writer. It resolves the actual property or venue server-side and derives the tender IDs; callers cannot inject title/target geography/tender IDs. A SHA-256 fingerprint binds idempotency keys to the submitted payload. Enquiry records, contacts and message text are unavailable to anonymous and ordinary authenticated clients.

`GTH_BUSINESS_WHATSAPP_NUMBER` is an optional country-code-and-digits destination. No personal number is invented. Once configured, the saved enquiry gets a WhatsApp handoff containing the property/venue key, selected INR/USD/AED/GBP/EUR/SGD currency, reference and real linked tender IDs. The visitor must press Send in WhatsApp. Without configuration, the private enquiry is still saved and official email follow-up is shown. No paid messaging API is introduced.

## Official registry adapter

`scripts/registry/official_gov_harvester.py` is an offline CSV/JSONL adapter with explicit source-header mapping. `src/lib/intelligence/officialRegistry.ts` is the matching TypeScript Data Guard.

Authorities: MahaRERA (project identity/locality), Dubai DLD (project schema), HM Land Registry (sale-transaction schema; never represented as a property title or RERA approval). HTTPS official hosts, explicit reuse license, compact fields, normalized text, input-size and row-count limits are enforced. Source-host validity does not establish dataset rights or regulator verification.

The 812 recovered historical rows are existing source records, not 812 independently regulator-verified projects. `--legacy` reuses PR #218's district/taluka/village/PIN recovery, discards hardcoded city and all candidate coordinates, and never inherits old `verified=true` flags. It cannot publish or commit those historical rows automatically. No original source file or export is overwritten.

Example manifest (replace the header mapping with the observed authorized CSV headers):

```json
{"authority":"MAHARERA","source_url":"https://maharera.maharashtra.gov.in/","license":"unconfirmed","rights_confirmed":false,"columns":{"record_id":"rera_id","project_name":"title","district":"district","taluka":"taluka","locality":"village","postal_code":"pin_code"}}
```

```sh
python scripts/registry/official_gov_harvester.py --input authorized.csv --manifest manifest.json --output compact-review.jsonl
```

Default output is private review staging with `locality_verified=false`; no crawler, new paid API, base64, media blob, raw JSON dump or automatic sitemap expansion exists. Optional explicitly requested `--commit` requires authorized reuse and a server-only writer, uses insert-only bounded batches, and never promotes verification. Stub records have no public route; generated `indexable` remains false until independently reviewed locality evidence and reuse rights exist.

The database insert guard serializes this adapter's imports and refuses them when current database bytes plus a conservative row allowance exceed 475,000,000 bytes, leaving space below the requested 500 MB threshold. It cannot cap unrelated writers or guarantee the provider's total account/storage quota. Live preflight was 216,878,227 bytes; post-schema check was 217,066,643 bytes. No rows were imported.

## Migration and validation

`20261117070740_infra_pulse_event_shockwave.sql` was generated by Supabase CLI, aligned to the actual recorded live migration version, tested against a disposable PostgreSQL engine, applied through the connected live project, and post-verified. The two new tables have RLS enabled, no anonymous read/insert grant, no ordinary authenticated insert, and service-only insertion. The public view uses `security_invoker=true`. The unused old `contact_inquiries` skeleton's anonymous grants were also revoked; no repository application path uses that table.

The four migrations from #218/#220 were already applied and were not reapplied. Existing project-wide Supabase advisor findings on older objects are separate from the new tables/functions; this change does not claim the whole database has zero security warnings.

New CI runs behavioral tests and PostgreSQL 17 RLS/geography checks. Existing full TypeScript, ESLint, Node security tests, registry Python checks and Next.js production build remain release gates. Stripe paid tender subscription activation is a separate earlier request requiring actual billing and delivery credentials; this cross-sector change does not claim paid alerts are live.

The four previous #218/#220 source migration filenames were also reconciled with the already-applied live history versions. Their SQL contents are unchanged; CI references use the recorded versions to avoid accidental future reapplication.

# GTH PRO — Cloudflare production cutover checklist

Status: **HOLD — protected runtime verification and release authorization pending.**
Do not merge or switch DNS merely because a compile succeeds.

## Evidence (2026-11-26 UTC)
- Private Worker `gth-pro-preview-20261126` deployed from `2f6f797`; Wrangler exit 0, 20,168.92 KiB raw / 4,320.15 KiB gzip. [Deploy](https://github.com/p13780811-debug/GTH-tour-travels-booking/actions/runs/45718147791).
- Owner-only Access policy and workers.dev URL verified. [Activation](https://github.com/p13780811-debug/GTH-tour-travels-booking/actions/runs/45789623579).
- User confirmed hotel and flight search on preview. Tokyo routing correction `4c2ecad` compiled and production regression workflow passed; it is NOT on the existing deployed revision. [Build](https://github.com/p13780811-debug/GTH-tour-travels-booking/actions/runs/45798577851).
- The compile-only build reports 20,170.44 KiB raw / 4,318.95 KiB gzip. The old owner-defined 2.8 MB gzip gate fails; it is separate from the published 64 MiB uncompressed Cloudflare limit. Do not remove a release gate without explicit approval.
- [Live audit](https://github.com/p13780811-debug/GTH-tour-travels-booking/actions/runs/45800088591): protected root anonymous HTTP 302 / 99 ms, existing apex HTTP 402 / 146 ms. Single runner samples, not cold-start or application latency measurements.
- Preview authenticated QA blocked at service-token creation (403 / 1010); no Access policy widened, no QA credential created. The audit workflow is committed. Required narrowly scoped API permission: Account / Access: Service Tokens / Edit. It creates an expiring 15-minute token and a single service-auth policy, never a bypass, and removes both afterward.
- Supabase read-only sample verified at least 100 active destination rows, 100 registry rows with RERA IDs, 100 hotel directory rows, 100 tender rows and 100 future-deadline tender rows. This is database connectivity, not proof of anonymous RLS visibility or live inventory.

## 1. Release candidate and preview verification
1. Keep PR #260 draft; never force-push main. Recompare main and head, resolve drift, verify no unrelated changes and all required tests.
2. Rebuild a protected candidate using locked dependencies, pinned OpenNext/Wrangler, the existing runtime secret bundle and only public build-time variables. Keep the existing preview available until candidate validation. Apply the two audited Edge-to-Node runtime compatibility declarations only in disposable build checkout; retain original routes and features. Verify candidate version/commit identity.
3. Authenticated HTTP test the homepage, hotels/flights, Goa/Tokyo, Mumbai/Kolkata mobility, map/cities/traffic APIs, 12Go redirect, real-estate registry and tools, tender listing/assistant and ticket/stadium/concierge routes. Validate response JSON structure, data counts and legitimate redirects, not only 200. Browser-check maps, calculators, hotel/date/guest handoff, 12Go, stadium links, mobile navigation, PDF/XLSX, and day/night. Never perform a real purchase or submit a fake lead. Verify admin and write APIs reject unauthenticated access.
4. Record first and repeated TTFB/full response timings, CPU and errors separately. Resolve degraded or empty critical data, 5xx, invalid redirects and quota errors before public traffic. Verify the release-only native sharp/image-processing paths using safe test inputs (no live upload or database mutation without approval).

## 2. Security and performance before public cutover
- Existing `src/lib/security/rate-limit.ts` trusts Vercel only; Cloudflare traffic currently shares the conservative untrusted-origin bucket. Preserve Upstash global and per-client caps, add a trusted Cloudflare ingress identity boundary and spoofing tests. Do not set VERCEL=1 or trust arbitrary forwarded headers.
- Existing `src/lib/seo/site.ts` uses www as canonical public origin and requires VERCEL_ENV=production plus GTH_PUBLIC_LAUNCH_ENABLED=true. Treat VERCEL_ENV as a compatibility label, not proof of network identity. Preserve www canonical, use HTTPS permanent apex redirect preserving path/query, enable the intended public SEO flags on the release candidate before static generation. Test robots, sitemap, canonical, redirects and preview noindex.
- Static hashed Next assets: immutable cache via Cloudflare assets and existing Next headers; no new paid service. Public anonymous lookup caches only on normalized explicit filters, country/currency/language where applicable. Existing mobility map cache 6h, cities 5m, traffic 25s; explicit hotel profile discovery 24h. Respect no-store for degraded responses, booking availability, private records and writes. Never cache Access responses, user/session headers, personalized or authenticated data.
- Use existing bounded Supabase queries, indexes and successful-read cache first; check latency and explain plans before adding indexes. Evaluate OpenNext persistent incremental cache for ISR/data; prefer R2 for revalidation only with separately verified free allowance and approval (do not activate billing). KV eventual consistency is unsuitable for inventory, deadlines and security counters. No extra resources until measurements justify them.
- Confirm Workers Free request/CPU ceilings, supplier budgets, Supabase/Redis quotas; check actual CPU and startup errors rather than inferring from gzip size. Keep ingest/cron disabled until separately reviewed. Encrypt all runtime private variables via Worker secret bindings; do not print them or add them to NEXT_PUBLIC_*. Keep GitHub actions secret bundle restricted to trusted branch jobs.

## 3. DNS migration — preparation only
Current authoritative DNS: ns1.vercel-dns.com and ns2.vercel-dns.com. Existing Vercel registered domain verified. Apex returns 402, not a working rollback application. Vercel DNS inventory has 21 records (includes system apex and wildcard ALIAS). Back up all record names/types/values/TTLs, including MX priority, TXT verification and CAA before switching DNS. Do not copy Vercel system ALIAS as Cloudflare ALIAS. Use temporary DNS-only CNAMEs for existing Vercel origin routing as appropriate until custom domains are ready; verify exact rollback against export and Vercel project configuration. Existing supplier records must remain DNS-only:
- hotel CNAME d3bkfvti7cff3x.cloudfront.net.
- hotels CNAME d2t5k6cv5h5cmj.cloudfront.net.
- transport CNAME whitelabel.12go.asia.
- Preserve BOTH AWS ACM certificate validation CNAMEs exactly.
- Preserve Zoho MX priorities 10/20/50, SPF, DKIM, Zoho and Google verification TXT. Preserve all existing CAA and check compatibility with Cloudflare certificate issuers. Do not redirect or wildcard-proxy supplier subdomains.
1. Add domain to Cloudflare Free DNS zone, import/reconcile all records; get the actual assigned nameservers from Cloudflare (never guess). Check DNSSEC/DS migration before any delegation change. Confirm current registrar DNSSEC and mail records.
2. Prepare a separate production Worker `gth-pro-production` (proposed name, not created); no broad Worker-level Access policy. Keep existing preview Worker protected. Do not attach public domain to current owner-only Worker: worker-level Access covers Custom Domains too. Audit all-workers and hostname/path policies.
3. After review and explicit release approval, merge tested PR to main and build exact merged SHA with production secrets and flags. Change registrar custom nameservers to assigned Cloudflare pair only after pre-import record parity verified. Vercel registrar registration can remain unchanged. Wait for Cloudflare active zone and certificate readiness; do not delete Vercel project or mail/supplier records.
4. Attach `www.gthproglobal.com` and `gthproglobal.com` as custom domains of production Worker (or use apex redirect rule and proxied apex placeholder per Cloudflare docs). Preserve www canonical and path/query. Remove only conflicting apex/www records after saving their values. Custom Domain creates its own DNS record and certificate; no hardcoded Worker IP or direct CNAME to workers.dev. Keep workers.dev off on production. Do not remove preview Access.
5. Unauthenticated smoke from multiple networks: public homepage, all pillars, search and APIs, TLS, canonical, redirects, robots/sitemaps, supplier hosts, mail MX/SPF/DKIM; verify no Cloudflare Access redirect on public URLs. Check error rates/CPU/quota and public data shapes. Roll back Worker version first if needed; if DNS rollback is required restore saved records or original nameservers (Vercel currently 402 so restoring its origin alone does not restore site). Preserve previous preview as working fallback, not public production.

## References
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/
- https://vercel.com/docs/domains/managing-nameservers
- https://opennext.js.org/cloudflare/caching
- https://developers.cloudflare.com/workers/platform/pricing/

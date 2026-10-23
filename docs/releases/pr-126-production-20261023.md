# PR #126 production release record — 23 October 2026

## Authorization and scope

After receiving the readiness audit, the owner explicitly requested completion and a single production merge of PR #126 on 23 October 2026. This supersedes the earlier instruction to keep this candidate preview-only. Merge the completed candidate once into `main`; let the existing Git integration deploy it. Do not manually deploy production or merge unrelated PRs.

The release contains validated Nuitee hotel booking routing and private Tender service enquiries with a manually reviewed quote email draft. The existing central design system, Real Estate workflows, database schema, grants and RLS are preserved. Hotel provider rates, terms and confirmation remain provider-controlled. Tender enquiries and closed reviews are not payments, accepted commercial quotes or revenue. No automatic mail delivery, billing or payment gateway is activated.

## Final hardening

- Update within Next.js 15 to 15.5.28 and refresh compatible transitive security patches.
- Update Sharp to 0.35.5; use the same patched Sharp and PostCSS versions throughout the lockfile. Keep the existing global CSS unchanged.
- Full and production-only npm audits report zero findings at verification time. This is a dependency advisory snapshot, not a guarantee that no vulnerability exists.
- Add four actual admin queue handler tests with isolated authentication/database boundaries: reject anonymous and forged roles before reads, retain authenticated-client restrictions and bounded pagination, reject malformed filters, hide provider diagnostics and handle exhausted pages.
- Give the private admin queue a full-width background using the existing `--bg` token so night-theme headings remain readable. No global CSS change.

## Verification

- 488 JavaScript/TypeScript regression tests pass with zero failures.
- 21 registry ingestion tests pass.
- Strict TypeScript, full lint and production build pass. The build generates 138 static pages.
- Local production-browser checks at 390, 768 and 1440 pixels: Hotels, Tender services and private admin page render without horizontal overflow or uncaught page errors. Invalid phone submissions show validation feedback. Anonymous admin APIs return 401. Valid two-room supplier-path links preserve the property, dates and occupants; expired links recover to search.
- With isolated local fixtures, the admin browser loads the queue, prepares the correct recipient/fee/terms in an email draft and updates review status. No email is sent and no production database is mutated by these fixture checks.
- Protected candidate verification is recorded in the PR body after completion; older preview `4871d98` does not represent the final candidate. Supplier network requests from the local browser encountered the workspace proxy's certificate restriction; this does not verify supplier availability or a completed booking.

## Verification limits

Physical-device testing and a real signed-in administrator session are not available in this workspace. Handler tests use isolated provider boundaries; browser queue/quote tests use synthetic local fixtures and do not prove a live authenticated database session. Do not describe either as physical-phone QA or a live administrator test. No real enquiry, email, paid reservation, quote acceptance or payment is created by these local checks.

There were zero submitted reviews and zero inline threads at the readiness audit. Owner release authorization is recorded above; GitHub must still enforce any configured merge rules. Do not manufacture an approval or bypass required checks/reviews.

## Production verification and rollback

After the one-shot merge, verify Vercel READY on the resulting merge commit and aliases `gthproglobal.com` and `www.gthproglobal.com`. Smoke-test `/hotels`, `/tender/services`, valid supplier-path redirection, expired-stay recovery, and anonymous admin API denial. Keep the last working production deployment `dpl_6ZPgELhsphKCeqErKyyyPiZT1GaA` (Git SHA `5c2fc728188f48bf39315f8a65e11cd9d79af589`) as the rollback reference; roll back only if the release introduces a material failure.

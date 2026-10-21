# Tender assistance revenue channel

Optional quote-based services live at `/tender/services`: eligibility review, bid document review, GeM onboarding guidance and tender monitoring. Discovery, source notices and the existing preparation assistant remain free. No invented prices, success claims or automated paid-subscription promises are displayed.

## Operational flow

1. A visitor selects a service from discovery, a public tender detail or the preparation assistant. The server resolves any linked tender against the active public source-verified catalogue.
2. The bounded consented enquiry is inserted through `POST /api/tender/services`. The existing private `partner_applications` table stores it as `general`, with a versioned `TENDER_SERVICE_REQUEST_V1` JSON message. Existing schema, grants and RLS remain unchanged.
3. Administrators sign in through `/admin/operations`, then load `/admin/tender-services`. Its API requires an authenticated user with the **server-owned** `app_metadata.role = admin`; the authenticated database client also remains subject to existing admin RLS.
4. Review requests and mark reviewing or closed using the existing private partner review endpoint. A quote composer accepts the fee, currency, scope, delivery, taxes, payment and cancellation terms. It opens an email draft for manual review and sending. It does not send mail, persist a commercial agreement, collect money or mark anything paid.
5. Agree terms with the buyer and collect/reconcile the fee using the business's existing invoicing process. A later gateway integration requires an approved price catalogue, merchant account and webhook reconciliation. Closed request counts are not revenue.

## Configuration

Reuse existing Vercel server configuration: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Only public Supabase URL and anon key enter browser code. No new credentials or migration required. Intake fails closed when the private writer or distributed enquiry limiter is unavailable.

Contact identity comes from the central `SITE_CONFIG`. No outbound notification service is enabled. Requests contain business contact details, not attachments, passwords or bid prices. Existing Privacy Policy, navigation, footer and global CSS remain intact; new controls use `gth-btn` and `gth-input` with existing theme tokens.

## Resilience and validation

- Streamed request body bounded to 9 KB, strict field allowlist, consent, honeypot, email/phone/UUID validation, control/HTML rejection and message length limits.
- Client-generated UUID retained for unchanged retry payloads. A duplicate insert is acknowledged only if the complete original private submission matches; UUID collisions cannot disclose another contact's details.
- Only the server resolves tender titles. Expired/unpublished or inaccessible records cannot be attached.
- Responses use no-store; contacts are never logged or exposed through public reads. Existing shared enquiry rate limits apply. No service-role credential is used by the admin browser or admin read API.
- `tests/tender-services.test.mjs` exercises valid services, sanitization, exact idempotency, actual POST handler success/failure boundaries, source resolution and private queue guardrails.

## Release

Part of the same private candidate as the hotel white-label integration in PR #126. Do not merge or publish to the public production domain without release approval. Preview links are protected and expire; obtain a new protected share link when needed.

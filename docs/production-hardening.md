# Production hardening status

This branch is a reviewable hardening pass, not a declaration that production security is complete.

## Changes

- TypeScript 5-compatible deprecation setting restores CI typechecking.
- JSON endpoints reject malformed/non-object input and enforce streamed payload limits.
- Chat/history and AI suggestion inputs are bounded. AI providers have timeouts, output limits, safe error messages, and parsed response validation.
- Dates reject calendar rollover; integer validators reject unsafe numbers.
- Uploads verify the bearer session with Supabase getUser before parsing. Storage writes use the caller's JWT, not service-role privileges. Multipart bytes and decoded pixels are bounded. Paths are properties/<user-id>/<uuid>.webp.
- Upload UI forwards its session and stops when an upload fails.
- Remaining browser Pexels key references are removed. The image endpoint retains the key server-side.
- Hotel results use database listings instead of invented hotels, random ratings and random prices.
- Public tour/destination queries are bounded and do not expose database errors.
- Hooks linting is enabled; GTHNetwork no longer invokes hooks conditionally.
- CI includes security regressions and lint, with read-only repository permissions.

## Database checks required before release

Actual policies and grants are not in this repository and have not been verified against the deployed database. Do not disable RLS to make these flows work.

Inspect pg_policies and table grants for properties, leads, bookings, destinations, tours, hotels, and storage.objects. With an anonymous client and two ordinary users, verify:

- Anonymous callers cannot update/delete listings, read private leads/bookings, or upload storage objects.
- Owners can modify only their own listings; ownership comes from auth.uid(), not an unchecked client-supplied field.
- Admin/moderation privileges use trusted app_metadata or a protected role table. Never trust user_metadata for admin authorization.
- Storage INSERT permits only the property-images bucket and paths whose first folder is properties and second folder equals auth.uid()::text. Review UPDATE/DELETE and every existing permissive policy as well: policies combine with OR.
- Public booking INSERT remains subject to a deliberate RLS policy; insert must not require public SELECT of all customer records. The route returns only a success acknowledgement and does not request customer records after insert.
- Client-side propertyService mutation methods are not authorization boundaries. RLS must prevent forged updates, status verification, and deletes regardless of UI visibility.

The public /admin page currently disables administrative controls. This pass does not enable it or introduce a service-role key.

## Remaining deployment gates

- Add shared rate limits/quotas for public AI, image, booking and upload endpoints. Per-process counters alone are insufficient on serverless deployments.
- Verify real provider credentials and provider responses in preview. Set only PEXELS_API_KEY, never NEXT_PUBLIC_PEXELS_API_KEY. If the old public key was deployed, rotate it with the provider.
- Verify login, owner property creation, upload ownership, booking access, and anonymous denial with the deployed RLS policies.
- Review remaining legacy lint suppressions independently; passing lint does not mean all recommended rules are enabled.
- Placeholder Supabase environment values used for builds establish compilation only, not live data or database access.

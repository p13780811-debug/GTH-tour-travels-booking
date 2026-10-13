# GTH PRO — Global Release & One-Person Operations

Branch: `gth-pro-consolidation-candidate-v1` (development candidate only).
The approved Real Estate visual baseline is immutable. All changes must pass
the CI approved-UI integrity gate. **Do not automatically merge to main.**

## Existing capabilities
- Global top navigation and shared ecosystem footer for non-Real-Estate routes,
  reusing theme variables. Approved Real Estate retains its specialised header/footer.
- Mega Aggregator preserved hero slider; three pillars; routes to business onboarding.
- Agent/developer property listing: existing `/real-estate/post-property`
  sign-in, review, RLS workflow (actual listing publication is not automatic).
- Property developers, agents, travel suppliers, affiliate businesses can submit
  private interest via `/partners/apply`; Contact page is connected to same secure intake.
- Restricted `/admin/operations` dashboard: Supabase-authenticated admin account
  with `app_metadata.role === 'admin'`, partner applications, review statuses,
  accessible lead and listing counts, and non-sensitive configuration indicators.
- Tender AI guided drafting remains independent: it does **not** bid, pay fees,
  sign or automatically submit on an external authority site.
- New `/robots.txt` and `/sitemap.xml` support release-controlled SEO.
- Daily read-only route monitor on main branch (only after merger); it checks
  HTTP route health, not third-party integration availability.

## Deploy-time configuration
Set required server secrets ONLY in a private environment, never in client
`NEXT_PUBLIC_` variables or Git. Existing `.env.local` is local-only, never
copied from GitHub into Vercel by merge.

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`:
  public Supabase project configuration.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only secret used by the reviewed partner
  intake endpoint. Never expose in client code, browser logs, or public Git.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: server-only
  fail-closed rate limiting for public forms, AI and authenticated updates.
- `GEMINI_API_KEY`: server-only optional chat/tender AI availability.
- Approved Travel supplier/partner tokens: server only; configure individually.
- `GTH_PUBLIC_LAUNCH_ENABLED=true`: enable crawling ONLY on the actual Vercel
  production environment once testing, inventory and policies are approved.
  Previews stay noindex by the `VERCEL_ENV` guard.

Run `npm run check:ecosystem-release` from VS Code to check configuration
presence/format, without printing values; it is **not** a live API connectivity test.

## Database migration and review
New `supabase/migrations/20261013235500_partner_applications.sql` must be
applied to the target project before partnership intake works. It creates
RLS-protected private `partner_applications`, readable/updatable only with a
Supabase-issued admin JWT. Anonymous inserts are not granted; rate-limited
server API inserts after strict validation. Existing tender migrations require
separate approval. Existing `cities` table was observed with RLS **disabled**
in the connected project: decide appropriate RLS policies before modifying
it, then review Data API grants, source licensing and database backups.

Admin email sign-in does not automatically confer an admin role. Use a
privileged Supabase dashboard/operator to authorise the right account through
server-managed `app_metadata`, not user-editable metadata. Confirm underlying
tables' admin RLS policies before expecting every count to be readable.

## Affiliate/provider limitations
A public website helps with an application but **does not create or guarantee**
approval for IRCTC, bus operators, airlines, hotel chains, OTA distributors or
affiliate programmes. Terms, data licences, payment, accreditation and API
access must be agreed directly with each provider. Do not claim partner logos,
verified supplier relationships, bookable inventory or live fares without evidence.

## User acceptance checklist
1. Mobile and desktop review on the final preview; inspect all three pillars.
2. Property owner login + unpublished listing submission + admin review.
3. Developer, agent and supplier enquiry POST -> private review queue.
4. Admin-only auth, queue status change, no ability for anonymous read/write.
5. Actual Supabase migrations; test 201, 400, 401/403, 429, 503.
6. Confirm flight/hotel/tour real catalogue, booking handoff and permitted
   affiliate URLs (never promise unavailable supplier access).
7. Confirm Tender verified official notices, draft privacy and assistant safety.
8. Confirm no forbidden public secrets; `npm run check:production-env` and
   `npm run check:ecosystem-release`.
9. Test Core Web Vitals on real mobile: LCP <= 2.5 s, INP <= 200 ms, CLS <= .1
   at p75; keyboard contrast, accessible controls and redirects.
10. Verify `robots.txt`, `sitemap.xml`, canonicals and release flag on
    final production domain; ensure no indexing for previews.
11. Use `npm run test:security`, lint, TypeScript and production build; open
    smoke-monitor checks as needed. **Manual release approval** before merge.

The CI build does NOT confirm live supplier APIs, end-to-end DB writes,
third-party accreditation, operational uptime or a completed global catalogue.

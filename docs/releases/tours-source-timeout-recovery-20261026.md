# Tours and Activities supplier-loading recovery

## Observed failure

On 26 October 2026, production deployment
`dpl_2J8hWKcxMESGq7APo8FEWPy691xB` at main `95ed427` logged repeated
`Vercel Runtime Timeout Error: Task timed out after 300 seconds` for `/tours`
and `/activities`. HTTP responses streamed the search and partner links but
left both supplier and source-backed listing loading messages unresolved.
Direct WeGoTrip London and Barcelona search and popular-product endpoints
returned HTTP 200 and original supplier records during the investigation.

PR #136 awaited only the supplier catalogue. PR #137 added an unbounded
`Promise.allSettled` over that catalogue and the optional persisted inventory
read. A stalled Supabase read therefore prevented a healthy supplier result
from rendering. Other discovery reads also lacked request deadlines. The
underlying intermittent database/network latency is observed, not attributed
to a specific provider infrastructure cause.

PR #138 is an unmerged documentation-only bus/rail plan and is unrelated.
PR #135 is also unmerged. No PR or inventory needs to be deleted to repair
this loading dependency.

## Change

- Return the first nonempty validated live or persisted supplier selection;
  an empty or failed faster source cannot hide the other source's products.
- Bound catalogue coordination to 20 seconds for live and 5 seconds for saved
  results, including a source that never settles. Public errors remain generic.
- Abort persisted-inventory reads after 4 seconds and tour listing, mapped city,
  OSM place and licensed attraction reads after 5 seconds. Tour count and record
  queries share one deadline rather than resetting the budget between stages.
- Keep source identity, city/category/currency checks, original images/URLs,
  freshness and RLS/publication gates. No database writes, schema/RLS changes,
  global CSS, protected Real Estate or partner tracking changes.
- Disable this feature branch's Vercel preview; release only through one tested
  Git merge. Never perform a manual deployment.

## Validation before release

- 516 JavaScript/TypeScript regressions pass, including five new failure-mode
  tests for stalled, empty and rejected independent sources.
- Strict TypeScript, lint, diff checks and production build (138 prerendered
  pages) pass locally with the existing CI public environment placeholders.
- Exact-head GitHub checks and post-merge live city/card verification must
  succeed before declaring the production incident resolved.
- No supplier checkout, payment, commission or physical-device QA claim.

## Production-only sitemap blocker

The PR #139 Git deployment `dpl_CHbfDDwwYnWiL446syrrvww61UEr` failed before
domain assignment: production-launch `/sitemap.xml` prerendering exceeded 60
seconds on all three attempts. The earlier CI/local build used launch-disabled
defaults and did not exercise that DB-backed branch. The old production
deployment therefore continued to serve the site.

The follow-up bounds every database source on that sitemap path: published
hotels/tenders/attractions, property SEO shard and approved guide media. SEO
shard counts also have a deadline. Preserve all existing publication, rights,
RLS, canonical, launch and failure policies; unverified dynamic URLs are never
substituted. Independent static navigation remains available through the
existing sitemap fallback. No schema or protected Real Estate code changes.

The real-configuration local build also exposed unbounded destination lookups
on prerendered destination pages and the ecosystem hub. Those reads now have
the same five-second budget and retain their existing editorial fallback.

Two regression tests explicitly run with the public launch gate enabled and
expired database deadlines; all 518 JS/TS regressions pass. The Tours CI build
step now enables production-launch behavior, so the previously missed branch
is exercised before merge. A real production-launch local build and final Git
production deployment must pass before this incident is called resolved.

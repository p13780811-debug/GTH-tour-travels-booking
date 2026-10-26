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

# GTH PRO: connected-intent upgrade (zero-paid-API first phase)

## What is actually implemented
- The connected Supabase project has `vector` 0.8.0 in the existing `extensions` schema. Migration `20261117094550_gth_vector_extension_foundation` was applied and verified on 2026-11-17. No vector data, indices or embeddings were created.
- `/search` detects multi-sector input instead of routing a combined query to the first keyword. Grounded links open the existing public property and tender searches. Read-only public/RLS behavior is unchanged. No automatic 'nearby', 'project approval', 'availability' or currency conversion is claimed.
- Deterministic parser never invokes a paid model, external API or DB writes. It uses existing curated editorial destination names only. Existing filters remain supported.
- The exact source data and selected currency remain important; '5 crore' is not assumed to be INR in a Dubai query.

## Next gates (NOT shipped)
1. **Vector semantic retrieval**: Establish model and stable dimensions, legal/public-source publication eligibility, compact projection, private writer only, batch sizes, HNSW/IVFFlat measurement, an embedding refresh queue, recall/latency tests and strict DB-quota monitoring. Keep vectors in an unexposed schema/table and enforce publisher filters and RLS before ranking. Do not build 174k vectors by default or call paid inference APIs.
2. **Edge personalization**: Existing `src/middleware.ts` handles supplier hotel redirects, flight legacy links and security headers. Preserve it. Existing tender `resolveTenderAudience` respects explicit country and trusted Vercel geographic headers. Test country-choice/currency display, regional availability and cache variants without redirect loops or IP storage before extending to home. No currency conversion without current exchange rates and a clear source; no invented UK/India registry feed.
3. **Programmatic SEO**: Reuse #218 micro-market ISR and existing conditional indexability/attraction sitemap families. Generate only grounded content on demand; do not pre-render every database row or promise indexation/traffic. Keep query pages noindex, monitor Search Console and host costs. Mass thin pages can violate Google scaled-content policies.
4. **B2B proposal PDF**: Reuse existing tender assistance/workspace. Company data must be voluntarily supplied or collected with lawful consent, not scraped without permission. Use exact published notice, separate verified requirements from editorial fit analysis, validate PDF text, set company ownership checks and rate limits. Start with user-downloadable *draft* only; send to WhatsApp solely following an explicit visitor action and verified opt-in. Never promise a tender win.

## Delivery and release constraints
- #218/#220 and #221 are open branches. This change is intentionally based on #221 to preserve brand copy and avoid accidentally touching source/handoff/legal rules. Coordinate conflicts with #220 before a combined merge.
- No production deploy, branch-preview force activation, login flow edits, RLS changes, SMS/WhatsApp sends or bulk data jobs are authorized by this branch.
- Existing centralized CSS tokens and four-pillar branding are preserved.
- Validation: six isolated Node 22 parser tests passed locally; required GitHub CI on exact branch head and full Next.js build still must be confirmed independently.

## Cost and truthfulness
Search filtering and parsing are deterministic, not a working neural semantic-search deployment. The vector extension is merely ready for future embeddings. No claim of exclusive worldwide technology, instant zero-cost edge personalization, 200k indexable pages, or automatic tender wins.

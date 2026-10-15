# GTH PRO Tender — country-first discovery (2026-10-15)

## Default visitor experience

The `/tender` page and `GET /api/tender` use a **coarse country estimate** supplied in `x-vercel-ip-country` on Vercel. They never request GPS, store visitor IPs, or infer a specific street. A manually selected ISO country wins over the estimate. The browser's `Accept-Language` controls UI labels, and `lang` lets a visitor override it.

Without a known country, local mode displays a country selector **instead of showing unrelated worldwide tenders**. The visitor can choose their own country, or explicitly choose `scope=world` to view global inventory.

## Deterministic results

1. Home-country published, future-deadline, source-verified tenders.
2. Mapped neighboring countries with available active tenders, *after* the home country's list.
3. Other countries only under explicitly selected `scope=world` (or when the user enters a different country via the selector; it becomes the new search origin).
4. Exact count, offset pagination and deadline filters. Local pagination crosses from the home list into nearby results without mixing in unrelated countries.
5. Countries are geographic neighbors from a curated map; **there is no claim of exact GPS distance**. Countries without supported proximity mapping remain country-only.

User intent takes priority over geo guesses and VPN can change the approximate country. A visitor can correct it without creating an account.

## Source language vs UI language

The UI supports English, Hindi, Bengali, Tamil, Telugu, Marathi, French, Spanish, Portuguese, German, Arabic, Ukrainian, Russian, Chinese and Japanese, with English fallbacks for a few longer advisory sentences. Government tender title, terms and attachment text are **not automatically translated**; translating legal bid conditions without provider verification can be misleading. Always consult the original authority.

## India inventory and licenses

A bounded `worldbank_india` adapter reads official World Bank procurement notices using `project_ctry_name=India`. Verified country and source IDs enter the same secure OIDC ingestion pipeline as existing World Bank notices, so deduplication is **(World Bank, reference)**; no new table and no fake inventory.

India CPPP, ePublishing and GeM official portals have immediate first-screen links for India visitors. Their notices are not copied to GTH PRO without authorized reusable public data feeds, rights, and a source-specific parser. CPPP search uses captcha and must not be bypassed. Historical India Open Contracting files (e.g. Assam 2022) are not live/open tenders.

## Test and deployment

Use tests/tender-localization.test.mjs for header-language behavior, neighbors and absence of guessed locations; tests/test_global_tenders.py for India-source provenance. CI also runs live read-only World Bank country filtering, full build, security regression and Real Estate integrity guard.

Production data updates only through the already deployed GitHub OIDC / Supabase RLS pipeline; there is no client-side private database key.

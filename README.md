# GTH PRO — Global Intelligence Ecosystem

**Real Estate · Travel · Tender · AI · Data · Automation**

GTH PRO is an independent multi-domain technology ecosystem built to connect real-world discovery, research and workflow intelligence across property, travel and procurement.

**Live ecosystem:** https://www.gthproglobal.com/

## What this repository contains

This is not a landing-page repository. It contains the product, backend, data, automation, QA and release infrastructure behind GTH PRO.

### Current public pillars

- **Real Estate** — registry research, reviewed marketplace architecture, search, saved research, comparison, buyer tools, owner submissions and rights-aware media workflows.
- **Travel** — flights, hotels, tours, activities, attractions, destinations, guides, transfers, cars and provider handoffs with source/supplier boundaries.
- **Tender** — source-aware procurement discovery, deadline context, eligibility screening, preparation workspace, saved workflows and optional assistance enquiries.

## Repository architecture snapshot

Audited from `main` on **29 October 2026**:

| Area | Current footprint |
|---|---:|
| Next.js App Router pages | 77 |
| API route handlers | 53 |
| React / TypeScript components | 196 |
| `src/lib` modules | 106 |
| Test files | 120 |
| Supabase SQL migrations | 33 |
| GitHub Actions workflows | 26 |
| Supabase Edge Functions | 7 |
| Engineering docs / runbooks | 44 |
| Tracked files in audit | 1,373 |

These are repository architecture counts, not customer, traffic, revenue or performance claims.

## Technology

- Next.js 15
- React 19
- TypeScript / JavaScript
- Python
- Supabase / PostgreSQL
- Row Level Security (RLS)
- REST APIs
- Supabase Edge Functions
- GitHub Actions
- Vercel
- PWA / installable web-app architecture
- Source-backed SEO / sitemap infrastructure

## Real Estate architecture

The Real Estate system intentionally separates different kinds of facts:

- public project / registry records
- actual sale or rent inventory
- independently reviewed/published media
- buyer enquiries and private workflows

Key areas include registry discovery, marketplace search, saved research, comparison, EMI/area tools, project dossiers, owner submissions, media review and source-aware SEO.

See:

- `docs/real-estate/production-upgrade.md`
- `docs/releases/hybrid-real-estate-portal-20261027.md`
- `docs/releases/mobile-property-discovery-20261028.md`

## Travel architecture

Travel combines customer discovery with independent supplier/provider handoffs.

Areas include:

- Flights
- Hotels and worldwide white-label search
- Tours / Activities
- Attractions
- Destinations / Guides
- Transfers / Cars
- Bus / Train readiness
- Installable app routes

Supplier identity, prices, availability and booking fulfillment remain attributed to their providers. GTH PRO does not fabricate supplier inventory or claim third-party inventory as its own.

See:

- `docs/tours/original-supplier-engine.md`
- `docs/tours/cross-partner-deep-links.md`
- `docs/releases/hotels-global-whitelabel.md`
- `docs/gth-mobile-app-v1.md`

## Tender architecture

Tender functionality is source-aware and workflow-oriented. It includes discovery, detail APIs, deadline/calendar handling, eligibility screening, a guided preparation assistant, saved workspaces and an optional quote-based assistance workflow.

It does **not** claim to automatically sign bids, pay EMD, upload to government portals or provide legal eligibility approval.

See:

- `docs/tender-functional-runbook.md`
- `docs/tender-country-language-routing.md`
- `docs/releases/tender-service-revenue.md`

## Data and automation

The repository contains Python and TypeScript workflows for:

1. source acquisition
2. validation and normalization
3. source attribution
4. structured storage
5. ranking / matching / intelligence
6. synchronization
7. product delivery

Supabase Edge Functions currently cover hotel ingestion, hotel media, open/OSM attractions, tender ingestion, guide media and tour-supplier ingestion.

## QA and release discipline

The repository contains a large regression suite and CI workflows for ecosystem release gates, Real Estate integrity, hotel/tour supplier flows, SEO health, mobile UI, data ingestion and source checks.

Production changes are designed around reviewed migrations and controlled release gates. Build/test success is not treated as proof of live supplier availability, completed third-party checkout, production data rights or external accreditation.

See:

- `docs/GTH-PRO-GLOBAL-RELEASE.md`
- `docs/GTH-PRO-LARGE-SCALE-SEO-RELEASE.md`
- `docs/production-hardening.md`
- `.github/workflows/`
- `tests/`

## Main repository areas

```text
src/app/             Product pages + API routes
src/components/      Product and interface components
src/lib/             Domain logic, security, data and integrations
backend/             Python/backend engines
scripts/             Import, audit, sync and QA utilities
supabase/migrations/ Database evolution and RLS
supabase/functions/  Server-side ingestion Edge Functions
tests/               Regression and contract tests
.github/workflows/   CI, monitoring and release gates
docs/                Architecture, runbooks and release evidence
public/              Product media and public assets
```

## Product principles

- No fabricated inventory or fake live availability.
- Registry/research data is not silently converted into marketplace inventory.
- Third-party providers retain responsibility for their own prices, availability, booking and terms.
- Public source data, supplier data and submitted private data are kept distinct.
- Privileged credentials stay server-side.
- Data publication and media rights are reviewed separately where required.
- Failure states should remain honest instead of being replaced with fake results.

## Founder / Developer

**Sanjay — Founder & Developer of GTH PRO**

Portfolio: https://gth-pro-portfolio.pages.dev/

LinkedIn: https://www.linkedin.com/in/s-sanjay-517b77141/

Business enquiries: `official@gthproglobal.com`

---

**From opportunities to real results.**

# GTH PRO Global — Global Technical Hub

**Official website:** https://www.gthproglobal.com  
**Operator:** GTH PRO, a digital initiative of Etios Profession  
**Public platform overview:** https://www.gthproglobal.com/system  
**Verification and transparency:** https://www.gthproglobal.com/verification  
**Business contact:** official@gthproglobal.com

GTH PRO Global is an operating multi-sector digital platform connecting **Travel, Real Estate, Public Tender Intelligence, and Worldwide Ticket-source Discovery**. This repository contains the Next.js web application, public discovery pages, server-side endpoints, validation, controlled integrations and deployment tests. It is not the default Next.js starter application.

## Four public platforms

| Platform | Public gateway | Actual operating model |
|---|---|---|
| Travel | [Travel](https://www.gthproglobal.com/travel) | Search and research flights, hotels, tours, activities, cruises, buses, trains, transfers and destinations; independently operated suppliers control checkout, inventory and fulfilment. |
| Real Estate | [Real Estate](https://www.gthproglobal.com/real-estate) | Browse project registry references and property markets, use buyer tools, submit properties and enquiries for review; registry data and marketplace listings have separate verification states. |
| Tender Intelligence | [Tenders](https://www.gthproglobal.com/tender) | Research source-attributed public procurement notices, view issuing authority references, and use bid-readiness and service-request workflows; official tender submissions remain with issuing authorities. |
| Worldwide Tickets | [Ticket Finder](https://www.gthproglobal.com/tickets) | Discover independent ticket sources, events and stadium guides; links do not guarantee admission, availability or endorsement. |

Public datasets in the connected Supabase instance included, at an audit snapshot on **17 November 2026**, 12,587 property records, 4,104 published public tender records, 21,700 hotel directory records and 174,819 community-mapped OSM attraction records. These counts represent **stored source references**, not completed transactions, verified legal titles, live room inventory or available event tickets. Geographic coverage and publication eligibility vary.

## Architecture and publication boundaries

- **Web application:** Next.js App Router, React and TypeScript, with centralized GTH PRO CSS design tokens, mobile-facing navigation and SEO metadata.
- **Data:** Supabase PostgreSQL for public catalog references and protected submission workflows; row-level security and server-side validation enforce different read/write scopes.
- **Hosting:** Vercel production deployment on the official domain, with independent GitHub Actions checks for TypeScript, ESLint, security and production builds.
- **Travel integrations:** distinguish supplier-hosted white-label booking entries, external affiliate or search handoffs, public destination research and independently verified booking conditions.
- **SEO:** canonical domain selection, launch-gated crawl/index controls, site identity structured data, source-quality indexing rules and public transparency pages.
- **Commercial access:** enquiry, listing and partnership request workflows. A submitted lead or registration reference is never automatic approval, government accreditation or confirmed booking inventory.

The canonical public page describing the operating model is [How GTH PRO Works](https://www.gthproglobal.com/system). The [Ecosystem Manifest](https://www.gthproglobal.com/gth-ecosystem-manifest) further describes the service relationships and data provenance once that page is deployed.

## Development and validation

Install dependencies and use the existing package scripts. Keep local or deployment credentials in protected environment settings, **never commit secrets**, and never place privileged database keys in `NEXT_PUBLIC_*` variables.

```bash
npm ci --legacy-peer-deps
npm run dev
npx tsc --noEmit
npm run lint
npm run test:security
npm run build
```

Production releases require a green build, passing relevant regression checks, verified database migrations when applicable, and explicit review of external supplier handoffs. Code committed to a feature branch is **not** equivalent to functionality deployed to the public domain. Do not describe experimental, review-only or unpublished modules as live.

## Public trust and verification

GTH PRO is not an airline, government procurement agency, official property title registry, ticket issuing authority or universal booking processor. Provider terms govern payments, reservations, refunds, tickets and fulfilment. Consult the [About page](https://www.gthproglobal.com/about), [Affiliate Disclosure](https://www.gthproglobal.com/affiliate-disclosure), [Privacy Policy](https://www.gthproglobal.com/privacy-policy) and [Contact page](https://www.gthproglobal.com/contact) for responsible-use information.

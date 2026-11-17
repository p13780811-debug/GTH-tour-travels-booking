# GTH PRO Global — Global Technical Hub

**Official website:** https://www.gthproglobal.com  
**Operator:** GTH PRO, a digital initiative of Etios Profession  
**Public platform overview:** https://www.gthproglobal.com/system  
**Verification and transparency:** https://www.gthproglobal.com/verification  
**Business contact:** official@gthproglobal.com

GTH PRO Global is an operating multi-sector digital platform combining a **Live Worldwide Booking Engine with real-time provider-operated search and booking handoffs for Worldwide Flights, Hotels, Cruises, Trains, Buses and Ground Transport** with **Real Estate buyer intelligence and B2B leads, Public Tender Intelligence, and Worldwide Ticket-source Discovery**. The connected accommodation partner Nuitee publicly reports a supplier network of **2.9 million properties worldwide**; this is its network figure, not a count of GTH PRO-owned hotels or independently verified live room availability. This repository contains the Next.js web application, public discovery pages, server-side endpoints, validation, controlled integrations and deployment tests. It is not the default Next.js starter application.

## Four public platforms

| Platform | Public gateway | Actual operating model |
|---|---|---|
| Travel | [Travel](https://www.gthproglobal.com/travel) | Operate first-party worldwide search interfaces and real-time provider handoffs for flights, hotels, tours, cruises, buses, trains, ferries, transfers and destinations, including Nuitee, Aviasales and 12Go-linked booking entry points; partner networks span millions of accommodation listings, with suppliers controlling checkout, current availability and fulfilment. |
| Real Estate | [Real Estate](https://www.gthproglobal.com/real-estate) | Research 12,500+ property records, source-backed registry references, market evidence, comparisons, saved shortlists, EMI/affordability and rental ROI planning, project claim reviews, broker onboarding, direct B2B enquiries, owner workspaces and buyer CRM; listed records are not all independently verified sale units. |
| Tender Intelligence | [Tenders](https://www.gthproglobal.com/tender) | Discover 4,000+ published public tender records, source-linked deadlines, sector and country filters, eligibility self-assessment, document and pre-bid planning, bid-readiness stages, and service-enquiry workflows; the issuing authority governs official requirements and submissions. |
| Worldwide Tickets | [Ticket Finder](https://www.gthproglobal.com/tickets) | Discover independent ticket sources, events and stadium guides; links do not guarantee admission, availability or endorsement. |

The first-party Supabase registry and procurement datasets contained **12,500+ property records** and **4,000+ published public tender records** at the November 2026 audit, alongside separately attributed OpenStreetMap attraction research. These are **stored source references and research records**, not 12,500 independently verified sale listings or tender-award guarantees. Live worldwide travel search and provider handoffs instead draw on separately operated international supplier networks. The local hotel research catalog does **not** cap the millions-scale hotel accommodation network reported by Nuitee, nor imply that all supplier inventory is bookable for every date and destination.

## Architecture and publication boundaries

- **Web application:** Next.js App Router, React and TypeScript, with centralized GTH PRO CSS design tokens, mobile-facing navigation and SEO metadata.
- **Data:** Supabase PostgreSQL for public catalog references and protected submission workflows; row-level security and server-side validation enforce different read/write scopes.
- **Hosting:** Vercel production deployment on the official domain, with independent GitHub Actions checks for TypeScript, ESLint, security and production builds.
- **Travel integrations:** a Live Worldwide Booking Engine with supplier-hosted white-label hotel search, Aviasales flights, 12Go multimodal search and partner-operated tours, cruises and transport referrals. The Nuitee supplier publicly reports 2.9 million properties globally; GTH PRO does not claim the entire supplier network is independently confirmed live inventory for any one itinerary.
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

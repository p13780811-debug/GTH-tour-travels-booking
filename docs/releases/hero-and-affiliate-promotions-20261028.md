# Compact hero and contextual promotions — 28 October 2026

This release includes the previously prepared theme-aware FREE badge and direct Home/Real Estate/Travel/Tender header/footer links, plus the owner's revised hero and button-placement request.

## Presentation and preserved behavior

A short wide property-brand carousel returns on mobile and desktop, below the six intent buttons. The existing search form is positioned at the image's bottom edge with a 50% vertical translation, so half overlaps the picture. Only existing brand imagery is used, labelled as inspiration rather than listed property photography. Search dispatch, filters, registry/offer separation, map, shortlist, comparison, seller submission and enquiries are unchanged.

All four existing buyer actions remain buttons with their original destinations. The registry preview action stays below its results. Private buyer workspace moves beside its research description. Ownership cost/affordability moves into Buyer planning. The additional registry comparison action moves beside recorded-market research. They are no longer stacked in one block.

Native horizontal snap scrolling supplies touch/swipe behavior. Slides advance after eight seconds only while visible. Hover, keyboard focus, explicit pause, hidden pages and reduced-motion preferences stop autoplay; manual previous/next remain available. Resize observation is stable across slides, avoiding an interruption halfway through a smooth transition.

## Affiliate promotions

The owner's signed-in Travelpayouts project (source 504342, marker 417668) lists Klook as an available program. Current official guidance states that old static banners were discontinued on 15 June 2026:
https://support.travelpayouts.com/hc/en-us/articles/203638508-Banners

The release therefore uses GTH-designed affiliate promotion cards, not retired official static-banner embeds or a claim of Google advertising. Three destination/category promotions reuse the existing validated single-click Klook handoff: Mumbai tours, London activities and Dubai airport transfers. Their existing redirect keeps campaign 137, marker 417668, p 4110 and trs 504342. There are no invented deals, prices, availability claims, bookings or advertiser endorsements.

The two carousel placements sit between discovery/research and planning/market sections. Only real user clicks initiate a partner request; rotation does not refresh third-party embeds or generate artificial clicks. Existing city images are illustrative destination media. Links are disclosed as affiliate promotions and carry sponsored/nofollow/noopener/noreferrer attributes. The separate in-house Travel/Tender platform cards remain clearly labelled.

## Verification

All 578 local regressions, ESLint and TypeScript passed. Carousel tests exercise rotation/wrap, a single resize observer, offscreen slide focus exclusion, pause conditions, cleanup and manual navigation. Affiliate tests resolve every promotion through the existing tracked handoff and check publisher/campaign and destination preservation. Existing buyer-action destinations are checked for retention. Final CI and live geometry/theme checks are recorded in the release handoff.

No CSS file, global color token, environment file, database policy, schema, registry record or importer is changed. New integrity-guard allowances cover only the explicitly requested Real Estate presentation components. Physical-phone testing is distinct from cloud-browser verification and is not claimed.

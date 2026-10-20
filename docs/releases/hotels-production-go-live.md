# GTH PRO Hotels production release gates
Public hotel pages must use GTH PRO persistent slugs; supplier IDs are internal.
Exact-property external booking CTAs require verified property mapping AND verified deep-link destination, not a generic partner homepage or unverified shortlink.
Generic searches must be clearly labelled and external tabs disclosed.
Nuitee production requires dashboard production access, payment method and payout setup. Confirm Merchant of Record, markup, refund and cancellation responsibility first.
Production credential stays server-side and separate from sandbox. Never expose production keys in public JavaScript.
Production checkout needs guest date/occupancy offer selection, recheck, prebook, payment, idempotent booking confirmation, customer support, cancellation handling and reconciliation.
No live booking claims from sandbox test results. Release only after complete QA and one consolidated final main merge.
References: https://docs.liteapi.travel/docs/getting-a-sandbox-key ; https://docs.liteapi.travel/docs/revenue-management-and-commission ; https://support.travelpayouts.com/hc/en-us/articles/360027634052-How-to-create-and-use-affiliate-links
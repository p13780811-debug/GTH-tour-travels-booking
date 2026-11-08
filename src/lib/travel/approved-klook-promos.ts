/**
 * Editorial offer discovery. No coupon is published without a documented
 * Travelpayouts-issued/approved promotion. Ordinary Klook deal browsing
 * and exact destination searches never imply an active discount.
 */
export type ApprovedKlookPromo = {
  id: string;
  code: string;
  title: string;
  discountLabel: string;
  conditions: string;
  region: string;
  issuedThrough: "travelpayouts";
  approvedAtUtc: string;
  expiresAtUtc: string;
};
// Deliberately empty until the owner's programme supplies authorised codes.
// Do NOT scrape Klook's public promo codes or copy screenshots into this list.
export const approvedKlookPromos: readonly ApprovedKlookPromo[] = [];

export function activeApprovedKlookPromos(now = Date.now()): ApprovedKlookPromo[] {
  return approvedKlookPromos.filter(promo =>
    promo.issuedThrough === "travelpayouts" &&
    /^[-A-Z0-9]{3,32}$/.test(promo.code) &&
    Number.isFinite(Date.parse(promo.expiresAtUtc)) &&
    Date.parse(promo.expiresAtUtc) > now &&
    Number.isFinite(Date.parse(promo.approvedAtUtc)) &&
    Date.parse(promo.approvedAtUtc) <= now
  );
}

/** Uses the exact owner-approved Klook campaign already used by partnerSearch. */
export function buildTrackedKlookDealsHref(): string {
  const target = new URL("https://www.klook.com/deals/");
  const affiliate = new URL("https://tp.media/r");
  affiliate.searchParams.set("campaign_id", "137");
  affiliate.searchParams.set("marker", "417668");
  affiliate.searchParams.set("p", "4110");
  affiliate.searchParams.set("trs", "504342");
  affiliate.searchParams.set("sub_id", "gth_klook_deals");
  affiliate.searchParams.set("u", target.href);
  return affiliate.href;
}

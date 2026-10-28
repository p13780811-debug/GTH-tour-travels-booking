/** Public referral identifiers verified in the owner's Travelpayouts link builder.
 * No API credential is needed for a destination search handoff.
 */
export const PARTNER_SEARCH_KINDS = ["tours", "activities", "cars", "transfers"] as const;
export type PartnerSearchKind = typeof PARTNER_SEARCH_KINDS[number];

const intent: Record<PartnerSearchKind, string> = {
  tours: "tours", activities: "activities", cars: "car rental", transfers: "airport transfer",
};

export function parsePartnerSearch(input: Record<string, unknown>):
  {ok: true; kind: PartnerSearchKind; destination: string; category: string} | {ok: false} {
  if (typeof input.kind !== "string" || !PARTNER_SEARCH_KINDS.includes(input.kind as PartnerSearchKind)) return {ok: false};
  if (typeof input.destination !== "string" || (input.category !== undefined && typeof input.category !== "string")) return {ok: false};
  const destination = input.destination.normalize("NFKC").trim().replace(/\s+/gu, " ");
  const category = typeof input.category === "string" ? input.category.trim() : "";
  // Locations are text, never URLs, PostgREST operators or redirect destinations.
  if (destination.length < 2 || destination.length > 80 || !/^[\p{L}\p{M}\p{N}\s.'’-]+$/u.test(destination)) return {ok: false};
  if (category.length > 50 || (category && !/^[A-Za-z -]+$/.test(category))) return {ok: false};
  return {ok: true, kind: input.kind as PartnerSearchKind, destination, category};
}

export function partnerSearchHref(kind: PartnerSearchKind, destination: string, category = ""): string | null {
  const parsed = parsePartnerSearch({kind, destination, category});
  if (!parsed.ok) return null;
  return "/api/travel/partner-search?" + new URLSearchParams({kind, destination: parsed.destination, ...(category ? {category: parsed.category} : {})});
}

/** Fixed provider origin and campaign prevent this public route becoming an open redirect. */
export function buildPartnerSearch(input: Record<string, unknown>): string | null {
  const parsed = parsePartnerSearch(input);
  if (!parsed.ok) return null;
  const destination = new URL("https://www.klook.com/en-IN/search/result/");
  destination.searchParams.set("query", `${parsed.destination} ${parsed.category || intent[parsed.kind]}`);
  const tracked = new URL("https://tp.media/r");
  tracked.searchParams.set("campaign_id", "137");
  tracked.searchParams.set("marker", "417668");
  tracked.searchParams.set("p", "4110");
  tracked.searchParams.set("trs", "504342");
  tracked.searchParams.set("sub_id", `gth_${parsed.kind}_search`);
  tracked.searchParams.set("u", destination.href);
  return tracked.href;
}

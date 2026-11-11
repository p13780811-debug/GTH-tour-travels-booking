/**
 * Already-present GTH PRO attraction partners, never a live ticket inventory.
 * KKday's existing Travelpayouts short link is tracked; the public Tiqets
 * destination has NO confirmed affiliate attribution until an approved link
 * or verified program-specific widget is provided.
 */
export const ATTRACTION_TICKET_PARTNERS = {
  kkday: {
    name: "KKday",
    href: "https://kkday.tpo.lv/ytfvDLam",
    tracked: true,
    type: "partner-landing",
  },
  tiqets: {
    name: "Tiqets",
    href: "https://www.tiqets.com/en/",
    tracked: false,
    type: "partner-landing",
  },
} as const;

/** Categories help users choose a relevant partner; they never imply paid entry. */
const ENTRY_CATEGORIES = new Set([
  "museum","zoo","theme-park","fort","castle","monument",
  "archaeological-site","attraction",
]);
export function isTicketOrientedCategory(category:string):boolean {
  return ENTRY_CATEGORIES.has(category);
}

/** Supplier searches linked from OSM place detail pages are query-based, not an exact product match. */
export function attractionTicketQueryLabel(category:string):string {
  return isTicketOrientedCategory(category) ? "Explore possible admission tickets" : "Explore nearby tours and activities";
}

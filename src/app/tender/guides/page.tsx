import {permanentRedirect} from "next/navigation";

/** Compatibility for published /tender/guides links.
 * Never interpret the editorial guide slug as a tender UUID or hit the catalog.
 * /knowledge/tenders is the canonical source of the approved educational hub.
 */
export default function LegacyTenderGuideRedirect(){
  permanentRedirect("/knowledge/tenders");
}

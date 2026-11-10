/**
 * Deterministic discovery mapping for an already-published ODbL attraction.
 *
 * IMPORTANT: This is NOT a supplier/product join. The public OSM payload is
 * source data, not a ticket or a verified partner inventory match. We can
 * generate destination-search affiliate links from it in-memory, without a
 * per-attraction database row, privileged client, API request or new ISR page.
 *
 * Real source-backed WeGoTrip products remain in the RLS-protected Tours
 * catalogue, linked through the existing /tours?city=... route. Any exact
 * product affiliate link must still originate from a provider-approved link.
 */
import {osmPlaceLinks,validOsmPlace,type OsmPlace} from "./osm-place";

export type AttractionDiscoveryLink = Readonly<{
 provider:"klook"|"getyourguide"|"wegotrip";
 href:string;
 navigation:"external_affiliate_search"|"internal_verified_source_catalog";
 intent:"discovery_only";
 exact_product_match:false;
 date_specific_availability:false;
}>;

export type AttractionAffiliateMapping = Readonly<{
 status:"search_available"|"invalid_source";
 source_id:string;
 links:readonly AttractionDiscoveryLink[];
 bookable_on_gth:false;
 exact_product_match:false;
 /** No supplier/API/DB calls are made by this mapper. */
 requires_supplier_api:false;
}>;

/**
 * Constant-time per-place URL generation over the existing public inventory
 * payload. Parent directory queries still enforce existing Supabase RLS.
 * Nothing here reads private candidate catalogs or alters SEO/indexing gates.
 */
export function mapAttractionAffiliateDiscovery(row:OsmPlace):AttractionAffiliateMapping{
 if(!validOsmPlace(row))return {
  status:"invalid_source",source_id:typeof row?.source_id==="string"?row.source_id:"",
  links:[],bookable_on_gth:false,exact_product_match:false,requires_supplier_api:false,
 };
 const links=osmPlaceLinks(row);
 return {status:"search_available",source_id:row.source_id,bookable_on_gth:false,
  exact_product_match:false,requires_supplier_api:false,links:[
   {provider:"klook",href:links.klook,navigation:"external_affiliate_search",
    intent:"discovery_only",exact_product_match:false,date_specific_availability:false},
   {provider:"getyourguide",href:links.getyourguide,navigation:"external_affiliate_search",
    intent:"discovery_only",exact_product_match:false,date_specific_availability:false},
   {provider:"wegotrip",href:links.tours,navigation:"internal_verified_source_catalog",
    intent:"discovery_only",exact_product_match:false,date_specific_availability:false},
  ]};
}

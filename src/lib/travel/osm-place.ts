/** Source facts only. An OSM place is not a supplier product or ticket. */
import type {Place} from "./osmAttractions";
import {GETYOURGUIDE_PARTNER_ID} from "./cruise-provider-search";
export type OsmPlace=Place & {updated_at?:string;wikidata_qid?:string|null;source_region?:string};
export const OSM_SEO_CACHE_SECONDS=86400;
const SOURCE=/^(node|way|relation)\/([1-9][0-9]{0,18})$/;
const SLUG=/^(node|way|relation)-([1-9][0-9]{0,18})$/;
const CATEGORIES=new Set(["attraction","museum","viewpoint","zoo","theme-park","fort","castle","ruins","monument","archaeological-site","beach","national-park","park","nature-reserve"]);
export function osmPlacePath(sourceId:string):string|null{
 const match=SOURCE.exec(sourceId);return match?`/attractions/osm/${match[1]}-${match[2]}`:null;
}
export function osmSourceId(slug:string):string|null{
 const match=SLUG.exec(slug);return match?`${match[1]}/${match[2]}`:null;
}
export function validOsmPlace(row:OsmPlace|null):row is OsmPlace{
 return !!row&&!!osmPlacePath(row.source_id)&&typeof row.name==="string"&&row.name.trim().length>=3&&row.name.length<=180&&
 CATEGORIES.has(row.category)&&row.source_url==="https://www.openstreetmap.org/"+row.source_id&&row.source_license==="ODbL-1.0"&&
 Number.isFinite(row.latitude)&&Number.isFinite(row.longitude)&&Math.abs(row.latitude)<=90&&Math.abs(row.longitude)<=180;
}
/** Generic/poorly located records stay usable but out of search discovery. */
export function isIndexableOsmPlace(row:OsmPlace|null):boolean{
 if(!validOsmPlace(row)||!row.country_code||!/^[A-Z]{2}$/.test(row.country_code)||!row.country_name?.trim()||
 !/[\p{L}\p{N}]/u.test(row.name))return false;
 const name=row.name.normalize("NFKC").toLocaleLowerCase("en").trim().replace(/[-_]/g," ");
 return ![...CATEGORIES,"unknown","unnamed","no name","test","attractions","tourist attraction"].some(value=>name===value.replaceAll("-"," "));
}
function excerpt(value:string,max:number){return value.length>max?Array.from(value).slice(0,max-1).join("").trimEnd()+"…":value;}
export function osmPlaceSeo(row:OsmPlace){
 const location=[row.city,row.country_name].filter(Boolean).join(", ");
 return {title:excerpt(`${row.name}${location?" in "+location:""} — Visitor Guide | GTH PRO`,118),
 description:excerpt(`Explore ${row.name}${location?" in "+location:""}: ${row.category.replaceAll("-"," ")} map location, directions, source facts and independent tour searches. Check current access, tickets and opening hours with the venue or provider.`,285)};
}
export function osmPlaceLinks(row:OsmPlace){
 const query=[row.name,row.city,row.country_name].filter(Boolean).join(" ");
 const klook=new URL("https://www.klook.com/en-IN/search/result/");klook.searchParams.set("query",query);
 // Existing owner-approved Travelpayouts/Klook campaign. No API/token per visit.
 const tracked=new URL("https://tp.media/r");
 for(const [key,value] of Object.entries({campaign_id:"137",marker:"417668",p:"4110",trs:"504342",sub_id:"gth_osm_activities",u:klook.href}))tracked.searchParams.set(key,value);
 const gyg=new URL("https://www.getyourguide.com/s/");
 for(const [key,value] of Object.entries({q:query,partner_id:GETYOURGUIDE_PARTNER_ID,utm_medium:"online_publisher",cmp:"gth_osm_activities"}))gyg.searchParams.set(key,value);
 const coords=`${row.latitude},${row.longitude}`;
 const map=new URL("https://www.openstreetmap.org/");map.searchParams.set("mlat",String(row.latitude));map.searchParams.set("mlon",String(row.longitude));map.hash=`map=16/${row.latitude}/${row.longitude}`;
 const directions=new URL("https://www.google.com/maps/dir/");directions.searchParams.set("api","1");directions.searchParams.set("destination",coords);
 const city=row.city?.trim();
 const tours=city&&city.length<=70&&/^[\p{L}\p{M}\p{N} .’'-]+$/u.test(city)?"/tours?"+new URLSearchParams({city}):"/tours";
 return {klook:tracked.href,getyourguide:gyg.href,map:map.href,directions:directions.href,tours};
}
export function osmPlaceSchema(row:OsmPlace,canonical:string){
 const modified=row.updated_at&&Number.isFinite(Date.parse(row.updated_at))?new Date(row.updated_at).toISOString():null;
 return {"@context":"https://schema.org","@type":"TouristAttraction","@id":canonical+"#place",url:canonical,name:row.name,
 description:osmPlaceSeo(row).description,category:row.category.replaceAll("-"," "),
 geo:{"@type":"GeoCoordinates",latitude:row.latitude,longitude:row.longitude},
 ...(row.city||row.country_code?{address:{"@type":"PostalAddress",...(row.city?{addressLocality:row.city}:{}),...(row.country_code?{addressCountry:row.country_code}:{})}}:{}),
 sameAs:[row.source_url,...(row.wikidata_qid&&/^Q[1-9][0-9]{0,14}$/.test(row.wikidata_qid)?["https://www.wikidata.org/wiki/"+row.wikidata_qid]:[])],
 ...(modified?{subjectOf:{"@type":"CreativeWork",url:canonical,isBasedOn:row.source_url,dateModified:modified,license:"https://opendatacommons.org/licenses/odbl/1-0/",creditText:"© OpenStreetMap contributors"}}:{})};
}

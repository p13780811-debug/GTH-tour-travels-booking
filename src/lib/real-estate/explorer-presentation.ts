import {approvedMedia} from "./approved-media";
import type {ExplorerProperty} from "./explorer";

/** Government registry records are not for-sale offers. Approved photos are essential
 * for visual sale/rent cards, but never required for a documentary registry table. */
export function hasApprovedPropertyPhoto(p:ExplorerProperty):boolean{
 const reviewed=p.publishedMedia?.some(media=>
   (media.media_type==="photo"||media.media_type==="render")&&
   typeof media.published_at==="string"&&Boolean(media.id)
 );
 return Boolean(reviewed||approvedMedia(p.slug,p.image));
}
export function isPropertyVisualCard(p:ExplorerProperty):boolean{
 return !p.registry_only&&!p.data_quality_limited&&hasApprovedPropertyPhoto(p);
}
export function isReraRegistryRow(p:ExplorerProperty):boolean{
 return Boolean(p.rera_id&&/^P[0-9]{11}$/.test(p.rera_id)&&
    (p.registry_only||p.data_quality_limited||!hasApprovedPropertyPhoto(p)));
}
export function splitPropertyPresentation(rows:readonly ExplorerProperty[]){
 return {
  cards:rows.filter(isPropertyVisualCard),
  registry:rows.filter(isReraRegistryRow),
  withheld:rows.filter(p=>!isPropertyVisualCard(p)&&!isReraRegistryRow(p)).length,
 };
}
/** Only trusted official domains may be surfaced as registry links. */
export function officialMahaReraUrl(value:unknown):string|null{
 if(typeof value!=="string"||value.length>2048)return null;
 try{
  const u=new URL(value);
  if(u.protocol!=="https:"||u.username||u.password||u.port)return null;
  if(!["maharera.maharashtra.gov.in","www.maharera.maharashtra.gov.in",
    "maharera.mahaonline.gov.in","www.maharera.mahaonline.gov.in"].includes(u.hostname.toLowerCase()))return null;
  return u.toString();
 }catch{return null;}
}

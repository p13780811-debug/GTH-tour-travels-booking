/** CC0 attraction directory; NOT tour inventory, sellable tickets, or verified operators. */
export type OpenAttraction={
 wikidata_qid:string;name:string;description:string|null;region_slug:"goa"|"maharashtra";
 category:"attraction"|"fort"|"beach"|"national-park"|"castle";latitude:number;longitude:number;
 wikidata_url:string;source_license:"CC0-1.0";image_url:string|null;commons_page:string|null;
 image_author:string|null;image_license:string|null;image_license_url:string|null;
};
export type ApprovedTourLink={wikidata_qid:string;partner:"getyourguide"|"viator";approved_url:string;provider_product_ref:string|null};
export function safeAffiliateUrl(value:unknown):string|null{
 if(typeof value!=="string"||value.length>2048)return null;
 try{const u=new URL(value),host=u.hostname.toLowerCase();
  if(u.protocol!=="https:"||u.username||u.password||u.port)return null;
  if(!["getyourguide.com","viator.com","tp.media","tpo.lv"].some(h=>host===h||host.endsWith("."+h)))return null;
  return u.toString();
 }catch{return null;}
}
export function safeCommonsMedia(value:unknown):string|null{
 if(typeof value!=="string"||value.length>1600)return null;
 try{const u=new URL(value);return u.protocol==="https:"&&u.hostname==="upload.wikimedia.org"&&u.pathname.startsWith("/wikipedia/commons/")&&!u.username&&!u.password&&!u.port?u.toString():null;}
 catch{return null;}
}

/**
 * Shareable public research link; NO broker identity verification, private data,
 * external QR service, database write, cookies or analytics.
 */
export const MAX_CATALOG_PROJECTS=5;
const SLUG=/^[a-z0-9][a-z0-9._-]{1,89}$/;
const PHONE=/^\+?[0-9]{10,15}$/;
const NAME=/^[\p{L}\p{M}\p{N} .'-]{2,60}$/u;

export function catalogSlugs(raw:unknown):string[]{
 if(typeof raw!=="string"||raw.length>600)return [];
 const values=raw.split(",").map(x=>x.trim()).filter(Boolean);
 if(values.length<1||values.length>MAX_CATALOG_PROJECTS||values.some(x=>!SLUG.test(x)))return [];
 return [...new Set(values)];
}
export function catalogContact(rawName:unknown,rawPhone:unknown){
 const name=typeof rawName==="string"?rawName.normalize("NFKC").trim():"";
 const phone=typeof rawPhone==="string"?rawPhone.trim():"";
 return NAME.test(name)&&PHONE.test(phone)?{name,phone}:null;
}
export function catalogHref(slugs:string[],name:string,phone:string){
 if(slugs.length<1||slugs.length>MAX_CATALOG_PROJECTS||catalogSlugs(slugs.join(",")).length!==slugs.length)
  return null;
 const contact=catalogContact(name,phone);
 if(!contact)return null;
 return "/real-estate/mini-catalog?"+new URLSearchParams({projects:slugs.join(","),broker:contact.name,phone:contact.phone}).toString();
}

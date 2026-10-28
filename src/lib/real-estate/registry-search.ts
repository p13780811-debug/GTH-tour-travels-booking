export type RegistryFilters={q:string;district:string;developer:string;year:string;sort:"name"|"registered_newest"|"completion_earliest";page:number};
export const REGISTRY_PAGE_SIZE=35,REGISTRY_COMPARE_KEY="gth-registry-compare-v1";
export function parseRegistryFilters(raw:Record<string,unknown>):{ok:true;filters:RegistryFilters}|{ok:false;error:string}{
 try{
  const text=(key:string)=>{const v=raw[key];if(v===undefined||v==="")return "";if(typeof v!=="string")throw Error();const clean=v.normalize("NFKC").trim().replace(/\s+/gu," ");if(clean.length>70||!/^[\p{L}\p{M}\p{N} .&'’-]*$/u.test(clean))throw Error();return clean;};
  const q=text("q"),district=text("district"),developer=text("developer"),year=raw.year??"",sort=raw.sort||"name",page=raw.page||"1";
  if(typeof year!=="string"||(year&&!/^(?:19\d{2}|20\d{2}|2100)$/.test(year))||typeof sort!=="string"||!["name","registered_newest","completion_earliest"].includes(sort)||typeof page!=="string"||!/^[1-9]\d{0,3}$/.test(page)||Number(page)>1000)throw Error();
  return {ok:true,filters:{q,district,developer,year,sort:sort as RegistryFilters["sort"],page:Number(page)}};
 }catch{return {ok:false,error:"Use a valid project search, district, developer, recorded year and results page."};}
}
export function registryHref(f:RegistryFilters,page=f.page){const p=new URLSearchParams();for(const key of ["q","district","developer","year"] as const)if(f[key])p.set(key,f[key]);if(f.sort!=="name")p.set("sort",f.sort);if(page>1)p.set("page",String(page));return "/real-estate/registry"+(p.size?"?"+p:"");}
export function normalizeRegistrySelection(v:unknown):string[]{return Array.isArray(v)?[...new Set(v.filter((s):s is string=>typeof s==="string"&&s.length<=160&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)))].slice(0,3):[];}
export function registryCompareSlugs(v:unknown):string[]|null{if(typeof v!=="string"||v.length>482)return null;const slugs=v.split(",");return slugs.length>=2&&slugs.length<=3&&new Set(slugs).size===slugs.length&&normalizeRegistrySelection(slugs).length===slugs.length?slugs:null;}

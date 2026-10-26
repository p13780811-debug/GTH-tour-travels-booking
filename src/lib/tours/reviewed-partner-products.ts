/** Supplier-approved product mapping. Never construct guessed product URLs from place names. */
export type PartnerProvider = "klook" | "kkday" | "tiqets";
export type PartnerExperience = "city-tour" | "audio-tour" | "day-trip" | "attraction-ticket" | "city-pass" | "outdoor";
export type ReviewedPartnerProduct = {
  provider: PartnerProvider;
  provider_product_id: string;
  title: string;
  city: string;
  country: string;
  experience_category: PartnerExperience;
  source_url: string;
  image_url: string;
  image_width: number;
  image_height: number;
  media_rights_verified: true;
  source_type: "approved_partner_feed";
  source_checked_at: string;
  price_numeric: number | null;
  currency: string | null;
};
const HOSTS: Record<PartnerProvider, readonly string[]> = {
  klook: ["klook.com","www.klook.com"],
  kkday: ["kkday.com","www.kkday.com"],
  tiqets: ["tiqets.com","www.tiqets.com"],
};
const PATTERNS: Record<PartnerProvider, RegExp> = {
  klook: /^\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?activity\/([1-9]\d*)-[a-z0-9-]+\/?$/,
  kkday: /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?product\/([1-9]\d*)(?:-[a-z0-9-]+)?\/?$/,
  tiqets: /^\/[a-z]{2}\/[a-z0-9-]+\/[a-z0-9-]+-p([1-9]\d*)\/?$/,
};
const CATEGORIES = new Set<PartnerExperience>(["city-tour","audio-tour","day-trip","attraction-ticket","city-pass","outdoor"]);
function safeHttps(value:unknown): URL | null {
  if(typeof value !== "string" || value.length>2048)return null;
  try{
    const u=new URL(value);
    if(u.protocol!=="https:" || u.username || u.password || u.port || u.hash || 
       !u.hostname.includes(".") || u.hostname==="localhost" ||
       /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname) || u.hostname.endsWith(".localhost"))return null;
    return u;
  }catch{return null;}
}
export function reviewedPartnerProduct(input:unknown,now=Date.now()):ReviewedPartnerProduct|null {
  if(!input || typeof input!=="object" || Array.isArray(input))return null;
  const r=input as Record<string,unknown>;
  if(r.provider!=="klook" && r.provider!=="kkday" && r.provider!=="tiqets")return null;
  const provider=r.provider;
  if(r.source_type!=="approved_partner_feed" || r.media_rights_verified!==true)return null;
  const ident=r.provider_product_id;
  if(typeof ident!=="string" || !/^[1-9]\d{0,17}$/.test(ident))return null;
  const url=safeHttps(r.source_url),img=safeHttps(r.image_url);
  if(!url || !img || !HOSTS[provider].includes(url.hostname) || url.search || !PATTERNS[provider].test(url.pathname))return null;
  if(PATTERNS[provider].exec(url.pathname)?.[1]!==ident)return null;
  if(typeof r.title!=="string" || r.title.trim().length<5 || r.title.length>240 ||
     typeof r.city!=="string" || r.city.trim().length<2 || r.city.length>100 ||
     typeof r.country!=="string" || r.country.trim().length<2 || r.country.length>100 ||
     !CATEGORIES.has(r.experience_category as PartnerExperience))return null;
  if(typeof r.image_width!=="number" || !Number.isInteger(r.image_width) || r.image_width<640 ||
     typeof r.image_height!=="number" || !Number.isInteger(r.image_height) || r.image_height<360)return null;
  if(typeof r.source_checked_at!=="string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(r.source_checked_at))return null;
  const checked=Date.parse(r.source_checked_at);
  if(!Number.isFinite(checked) || checked>now || now-checked>30*86400000)return null;
  const price=r.price_numeric===null?null:r.price_numeric;
  if(price!==null && (typeof price!=="number" || !Number.isFinite(price) || price<=0))return null;
  if(r.currency!==null && (typeof r.currency!=="string" || !/^[A-Z]{3}$/.test(r.currency)))return null;
  return {
    provider,provider_product_id:ident,title:r.title.trim(),city:r.city.trim(),country:r.country.trim(),
    experience_category:r.experience_category as PartnerExperience,source_url:url.href,image_url:img.href,
    image_width:r.image_width,image_height:r.image_height,media_rights_verified:true,
    source_type:"approved_partner_feed",source_checked_at:r.source_checked_at,
    price_numeric:price as number|null,currency:r.currency as string|null,
  };
}
export function eligiblePartnerProducts(rows:readonly unknown[], city:string, category:string, mode:"/tours"|"/activities", currency="",now=Date.now()):ReviewedPartnerProduct[]{
  const approvedCategories=mode==="/tours"?new Set(["city-tour","audio-tour","day-trip"]):new Set(["attraction-ticket","city-pass","outdoor"]);
  const normalizedCity=city.normalize("NFKC").trim().toLocaleLowerCase();
  const seen=new Set<string>();
  const result:ReviewedPartnerProduct[]=[];
  for(const input of rows.slice(0,1000)){
    const product=reviewedPartnerProduct(input,now);
    if(!product || !approvedCategories.has(product.experience_category) ||
       (category && product.experience_category!==category) ||
       (normalizedCity && product.city.normalize("NFKC").toLocaleLowerCase()!==normalizedCity) ||
       (currency && product.currency!==currency))continue;
    const key=product.provider+":"+product.provider_product_id;
    if(seen.has(key))continue;
    seen.add(key);result.push(product);
    if(result.length>=12)break;
  }
  return result;
}

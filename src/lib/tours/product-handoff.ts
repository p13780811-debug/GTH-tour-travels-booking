/**
 * Exact supplier product redirect gate for individually reviewed tour listings.
 * A generic referral URL or homepage can never be an "exact booking" target.
 * The stored original supplier product URL must identify the SAME product.
 * This does not independently certify operator availability or supplier status.
 */
type Product = {host:string; id:string; url:URL};
const HOSTS=["klook.com","getyourguide.com","viator.com","tiqets.com","kkday.com","wegotrip.com"] as const;
function hostMatch(hostname:string):string|null{
  return HOSTS.find(host=>hostname===host||hostname.endsWith("."+host))??null;
}
function exact(value:unknown):Product|null{
  if(typeof value!=="string"||value.length>2048)return null;
  try{
    const url=new URL(value),host=hostMatch(url.hostname.toLowerCase());
    if(!host||url.protocol!=="https:"||url.username||url.password||url.port)return null;
    const path=url.pathname;
    let matched:RegExpMatchArray|null=null;
    if(host==="klook.com")matched=path.match(/\/activity\/([1-9]\d{2,})[-/]?/i);
    if(host==="getyourguide.com")matched=path.match(/-t([1-9]\d{2,})(?:\/|$)/i);
    if(host==="viator.com")matched=path.match(/\/d\d+-([1-9]\d+[A-Z0-9]*)/i);
    if(host==="tiqets.com")matched=path.match(/-p([1-9]\d{2,})(?:\/|$)/i);
    if(host==="kkday.com")matched=path.match(/\/product\/([1-9]\d{2,})(?:[/?]|$)/i);
    if(host==="wegotrip.com")matched=path.match(/\/(?:p|product\/)([1-9]\d{2,})(?:[/?]|$)/i);
    if(!matched)return null;
    return {host,id:matched[1].toLowerCase(),url};
  }catch{return null;}
}
export function verifiedTourProductHandoff(affiliate:unknown,source:unknown):string|null{
  const original=exact(source);
  if(!original||typeof affiliate!=="string"||affiliate.length>2048)return null;
  const direct=exact(affiliate);
  if(direct&&direct.host===original.host&&direct.id===original.id)return direct.url.toString();
  try{
    const wrapped=new URL(affiliate);
    if(wrapped.protocol!=="https:"||wrapped.hostname!=="tp.media"||
       wrapped.pathname!=="/r"||wrapped.username||wrapped.password||wrapped.port)return null;
    const destinations=wrapped.searchParams.getAll("u");
    if(destinations.length!==1)return null;
    const partner=exact(destinations[0]);
    if(partner&&partner.host===original.host&&partner.id===original.id)
      return wrapped.toString();
    return null;
  }catch{return null;}
}

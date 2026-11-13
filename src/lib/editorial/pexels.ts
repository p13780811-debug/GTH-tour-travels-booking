import "server-only";

/**
 * Limited editorial Pexels enhancement: source-aware illustrations remain the
 * canonical/sitemap images. Only individual static blog detail pages call this.
 * The image search is kept behind the server-only environment variable, uses
 * Next's long-lived fetch cache and never accepts untrusted search strings.
 */
const queries:Record<string,{query:string;kind:string}>={
 "australia-cricket-afl-music-ticket-guide":{query:"cricket stadium sports crowd",kind:"sports"},
 "tender-eligibility-prequalification-checklist":{query:"office paperwork checklist documents",kind:"documents"},
 "gem-versus-cppp-public-procurement-india":{query:"government office building documents",kind:"documents"},
 "earnest-money-deposit-tender-performance-security":{query:"office documents financial paperwork",kind:"documents"},
 "tender-corrigendum-bid-deadline-document-control":{query:"business documents desk calendar",kind:"documents"},
 "rfp-technical-financial-bid-response-checklist":{query:"business proposal document meeting",kind:"documents"},
 "international-tenders-ungm-ted-world-bank-guide":{query:"global business meeting documents",kind:"documents"},
};
const photoHost=(value:unknown)=>{try{const u=new URL(String(value));return u.protocol==="https:"&&u.hostname==="images.pexels.com"?u.href:null;}catch{return null;}};
const sourceHost=(value:unknown)=>{try{const u=new URL(String(value));return u.protocol==="https:"&&u.hostname==="www.pexels.com"?u.href:null;}catch{return null;}};
export type PexelsEditorialPhoto={src:string;photographer:string;source:string;alt:string};
export async function findEditorialPexelsPhoto(slug:string):Promise<PexelsEditorialPhoto|null>{
 const target=queries[slug],key=process.env.PEXELS_API_KEY;
 if(!target||!key)return null;
 const params=new URLSearchParams({query:target.query,orientation:"landscape",per_page:"4",page:"1"});
 try{
  const response=await fetch("https://api.pexels.com/v1/search?"+params.toString(),{
   headers:{Authorization:key,Accept:"application/json"},
   next:{revalidate:60*60*24*30},
   signal:AbortSignal.timeout(2500),
  });
  if(!response.ok)return null;
  const payload=await response.json() as {photos?:Array<{id?:number;src?:{landscape?:string;large?:string};url?:string;photographer?:string;alt?:string;width?:number;height?:number}>};
  if(!Array.isArray(payload.photos))return null;
  const image=payload.photos.find(item=>{
   const alt=(item.alt||"").toLowerCase();
   const relevant=target.kind==="sports"?/sport|stadium|cricket|match|football|pitch|field|game/i.test(alt):/business|document|paper|work|office|desk|file|writing|meeting/i.test(alt);
   return relevant&&Boolean(photoHost(item.src?.landscape||item.src?.large))&&Boolean(sourceHost(item.url))
    &&Number(item.width)>800&&Number(item.height)>500;
  });
  if(!image)return null;
  const src=photoHost(image.src?.landscape||image.src?.large);
  const source=sourceHost(image.url);
  if(!src||!source)return null;
  const photographer=String(image.photographer||"Pexels contributor").slice(0,110).replace(/[<>]/g,"");
  return {src,source,photographer,alt:target.kind==="sports"?"Illustrative sports venue photograph, not an identified Australian stadium":"Illustrative business documentation photograph"};
 }catch{return null;}
}

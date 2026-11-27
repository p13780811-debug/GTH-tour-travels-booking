// Only this Worker ingress may translate Cloudflare's trusted, approximate
// request.cf location into the existing hotel audience contract. Never trust
// caller-supplied geo headers or ask the browser for precise location.
const fields={"x-vercel-ip-country":"country","x-vercel-ip-city":"city",
 "x-vercel-ip-latitude":"latitude","x-vercel-ip-longitude":"longitude"};
export function hotelGeoRequest(request){
 const headers=new Headers(request.headers);
 for(const name of Object.keys(fields))headers.delete(name);
 const geo=request.cf;
 if(geo&&typeof geo==="object"){
  const country=typeof geo.country==="string"?geo.country.toUpperCase():"";
  if(/^[A-Z]{2}$/.test(country)){
   headers.set("x-vercel-ip-country",country);
   if(typeof geo.city==="string"){
    const city=geo.city.normalize("NFKC").trim().replace(/\s+/gu," ");
    if(city.length>=2&&city.length<=80&&/^[\p{L}\p{M} .'-]+$/u.test(city))
     headers.set("x-vercel-ip-city",encodeURIComponent(city));
   }
   // Country/city suffice for auto discovery; only forward valid approximate coordinates.
   const number=(value,limit)=>((typeof value==="string"&&value.trim()!=="")||typeof value==="number")&&Number.isFinite(Number(value))&&Math.abs(Number(value))<=limit;
   if(number(geo.latitude,90)&&number(geo.longitude,180)){
    headers.set("x-vercel-ip-latitude",String(Number(geo.latitude)));
    headers.set("x-vercel-ip-longitude",String(Number(geo.longitude)));
   }
  }
 }
 return new Request(request,{headers});
}

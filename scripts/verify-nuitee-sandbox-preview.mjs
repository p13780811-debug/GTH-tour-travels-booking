// Preview-build-only Nuitee supplier smoke test. Never logs credentials or full hotel data.
const preview = process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === "feat/gth-five-smart-upgrades-20261020" &&
  process.env.GTH_NUITEE_MODE === "sandbox" && process.env.GTH_NUITEE_SANDBOX_ENABLED === "true";
if (!preview) { console.log("[Nuitee QA] skipped outside isolated staging preview"); process.exit(0); }
const key=process.env.NUITEE_SANDBOX_API_KEY;
if (!key || !/^(sand_|sandbox_)[A-Za-z0-9_-]{10,}$/.test(key)) {
 console.error("[Nuitee QA] no valid sandbox credential available to preview build");process.exit(1);
}
const timeout=AbortSignal.timeout(15000);
async function call(url){
 const r=await fetch(url,{headers:{"X-API-Key":key,accept:"application/json"},signal:timeout});
 if(!r.ok){console.error("[Nuitee QA] supplier HTTP "+r.status);process.exit(1)}
 return await r.json();
}
try {
 const d=await call("https://api.liteapi.travel/v3.0/data/hotels?countryCode=IN&cityName=Mumbai&limit=5&offset=0");
 if(!Array.isArray(d?.data)){console.error("[Nuitee QA] invalid listing response");process.exit(1)}
 const named=d.data.filter(h=>typeof h?.name==="string"&&typeof h?.id==="string");
 console.log("[Nuitee QA] Mumbai listing: records="+d.data.length+" validIdsAndNames="+named.length);
 if(!named.length){console.error("[Nuitee QA] no valid Mumbai hotels returned");process.exit(1)}
 const id=named[0].id;
 const detail=await call("https://api.liteapi.travel/v3.0/data/hotel?hotelId="+encodeURIComponent(id));
 const hotel=detail?.data;
 const photos=hotel?.hotelImages ?? hotel?.images ?? [];
 console.log("[Nuitee QA] detail: idMatched="+Boolean(hotel?.id===id)+" name="+Boolean(hotel?.name)+" address="+Boolean(hotel?.address)+" images="+(Array.isArray(photos)?photos.length:0));
 if(!hotel||hotel.id!==id){console.error("[Nuitee QA] detail ID mismatch");process.exit(1)}
 const checkin="2026-11-20",checkout="2026-11-21";
 const rateResult=await fetch("https://api.liteapi.travel/v3.0/hotels/rates",{
  method:"POST",headers:{"X-API-Key":key,accept:"application/json","Content-Type":"application/json"},
  body:JSON.stringify({hotelIds:named.map(h=>h.id),checkin,checkout,currency:"USD",guestNationality:"IN",occupancies:[{adults:2}],maxRatesPerHotel:3,timeout:10}),
  signal:AbortSignal.timeout(20000)
 });
 if(rateResult.status===204){console.error("[Nuitee QA] rates returned 204 no availability");process.exit(1)}
 if(!rateResult.ok){console.error("[Nuitee QA] rates supplier HTTP "+rateResult.status);process.exit(1)}
 const rateData=await rateResult.json();
 const offer=(Array.isArray(rateData?.data)?rateData.data:[]).flatMap(h=>Array.isArray(h?.roomTypes)?h.roomTypes:[]).find(x=>typeof x?.offerId==="string")?.offerId;
 console.log("[Nuitee QA] rate search: hotels="+(Array.isArray(rateData?.data)?rateData.data.length:0)+" offerAvailable="+Boolean(offer));
 if(!offer){console.error("[Nuitee QA] no prebookable offer returned");process.exit(1)}
 const pre=await fetch("https://book.liteapi.travel/v3.0/rates/prebook",{
 method:"POST",headers:{"X-API-Key":key,accept:"application/json","Content-Type":"application/json"},
 body:JSON.stringify({offerId:offer,usePaymentSdk:false}),signal:AbortSignal.timeout(25000)
 });
 if(!pre.ok){console.error("[Nuitee QA] prebook supplier HTTP "+pre.status);process.exit(1)}
 const preData=await pre.json();
 console.log("[Nuitee QA] prebook: sessionCreated="+Boolean(preData?.data?.prebookId)+" noReservationRequested=true");
 if(!preData?.data?.prebookId)process.exit(1);
 console.log("[Nuitee QA] PASS listing/details/rates/prebook (sandbox only, no booking charged)");
} catch(e){console.error("[Nuitee QA] request failed: "+(e?.name==="TimeoutError"?"timeout":"supplier or network error"));process.exit(1)}

import "server-only";

export type UsdInrReference={rate:number;asOf:string};

const RATE_ENDPOINT="https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR";

/** Public reference FX only; never mistake this estimate for a supplier checkout quote. */
export async function getUsdInrReference():Promise<UsdInrReference|null>{
 try{
  const response=await fetch(RATE_ENDPOINT,{
   headers:{Accept:"application/json"},
   redirect:"error",
   signal:AbortSignal.timeout(2_000),
   next:{revalidate:12*60*60},
  });
  if(!response.ok || !response.headers.get("content-type")?.includes("application/json") ||
   Number(response.headers.get("content-length")||"0")>20_000)return null;
  const data:unknown=await response.json();
  if(!data || typeof data!=="object" || Array.isArray(data))return null;
  const record=data as Record<string,unknown>;
  const asOf=record.date;
  const rates=record.rates;
  if(record.base!=="USD"||typeof asOf!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(asOf)||
    !rates||typeof rates!=="object"||Array.isArray(rates))return null;
  const value=(rates as Record<string,unknown>).INR;
  const asOfMs=Date.parse(asOf+"T00:00:00Z");
  const age=Date.now()-asOfMs;
  if(typeof value!=="number"||!Number.isFinite(value)||value<=0||value>1000||
   !Number.isFinite(asOfMs)||age<-(24*60*60*1000)||age>8*24*60*60*1000)return null;
  return {rate:value,asOf};
 }catch{return null;}
}

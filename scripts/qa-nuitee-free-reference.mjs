/** Local-only currency fixture. Never contacts a real supplier or loads a key. */
import {createServer} from "node:http";
import {writeFile} from "node:fs/promises";
import {HOTEL_CURRENCY_OPTIONS} from "../src/lib/travel/hotel-currency.ts";
let requests=0,currencies=0,hotels=0;
const server=createServer((req,res)=>{
  res.setHeader("Content-Type","application/json");
  if(req.url==="/__fixture"){res.end(JSON.stringify({requests,currencies,hotels}));return;}
  const url=new URL(req.url,"http://127.0.0.1");
  if(req.method!=="GET"||req.headers["x-api-key"]!=="fixture-private-currency-key"||!["/v3.0/data/currencies","/v3.0/data/hotels"].includes(url.pathname)){res.statusCode=403;res.end('{"error":"Fixture rejects this request"}');return;}
  requests++;
  if(url.pathname==="/v3.0/data/currencies"){currencies++;res.end(JSON.stringify({data:HOTEL_CURRENCY_OPTIONS.map(item=>({code:item.code,currency:item.name,countries:[]}))}));return;}
  hotels++;const p=url.searchParams,country=p.get("countryCode"),city=p.get("cityName"),offset=Number(p.get("offset"));
  if(!/^[A-Z]{2}$/.test(country||"")||p.get("limit")!=="24"||!Number.isInteger(offset)||offset<0||offset>2376){res.statusCode=400;res.end('{}');return;}
  const primary=country==="GB"?"London":country==="AE"?"Dubai":"Mumbai";
  const data=city==="Nowhere"?[]:Array.from({length:24},(_,i)=>{
    const place=city||(i%2?primary:country==="GB"?"Manchester":"Pune"),index=offset+i+1;
    return {id:"lpfixture"+country+Buffer.from(place).toString("hex")+index,name:"Fixture "+place+" profile "+index,city:place,country,address:"QA address, not a real hotel",main_photo:"https://fixture-hotel-photos.invalid/qa.svg",stars:3,latitude:19+index/100,longitude:72.8};
  }).reverse();res.end(JSON.stringify({data}));
});
await writeFile("/tmp/gth-nuitee-free-fixture.cjs",String.raw`
const previousFetch=globalThis.fetch;
globalThis.fetch=async function(input,init){
 const request=new Request(input,init),url=new URL(request.url);
 if(url.hostname!=='api.liteapi.travel')return previousFetch(input,init);
 if(!['/v3.0/data/currencies','/v3.0/data/hotels'].includes(url.pathname)||request.method!=='GET'||request.headers.get('x-api-key')!=='fixture-private-currency-key')throw Error('Fixture rejects non-free or non-fixture supplier request');
 return new Promise((resolve,reject)=>{
  const call=require('node:http').request({hostname:'127.0.0.1',port:4312,path:url.pathname+url.search,method:'GET',headers:Object.fromEntries(request.headers),signal:request.signal},response=>{
   let body='';response.on('data',part=>body+=part);response.on('end',()=>resolve(new Response(body,{status:response.statusCode,headers:{'content-type':'application/json'}})));
  });call.on('error',reject);call.end();
 });
};`);
server.listen(4312,"127.0.0.1",()=>console.log("Free currency fixture ready; all other private supplier paths rejected"));
process.on("SIGTERM",()=>server.close());

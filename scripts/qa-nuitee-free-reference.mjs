/** Local-only currency fixture. Never contacts a real supplier or loads a key. */
import {createServer} from "node:http";
import {writeFile} from "node:fs/promises";
import {HOTEL_CURRENCY_OPTIONS} from "../src/lib/travel/hotel-currency.ts";
let requests=0;
const server=createServer((req,res)=>{
  res.setHeader("Content-Type","application/json");
  if(req.url==="/__fixture"){res.end(JSON.stringify({requests}));return;}
  if(req.url!=="/v3.0/data/currencies"||req.method!=="GET"||req.headers["x-api-key"]!=="fixture-private-currency-key"){res.statusCode=403;res.end('{"error":"Fixture rejects this request"}');return;}
  requests++;res.end(JSON.stringify({data:HOTEL_CURRENCY_OPTIONS.map(item=>({code:item.code,currency:item.name,countries:[]}))}));
});
await writeFile("/tmp/gth-nuitee-free-fixture.cjs",String.raw`
const previousFetch=globalThis.fetch;
globalThis.fetch=async function(input,init){
 const request=new Request(input,init),url=new URL(request.url);
 if(url.hostname!=='api.liteapi.travel')return previousFetch(input,init);
 if(url.pathname!=='/v3.0/data/currencies'||url.search||request.method!=='GET'||request.headers.get('x-api-key')!=='fixture-private-currency-key')throw Error('Fixture rejects non-currency or non-fixture supplier request');
 return new Promise((resolve,reject)=>{
  const call=require('node:http').request({hostname:'127.0.0.1',port:4312,path:url.pathname,method:'GET',headers:Object.fromEntries(request.headers),signal:request.signal},response=>{
   let body='';response.on('data',part=>body+=part);response.on('end',()=>resolve(new Response(body,{status:response.statusCode,headers:{'content-type':'application/json'}})));
  });call.on('error',reject);call.end();
 });
};`);
server.listen(4312,"127.0.0.1",()=>console.log("Free currency fixture ready; all other private supplier paths rejected"));
process.on("SIGTERM",()=>server.close());

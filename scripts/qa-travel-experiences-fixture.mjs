/** Local-only supplier catalogue fixture. No real provider, booking or private API. */
import {createServer} from "node:http";
import {writeFile} from "node:fs/promises";
let requests=0;
const cities=["Mumbai","Agra","Jaipur","London","Dubai","Paris"].map((name,index)=>({id:100+index,name,slug:name.toLowerCase(),country:index<3?"India":name==="London"?"United Kingdom":name==="Dubai"?"United Arab Emirates":"France",available:true,type:"city",itemsCount:3}));
const server=createServer((req,res)=>{
 res.setHeader("content-type","application/json");const url=new URL(req.url,"http://127.0.0.1");
 if(url.pathname==="/__fixture"){res.end(JSON.stringify({requests,fixtureOnly:true}));return;}
 if(req.method!=="GET"||!['/api/v2/search/','/api/v2/cities/','/api/v2/products/popular/'].includes(url.pathname)){res.statusCode=403;res.end('{}');return;}
 requests++;let results=[];
 if(url.pathname.endsWith('/search/'))results=cities.filter(city=>city.name.toLowerCase()===url.searchParams.get('query')?.toLowerCase());
 if(url.pathname.endsWith('/cities/'))results=cities.slice(3);
 if(url.pathname.endsWith('/products/popular/')){
  const city=cities.find(item=>String(item.id)===url.searchParams.get('city'));
  if(city)results=Array.from({length:3},(_,i)=>({id:100000+city.id*10+i,city:{id:city.id,slug:city.slug},title:`Fixture ${city.name} attraction ticket ${i+1}`,slug:`fixture-attraction-${i+1}`,preview:`https://app.wegotrip.com/media/fixture-${city.slug}-${i+1}.jpg`,type:2,tags:{available:true},locale:"en",price:25+i*10,currencyCode:"USD"}));
 }
 res.end(JSON.stringify({data:{results}}));
});
await writeFile('/tmp/gth-travel-experiences-fixture.cjs',String.raw`
const catalogPreviousFetch=globalThis.fetch;
globalThis.fetch=async function(input,init){
 const request=new Request(input,init),url=new URL(request.url);
 if(url.hostname!=='app.wegotrip.com')return catalogPreviousFetch(input,init);
 if(request.method!=='GET'||!['/api/v2/search/','/api/v2/cities/','/api/v2/products/popular/'].includes(url.pathname))throw Error('Fixture rejects non-catalogue provider access');
 return new Promise((resolve,reject)=>{
  const call=require('node:http').request({hostname:'127.0.0.1',port:4313,path:url.pathname+url.search,method:'GET',signal:request.signal},response=>{
   let body='';response.on('data',part=>body+=part);response.on('end',()=>resolve(new Response(body,{status:response.statusCode,headers:{'content-type':'application/json'}})));
  });call.on('error',reject);call.end();
 });
};`);
server.listen(4313,'127.0.0.1',()=>console.log('Explicit local experience catalogue fixture ready'));
process.on('SIGTERM',()=>server.close());

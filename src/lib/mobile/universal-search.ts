import {destinations} from "@/data/destinations";

/**
 * Navigation only: reuse existing Travel, hotel directory, flight, property and
 * tender search engines. Never interpret text as an authenticated booking,
 * source ID, live price or a verified property.
 */
export type UniversalCategory="all"|"travel"|"hotel"|"flight"|"tour"|"property"|"tender"|"ticket"|"destination";
export type UniversalTarget={category:UniversalCategory;href:string};
const CATEGORIES:readonly UniversalCategory[]=["all","travel","hotel","flight","tour","property","tender","ticket","destination"];
const clean=(input:unknown)=>typeof input==="string"
 ?input.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,70):"";
const queryString=(data:Record<string,string>)=>new URLSearchParams(data).toString();
const knownCities=destinations.map(d=>({name:d.name,slug:d.slug})).sort((a,b)=>b.name.length-a.name.length);

export function normalizeUniversalCategory(raw:unknown):UniversalCategory {
 return typeof raw==="string"&&CATEGORIES.some(c=>c===raw)?raw as UniversalCategory:"all";
}
function detectedKind(text:string):UniversalCategory{
 if(/\b(tenders?|procurement|e-?procurement|rfp|bids?|bid notices?|gem)\b/i.test(text))return "tender";
 if(/\b(real estate|properties|property|villas?|apartments?|flats?|penthouses?|plots?|homes?|housing|[1-9]\s*bhk|(?:maha)?rera|registry|registration)\b/i.test(text))return "property";
 if(/\b(hotels?|resorts?|stays?|accommodations?|lodging|guest\s*houses?|hostels?|motels?|rooms?)\b/i.test(text))return "hotel";
 if(/\b(flights?|airfares?|airlines?|air\s*tickets?)\b/i.test(text))return "flight";
 if(/\b(tickets?|stadiums?|cricket|afl|rugby|football matches?|sporting events?|concerts?|theat(?:re|er)|comedy shows?|festivals?|cinema|museums?|theme parks?|live events?)\b/i.test(text))return "ticket";
 if(/\b(tours?|activities|attractions?|sightseeing|excursions?|experiences|things to do)\b/i.test(text))return "tour";
 if(/\b(destinations?|cities|travel to|visit|places to visit)\b/i.test(text))return "destination";
 return "all";
}
const matchCity=(text:string)=>{
 const lower=text.toLocaleLowerCase("en").replace(/-/g," ");
 return knownCities.find(city=>new RegExp("(^|[^\\p{L}])"+city.name.toLocaleLowerCase("en").replace(/[- ]/g,"[ -]")+"(?=$|[^\\p{L}])","u").test(lower));
};
const trimKeywords=(text:string,re:RegExp)=>text.replace(re," ").replace(/\s+/g," ").trim();
const hotelWords=/\b(?:hotels?|resorts?|stays?|rooms?|accommodations?|lodging|guest\s*houses?|hostels?|motels?|search|find|book|booking|available|best|cheap|top|in|near|at|around|for)\b/gi;

/**
 * Public hotel searches mean supplier booking, not an incomplete GTH OSM
 * directory. A bare city name is NOT a Nuitee placeId: the SDK must confirm
 * a real supplier destination before showing dated room inventory.
 */
function hotelTarget(query:string):string{
 const cleaned=trimKeywords(query,hotelWords);
 const city=matchCity(cleaned);
 if(city){
  const remainder=cleaned.replace(new RegExp("(^|[^\\p{L}])"+city.name.replace(/[- ]/g,"[ -]")+"(?=$|[^\\p{L}])","iu")," ").replace(/\s+/g," ").trim();
  return "/app/hotels?"+queryString({
   view:"booking",city:city.name,...(remainder.length>=2?{name:remainder}:{})
  });
 }
 const byCity=query.match(/\b(?:hotels?|resorts?|stays?|rooms?|accommodations?)\s+(?:in|near|at)\s+([\p{L}\p{M}][\p{L}\p{M} .'-]{1,65})$/iu);
 if(byCity)return "/app/hotels?"+queryString({view:"booking",city:clean(byCity[1])});
 const beforeHotel=query.match(/^([\p{L}\p{M}][\p{L}\p{M} .'-]{1,65})\s+(?:hotels?|resorts?|stays?)$/iu);
 if(beforeHotel&&beforeHotel[1].trim().split(/\s+/).length<=2)
  return "/app/hotels?"+queryString({view:"booking",city:clean(beforeHotel[1])});
 return "/app/hotels?"+queryString({view:"booking",...(cleaned?{name:cleaned}:{})});
}
export function resolveUniversalTarget(raw:unknown,requested?:unknown):UniversalTarget{
 const query=clean(raw);
 const selected=normalizeUniversalCategory(requested);
 const detected=detectedKind(query);
 const category=selected==="all"||selected==="travel"?
  (detected!=="all"?detected:selected):selected;
 if(!query){
  const homepage:Record<UniversalCategory,string>={
   all:"/app/explore",travel:"/app/destinations",hotel:"/app/hotels",
   flight:"/app/flights",tour:"/tours",property:"/app/property",
   tender:"/app/tenders",ticket:"/tickets",destination:"/app/destinations"
  };
  return {category,href:homepage[category]};
 }
 if(category==="hotel")return {category,href:hotelTarget(query)};
 if(category==="property"){
  const subject=trimKeywords(query,/\b(?:find|search|real estate|properties|property|in|near|for|buy|rent)\b/gi);
  if(/\b(rera|registry|registration)\b/i.test(query))
   return {category,href:"/real-estate/registry?"+queryString({q:trimKeywords(subject,/\b(?:rera|registry|registration)\b/gi)||query})};
  // Complex searches need the existing property's advanced type/BHK/price parsers.
  if(/\b([1-9]\s*bhk|apartments?|flats?|villas?|plots?|rent|sale|under|below|[0-9]+\s*(?:lakh|crore))\b/i.test(query))
   return {category,href:"/search?"+queryString({q:query,category:"property"})};
  return {category,href:"/app/property?"+queryString({q:subject||query})};
 }
 if(category==="tender")return {category,href:"/app/tenders?"+queryString({
  q:trimKeywords(query,/\b(?:find|search|tenders?|procurement|e-?procurement|rfp|bidding|bid notices?|for|in)\b/gi)||query
 })};
 if(category==="ticket")return {category,href:"/tickets?"+queryString({q:query})};
 if(category==="flight")return {category,href:"/app/flights"};
 if(category==="tour")return {category,href:"/tours?"+queryString({
  city:trimKeywords(query,/\b(?:find|search|tours?|activities|attractions?|sightseeing|excursions?|experiences|things to do|in|near|at)\b/gi)||query
 })};
 if(category==="destination")return {category,href:"/app/destinations?"+queryString({
  q:trimKeywords(query,/\b(?:find|search|destinations?|cities|travel to|visit|places? to visit|in|near)\b/gi)||query
 })};
 if(category==="travel"){
  const city=matchCity(query);
  return city?{category,href:"/app/destinations/"+city.slug}:
   {category,href:"/app/destinations?"+queryString({q:query})};
 }
 return {category:"all",href:"/app/explore?"+queryString({q:query})+"#search-results"};
}

/**
 * Deterministic intent mapping over existing search routes.
 * "AI-native" is the interaction style; this parser never invents supplier data.
 */
export type SmartCategory = "property" | "hotel" | "tour" | "flight" | "tender" | "all";
export type SmartIntent = { category: SmartCategory; href: string; filters: Record<string,string>; notice: string };
const CITIES = ["Mumbai","Goa","Paris","Dubai","London","Delhi","New Delhi","Bengaluru","Bangalore","Pune","Kolkata","Singapore","Tokyo","Bangkok","Hyderabad","Jaipur","New York"];
const SUBURBS: Record<string,string> = { andheri:"Mumbai", bandra:"Mumbai", powai:"Mumbai", worli:"Mumbai", "navi mumbai":"Mumbai", palava:"Mumbai" };
function wordMatch(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^(){}|[\]\\]/g, "\\$&");
  return new RegExp("(?:^|[^\\p{L}])" + escaped + "(?=$|[^\\p{L}])", "iu").test(haystack);
}
function cityFor(q:string): string {
  const city = [...CITIES].sort((a,b)=>b.length-a.length).find(name=>wordMatch(q,name));
  if(city) return city === "Bangalore" ? "Bengaluru" : city === "New Delhi" ? "Delhi" : city;
  const suburb = Object.keys(SUBURBS).sort((a,b)=>b.length-a.length).find(name=>wordMatch(q,name));
  return suburb ? SUBURBS[suburb] : "";
}
function priceInRupees(q:string): number | null {
  const match = q.match(/\b(?:under|below|up to|upto|within|less than|max(?:imum)?)\s*(?:rs\.?\s*|inr\s*|₹\s*)?(\d+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|l|million|m)\b/i);
  if(!match) return null;
  const n=Number(match[1]); const unit=match[2].toLowerCase();
  const factor=/^(cr|crore)/.test(unit)?10000000:/^(l|lakh|lac)/.test(unit)?100000:1000000;
  const result=Math.round(n*factor);
  return Number.isSafeInteger(result)&&result>0&&result<=1000000000000?result:null;
}
export function smartSearchTarget(input:string, forced?:SmartCategory):SmartIntent {
  const q = input.normalize("NFKC").replace(/[\u0000-\u001f]/g," ").trim().slice(0,180);
  const category:SmartCategory = forced && forced!=="all" ? forced :
    /\b(tenders?|rfp|procurement|bid notices?)\b/i.test(q)?"tender":
    /\b(properties|property|real estate|apartments?|flats?|penthouses?|villas?|plots?|[1-9]\s*bhk)\b/i.test(q)?"property":
    /\b(hotels?|resorts?|accommodation|guesthouses?)\b/i.test(q)?"hotel":
    /\b(flights?|airfares?|airlines?)\b/i.test(q)?"flight":
    /\b(tours?|excursions?|activities)\b/i.test(q)?"tour":"all";
  const city=cityFor(q);
  const filters:Record<string,string> = {};
  const add=(key:string,value:string|null|undefined)=>{if(value)filters[key]=value};
  if(category==="property"){
    add("city",city);
    const beds=q.match(/\b([1-9])\s*bhk\b/i);
    if(beds){add("bedrooms",beds[1]);add("type","Apartment")}
    else if(/\bvillas?\b/i.test(q))add("type","Villa");
    else if(/\bpenthouses?\b/i.test(q))add("type","Penthouse");
    else if(/\bapartments?|flats?\b/i.test(q))add("type","Apartment");
    if(/\b(rent|rental|lease)\b/i.test(q))add("listing","rent");
    else if(/\b(buy|purchase|for sale)\b/i.test(q))add("listing","buy");
    const price=priceInRupees(q);
    if(price!==null){add("maxPrice",String(price));add("currency","INR")}
    const places=Object.keys(SUBURBS).sort((a,b)=>b.length-a.length);
    const locality=places.find(p=>wordMatch(q,p));
    if(locality)add("query",locality);
    const href="/real-estate"+(Object.keys(filters).length?"?"+new URLSearchParams(filters):"")+"#listing-results";
    return {category,href,filters,notice:"Searches recorded project fields and published inventory; missing listings are not invented."};
  }
  if(category==="hotel"){
    add("city",city);
    const href="/hotels"+(city?"?"+new URLSearchParams({city}):"");
    return {category,href,filters,notice:"Landmarks and hotel styles are search preferences, not verified proximity filters. Refine with supplier details."};
  }
  if(category==="tour"){
    add("city",city);
    return {category,href:"/tours"+(city?"?"+new URLSearchParams({city}):"")+"#discover",filters,notice:"Tour offers are independently confirmed by booking partners."};
  }
  if(category==="flight")return {category,href:"/flights#flight-search",filters,notice:"Aviasales White Label handles airports, dates, prices and ticket booking."};
  if(category==="tender")return {category,href:"/tender?"+new URLSearchParams({q:q.slice(0,100)}),filters,notice:"Verify official tender documentation and deadlines."};
  return {category:"all",href:"/search?"+new URLSearchParams({q:q.slice(0,100)}),filters,notice:"Explore source-backed results."};
}

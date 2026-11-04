/** Deterministic, no-cost drafting from submitter-provided facts; never verifies a listing. */
export const INTAKE_MAX_CHARS = 1200;
export type IntakeKey = "title"|"country"|"city"|"location"|"description"|"property_type"|"listing_type"|"currency"|"price_amount"|"bedrooms"|"bathrooms"|"area_value"|"area_unit"|"area_basis"|"possession_status"|"registry_reference"|"agent_registration";
export type IntakeFields = Partial<Record<IntakeKey,string>>;
export type IntakeDraft = {fields:IntakeFields;recognized:string[];review:string[];missing:string[]};

const CITIES = ["Navi Mumbai","Mumbai","Dombivli","Kalyan","Thane","Panvel","Pune","Kolkata","Delhi","Bengaluru","Hyderabad","Chennai","Noida","Gurugram","Ahmedabad","Jaipur","Surat","Nagpur","Goa","Dubai","Abu Dhabi","Singapore","London"] as const;
const LOCALITIES = ["Lodha Palava","Palava","Dombivli East","Dombivli West","Kalyan East","Kalyan West","Thane West","Thane East","CBD Belapur","Kopar Khairane","Bandra West","Bandra East","Andheri West","Andheri East","Mira Road","Bhayandar","Airoli","Ghansoli","Vashi","Nerul","Kharghar","Taloja","Ulwe","Seawoods","Kamothe","Powai","BKC","Colaba","Borivali","Dadar","Mulund","Chembur","Ghatkopar","Malad","Kurla","Fort","Virar","Vasai"] as const;
const INDIA_CITIES:ReadonlySet<string> = new Set(CITIES.slice(0,19));
function found(source:string,terms:readonly string[]):string|undefined {
  return terms.find(term=>new RegExp("(?:^|[^a-z])"+term.replace(/\s+/g,"\\s+")+"(?=$|[^a-z])","i").test(source));
}
function priceFrom(text:string):{value:string;currency:string}|null {
  // Treat compound Indian prices as one figure; never silently drop lakhs.
  const compound=text.match(/\\b(\\d{1,5}(?:\\.\\d+)?)\\s*(?:crores?|cr)\\s*(\\d{1,5}(?:\\.\\d+)?)\\s*(?:lakhs?|lacs?|lac|l)\\b/i);
  if(compound){
    const amount=Number(compound[1])*1e7+Number(compound[2])*1e5;
    if(!Number.isFinite(amount)||amount<=0||amount>999999999999)return null;
    return {value:String(amount),currency:"INR"};
  }
  const tagged=text.match(/(?:₹|\bINR\b|\bRs\.?(?=\s)|\bAED\b|\bUSD\b|\bGBP\b|\bEUR\b|\bSGD\b)\s*([\d,]+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|lac|lakh|l|million|mn)?/i);
  const scaled=text.match(/\b(\d{1,5}(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|lac|lakh|l|million|mn)\b/i);
  const match=tagged||scaled;
  if(!match)return null;
  const base=Number(match[1].replace(/,/g,""));
  const unit=(match[2]||"").toLowerCase();
  const factor=/^(crore|cr)/.test(unit)?1e7:/^(lakh|lac|l$)/.test(unit)?1e5:/^(million|mn)/.test(unit)?1e6:1;
  const amount=base*factor;
  if(!Number.isFinite(amount)||amount<=0||amount>999999999999||Math.abs(Math.round(amount*100)-amount*100)>0.001)return null;
  const prefix=(tagged?tagged[0]:"").toUpperCase();
  const currency=prefix.includes("AED")?"AED":prefix.includes("USD")?"USD":prefix.includes("GBP")?"GBP":prefix.includes("EUR")?"EUR":prefix.includes("SGD")?"SGD":"INR";
  if(!tagged&&!/^(crore|cr|lakh|lac|l$)/.test(unit))return null;
  return {value:String(amount),currency};
}
function count(text:string,pattern:RegExp):string|undefined {
  const found=text.match(pattern);
  if(!found)return undefined;
  const n=Number(found[1]);
  return Number.isSafeInteger(n)&&n>=0&&n<=20?String(n):undefined;
}
function makeDescription(fields:IntakeFields):string {
  const lines:string[]=[];
  const kind=(fields.property_type||"property").toLowerCase();
  const area=[fields.location,fields.city].filter((item,index,all)=>item&&all.indexOf(item)===index).join(", ");
  const use=fields.listing_type==="rent"?" for rent":fields.listing_type==="buy"?" for sale":"";
  lines.push("A "+(fields.bedrooms?fields.bedrooms+" bedroom ":"")+kind+use+(area?" in "+area:"")+".");
  if(fields.bathrooms)lines.push("The submitter reports "+fields.bathrooms+" bathroom(s).");
  if(fields.area_value)lines.push("Reported "+(fields.area_basis?fields.area_basis.replace("_","-")+" ":"")+"area: "+fields.area_value+" "+(fields.area_unit==="sqm"?"square metres":"square feet")+".");
  if(fields.price_amount)lines.push("Stated asking price: "+fields.currency+" "+fields.price_amount+".");
  if(fields.possession_status)lines.push("Possession status reported as "+fields.possession_status.replaceAll("_"," ")+".");
  lines.push("All details are supplied by the submitter and remain subject to document and administrator review.");
  return lines.join(" ");
}
export function extractListingIntake(input:string):IntakeDraft {
  if(typeof input!=="string"||input.trim().length<8||input.length>INTAKE_MAX_CHARS)throw new Error("Describe the property in 8-"+INTAKE_MAX_CHARS+" characters.");
  const text=input.normalize("NFKC").replace(/[<>\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim();
  const fields:IntakeFields={};
  const recognized:string[]=[],review:string[]=[],missing:string[]=[];
  const types:[RegExp,string][]=[
    [/\bpenthouse\b/i,"Penthouse"],[/\b(villa|bungalow)\b/i,"Villa"],
    [/\b(office|shop|showroom|warehouse|retail|commercial)\b/i,"Commercial"],
    [/\b(plot|land|plots)\b/i,"Plot"],[/\b(flat|apartment|studio|\d\s*bhk)\b/i,"Apartment"],
  ];
  for(const [pattern,type] of types)if(pattern.test(text)){fields.property_type=type;recognized.push("Type: "+type);break;}
  if(/\b(rent|rental|lease|leasing|tenant|to let)\b/i.test(text))fields.listing_type="rent";
  else if(/\b(sell|selling|sale|resale|purchase|for sale|new launch)\b/i.test(text))fields.listing_type="buy";
  if(fields.listing_type)recognized.push("Purpose: "+(fields.listing_type==="rent"?"rent":"sale"));
  fields.bedrooms=count(text,/\b(\d{1,2})\s*(?:bhk|bedrooms?|beds?)\b/i);
  fields.bathrooms=count(text,/\b(\d{1,2})\s*(?:bathrooms?|baths?|washrooms?|toilets?)\b/i);
  if(fields.bedrooms!==undefined)recognized.push("Bedrooms: "+fields.bedrooms);
  if(fields.bathrooms!==undefined)recognized.push("Bathrooms: "+fields.bathrooms);
  const area=text.match(/\b(\d{1,7}(?:\.\d{1,2})?)\s*(sq\.?\s*ft\.?|sqft|sft|ft2|square\s*feet|sq\.?\s*m\.?|sqm|m2|square\s*met(?:er|re)s?)\b/i);
  if(area&&Number(area[1])>0&&Number(area[1])<=1000000){
    fields.area_value=area[1];fields.area_unit=/(?:sq\.?\s*m|sqm|m2|met)/i.test(area[2])?"sqm":"sqft";
    recognized.push("Area: "+fields.area_value+" "+fields.area_unit);
  }
  if(/\b(super\s*built[ -]?up|built[ -]?up)\b/i.test(text))fields.area_basis="built_up";
  else if(/\bcarpet\b/i.test(text))fields.area_basis="carpet";
  else if(/\bplot\s*area\b/i.test(text))fields.area_basis="plot";
  if(fields.area_basis)recognized.push("Area basis: "+fields.area_basis.replace("_"," "));
  const price=priceFrom(text);
  if(price){fields.price_amount=price.value;fields.currency=price.currency;recognized.push("Price: "+price.currency+" "+price.value);}
  if(/\b(ready\s*(?:to\s*)?move|ready possession|immediate possession)\b/i.test(text))fields.possession_status="ready_to_move";
  else if(/\bunder\s*construction\b/i.test(text))fields.possession_status="under_construction";
  else if(/\boff[ -]?plan\b/i.test(text))fields.possession_status="off_plan";
  if(fields.possession_status)recognized.push("Possession: "+fields.possession_status.replaceAll("_"," "));
  const projectReg=text.match(/\bP\d{11}\b/i),agentReg=text.match(/\bA\d{11}\b/i);
  if(projectReg){fields.registry_reference=projectReg[0].toUpperCase();review.push("Confirm the MahaRERA project reference with the registry.");}
  if(agentReg){fields.agent_registration=agentReg[0].toUpperCase();review.push("Confirm agent registration from current records.");}
  const city=found(text,CITIES),locality=found(text,LOCALITIES);
  if(city){fields.city=city;recognized.push("City: "+city);}
  else if(["Palava","Lodha Palava","Dombivli East","Dombivli West"].includes(locality||"")){
    fields.city="Dombivli";review.push("Confirm the city shown on the property documents.");
  }
  if(locality){fields.location=locality;recognized.push("Locality: "+locality);}
  if(/\bIndia\b/i.test(text)||(fields.city&&INDIA_CITIES.has(fields.city)))fields.country="India";
  else if(city==="Dubai"||city==="Abu Dhabi")fields.country="United Arab Emirates";
  else if(city==="Singapore")fields.country="Singapore";
  else if(city==="London")fields.country="United Kingdom";
  if(fields.country)review.push("Confirm the country and locality against the actual address.");
  if(fields.property_type&&(fields.city||fields.location)){
    fields.title=(fields.bedrooms?fields.bedrooms+" BHK ":"")+fields.property_type+" in "+(fields.location||fields.city);
    review.push("Suggested title is descriptive, NOT a verified project name; replace if needed.");
  }
  fields.description=makeDescription(fields);
  review.push("Verify price, floor area, agency authority and listing accuracy before submission.");
  for(const [key,label] of [
    ["title","Actual property or project title"],["country","Country"],["city","City"],
    ["location","Address or locality"],["property_type","Property type"],
    ["listing_type","Sale or rental purpose"],
  ] as const)if(!fields[key])missing.push(label);
  if(!fields.price_amount)missing.push("Asking price (optional)");
  if(!fields.area_value)missing.push("Property area (optional)");
  missing.push("Your relationship to this property (select manually)","Photo rights and photographs (confirm manually)");
  return {fields,recognized,review,missing};
}

/** Local, zero-API-cost mapping for developer catalogues; never invent project identities. */
export const BULK_MAX_RECORDS = 100;
export const BULK_MAX_FILES = 10;
export const BULK_MAX_BYTES = 8 * 1024 * 1024;
export type BulkListingField =
  | "title" | "country" | "city" | "location" | "description" | "property_type"
  | "listing_type" | "price_amount" | "currency" | "bedrooms" | "bathrooms"
  | "area_value" | "area_unit" | "area_basis" | "possession_status"
  | "registry_reference" | "agent_registration";
export type BulkListingValues = Record<BulkListingField, string>;
export type BulkDraftRow = {
  id: string; source: string; values: BulkListingValues; missing: string[]; notes: string[];
  selected: boolean;
};
export type BulkDefaults = {country: string; listing_type: string; currency: string};

const KEY_ALIASES: Record<string, BulkListingField> = {
  title: "title", project: "title", projectname: "title", property: "title",
  propertyname: "title", listingname: "title", projecttitle: "title",
  country: "country", nation: "country",
  city: "city", town: "city", municipality: "city",
  location: "location", address: "location", locality: "location",
  areaaddress: "location", projectlocation: "location", projectaddress: "location",
  description: "description", details: "description", propertydescription: "description",
  projectdescription: "description",
  propertytype: "property_type", category: "property_type", type: "property_type",
  listingtype: "listing_type", purpose: "listing_type",
  salerent: "listing_type", transactiontype: "listing_type",
  price: "price_amount", askingprice: "price_amount", sellingprice: "price_amount",
  priceinr: "price_amount", priceamount: "price_amount", amount: "price_amount",
  pricelakhs: "price_amount", pricelacs: "price_amount", pricelakh: "price_amount",
  pricecr: "price_amount", pricecrores: "price_amount",
  currency: "currency", curr: "currency",
  bedrooms: "bedrooms", bedroom: "bedrooms", beds: "bedrooms", bhk: "bedrooms",
  bathrooms: "bathrooms", bathroom: "bathrooms", baths: "bathrooms",
  area: "area_value", size: "area_value", areasqft: "area_value",
  areasqm: "area_value", areavalue: "area_value", squarefeet: "area_value",
  sqft: "area_value", sqm: "area_value",
  areaunit: "area_unit", unit: "area_unit", areabasis: "area_basis",
  possession: "possession_status", possessionstatus: "possession_status",
  readiness: "possession_status",
  rera: "registry_reference", maharera: "registry_reference",
  reranumber: "registry_reference", reraregistration: "registry_reference",
  registryreference: "registry_reference",
  agentregistration: "agent_registration", agentrera: "agent_registration",
};
const REQUIRED: [BulkListingField,string,number,number][] = [
  ["title","Property/project name",3,180],
  ["country","Country",2,80], ["city","City",2,80],
  ["location","Specific address or locality",2,250],
  ["description","Property description",20,5000],
  ["property_type","Property type",1,30],
  ["listing_type","Sale/rent purpose",1,10],
];
const FIELDS: BulkListingField[] = [
  "title","country","city","location","description","property_type","listing_type",
  "price_amount","currency","bedrooms","bathrooms","area_value","area_unit",
  "area_basis","possession_status","registry_reference","agent_registration",
];
export function emptyBulkValues(): BulkListingValues {
  return Object.fromEntries(FIELDS.map(key=>[key,""])) as BulkListingValues;
}
function canonical(label: unknown): string {
  return String(label ?? "").toLowerCase().replace(/[^a-z0-9]/g,"");
}
function cell(value: unknown): string {
  if(value instanceof Date) return value.toISOString().slice(0,10);
  if(value === null || value === undefined) return "";
  return String(value).normalize("NFKC").replace(/[<>\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,5000);
}
function money(raw: string, header: string): string {
  const cleaned=raw.replace(/[₹$,\s]/g,"").replace(/^(?:INR|RS\.?)/i,"");
  const match=cleaned.match(/^(\d{1,12}(?:\.\d{1,2})?)(crores?|cr|lakhs?|lacs?|lac|l|mn|million)?$/i);
  if(!match)return raw;
  const n=Number(match[1]);
  const unit=(match[2]||"").toLowerCase();
  const column=canonical(header);
  const factor=/^(crore|cr)/.test(unit)||/price(?:cr|crores)$/.test(column)?1e7:
    /^(lakh|lac|l$)/.test(unit)||/price(?:lakhs|lakh|lacs)$/.test(column)?1e5:
    /^(million|mn)$/.test(unit)?1e6:1;
  return String(n*factor);
}
function choiceType(value:string):string {
  const t=value.toLowerCase();
  if(/\bpenthouse\b/.test(t))return "Penthouse";
  if(/\b(villa|bungalow)\b/.test(t))return "Villa";
  if(/\b(office|retail|shop|commercial|warehouse|showroom)\b/.test(t))return "Commercial";
  if(/\b(plot|land)\b/.test(t))return "Plot";
  if(/\b(flat|apartment|residential|bhk)\b/.test(t))return "Apartment";
  return value;
}
function purpose(value:string):string {
  if(/^(sale|sell|selling|buy|resale|for sale)$/i.test(value))return "buy";
  if(/^(rent|rental|lease|for rent|to let)$/i.test(value))return "rent";
  return value;
}
function positionKey(values:BulkListingValues):string {
  // Distinguish two units in one tower by area/configuration/price.
  return [values.registry_reference.toUpperCase(),values.title,values.country,values.city,
    values.location,values.property_type,values.listing_type,values.bedrooms,
    values.area_value,values.area_unit,values.price_amount]
    .map(item=>item.toLowerCase().trim().replace(/\s+/g," ")).join("|");
}
export function bulkFingerprint(values:BulkListingValues):string {
  return positionKey(values);
}
export function validateBulkValues(values:BulkListingValues):string[] {
  const issues:string[]=[];
  for(const [name,label,min,max] of REQUIRED) {
    const val=values[name].trim();
    if(val.length<min||val.length>max)issues.push(label);
    if(/[<>\u0000-\u001f\u007f]/.test(val))issues.push(label+" (plain text only)");
  }
  if(!["Apartment","Villa","Penthouse","Commercial","Plot"].includes(values.property_type))issues.push("Supported property type");
  if(!["buy","rent"].includes(values.listing_type))issues.push("Sale/rent purpose");
  if(values.currency&&!["INR","AED","USD","GBP","EUR","SGD"].includes(values.currency))issues.push("Currency");
  if(values.price_amount&&!/^\d{1,12}(?:\.\d{1,2})?$/.test(values.price_amount))issues.push("Price: numeric amount");
  else if(values.price_amount&&Number(values.price_amount)<=0)issues.push("Positive price");
  for(const field of ["bedrooms","bathrooms"] as const)
    if(values[field]&&(!/^\d{1,2}$/.test(values[field])||Number(values[field])>20))issues.push(field);
  if(values.area_value&&(!/^\d{1,7}(?:\.\d{1,2})?$/.test(values.area_value)||Number(values.area_value)<=0||Number(values.area_value)>1000000))issues.push("Valid area");
  if(values.area_value&&!["sqft","sqm"].includes(values.area_unit))issues.push("Area unit");
  if(values.area_basis&&!["carpet","built_up","plot"].includes(values.area_basis))issues.push("Area basis");
  if(values.possession_status&&!["ready_to_move","under_construction","off_plan"].includes(values.possession_status))issues.push("Possession status");
  if(values.registry_reference&&!/^P\d{11}$/.test(values.registry_reference.toUpperCase()))issues.push("Valid MahaRERA project number");
  if(values.agent_registration&&!/^[A-Za-z0-9 /-]{3,80}$/.test(values.agent_registration))issues.push("Agent registration");
  return [...new Set(issues)];
}
function factualDescription(v:BulkListingValues):string {
  const area=v.area_value ? " Reported area: "+v.area_value+" "+(v.area_unit==="sqm"?"square metres":"square feet")+"." : "";
  const bhk=v.bedrooms ? " "+v.bedrooms+" bedrooms." : "";
  const price=v.price_amount ? " Stated asking price: "+(v.currency||"INR")+" "+v.price_amount+"." : "";
  return (v.title+" in "+v.location+", "+v.city+"."+area+bhk+price+
    " All details are supplied by the listing partner and require independent review.").slice(0,5000);
}
export function enrichBulkValues(source:Partial<BulkListingValues>,defaults:BulkDefaults): {values:BulkListingValues;notes:string[]} {
  const v=emptyBulkValues(),notes:string[]=[];
  for(const name of FIELDS)v[name]=cell(source[name]);
  v.country=v.country||defaults.country;
  v.currency=(v.currency||defaults.currency||"INR").toUpperCase();
  v.listing_type=purpose(v.listing_type||defaults.listing_type);
  v.property_type=choiceType(v.property_type);
  v.registry_reference=v.registry_reference.toUpperCase();
  if(v.area_value&&!v.area_unit)v.area_unit="sqft";
  if(v.area_unit){v.area_unit=/^(m2|sqm|sq\.?\s*m|square\s*met)/i.test(v.area_unit)?"sqm":/^(ft2|sqft|sq\.?\s*ft|square\s*feet)/i.test(v.area_unit)?"sqft":v.area_unit;}
  if(!v.description&&v.title.length>=3&&v.city&&v.location){
    v.description=factualDescription(v);
    notes.push("Description generated from provided facts: confirm before submission.");
  }
  return {values:v,notes};
}
/** Strict RFC4180-style CSV/TSV parser, bounded before processing. */
export function parseDelimited(text:string,delimiter="," ,maxRows=BULK_MAX_RECORDS+25):string[][] {
  const out:string[][]=[];let row:string[]=[],field="",quoted=false;
  if(text.charCodeAt(0)===0xfeff)text=text.slice(1);
  if(text.length>2_000_000)throw new Error("Spreadsheet text is too large.");
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){
      if(quoted&&text[i+1]==='"'){field+='"';i++;}
      else if(!quoted&&field==="")quoted=true;
      else if(quoted)quoted=false;
      else throw new Error("Malformed CSV quotation.");
    } else if(ch===delimiter&&!quoted){row.push(field);field="";}
    else if((ch==="\n"||ch==="\r")&&!quoted){
      if(ch==="\r"&&text[i+1]==="\n")i++;
      row.push(field);field="";
      if(row.some(x=>x.trim()))out.push(row);
      row=[];
      if(out.length>maxRows)throw new Error("File contains more than 100 data rows. Split it into batches.");
    } else field+=ch;
  }
  if(quoted)throw new Error("Unclosed quotation in CSV.");
  row.push(field);
  if(row.some(x=>x.trim()))out.push(row);
  if(out.length>maxRows)throw new Error("File contains more than 100 data rows. Split it into batches.");
  return out;
}
export function rowsFromSheet(
  cells:readonly (readonly unknown[])[],source:string,defaults:BulkDefaults,
):BulkDraftRow[] {
  if(cells.length<2)throw new Error("File needs a header row and at least one property.");
  const head=cells[0].map(cell);
  const mapped=head.map(label=>KEY_ALIASES[canonical(label)]||null);
  const recognized=mapped.filter(Boolean).length;
  if(recognized<3||!mapped.includes("title"))throw new Error("Use columns such as Project Name, City, Location, Property Type, Listing Type and Price.");
  const rows:BulkDraftRow[]=[];
  for(let i=1;i<cells.length;i++){
    const record=cells[i];
    if(!record||!record.some(value=>cell(value)))continue;
    const data:Partial<BulkListingValues>={};
    const notes:string[]=[];
    for(let c=0;c<head.length;c++){
      const key=mapped[c];
      if(!key)continue;
      const raw=cell(record[c]);
      if(!raw)continue;
      if(key==="price_amount") data[key]=money(raw,head[c]);
      else if(key==="area_value") {data[key]=raw.replace(/,/g,"");if(/sqm|metre|meter/i.test(head[c]))data.area_unit="sqm";}
      else data[key]=raw;
    }
    const result=enrichBulkValues(data,defaults);
    if(result.notes.length)notes.push(...result.notes);
    const values=result.values;
    const missing=validateBulkValues(values);
    rows.push({id:source+":"+(i+1),source:source+" / row "+(i+1),values,missing,notes,selected:missing.length===0});
    if(rows.length>BULK_MAX_RECORDS)throw new Error("Limit 100 properties per upload; split the workbook.");
  }
  return rows;
}
export function applyBulkDuplicateWarnings(rows:BulkDraftRow[]):BulkDraftRow[] {
  const seen=new Set<string>();
  return rows.map(row=>{
    const key=bulkFingerprint(row.values);
    if(seen.has(key))return {...row,missing:[...new Set([...row.missing,"Duplicate property in uploaded files"])],selected:false};
    seen.add(key);
    return row;
  });
}
export const BULK_TEMPLATE_HEADERS = [
  "Project Name","Country","City","Location","Property Type","Listing Type",
  "Description","Price INR","BHK","Bathrooms","Area Sqft","Area Basis",
  "Possession Status","RERA Number"
];
export function csvTemplate():string {
  return "\uFEFF"+BULK_TEMPLATE_HEADERS.join(",")+"\r\n"+
   '"Sample Apartment, India",India,Dombivli,Palava,Apartment,buy,"Example only - replace with your actual project details before uploading.",8500000,2,2,950,carpet,ready_to_move,\r\n'.replace('"Sample Apartment, India",India','Sample Apartment,India');
}

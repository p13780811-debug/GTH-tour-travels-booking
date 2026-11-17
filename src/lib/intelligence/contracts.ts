export const INVESTOR_CURRENCIES = ["INR", "USD", "AED", "GBP", "EUR", "SGD"] as const;
export type InfraNotice = {id:string;title:string;authority:string;deadline:string;scope:"city"|"district"|"region";region:string};
export type InfraPulse = {count:number;notices:InfraNotice[];checkedAt:string};
export type IntelligenceTarget = {kind:"stadium"|"osm"|"attraction";id:string};
export const plainText=(value:unknown,max:number)=>{
 if(typeof value!=="string")return "";
 const text=value.normalize("NFKC").trim();
 return text.length<=max&&!/[<>\p{Cc}\p{Cf}]/u.test(text)?text:"";
};
export function validTarget(value:unknown):value is IntelligenceTarget {
 if(!value||typeof value!=="object")return false;
 if(Object.keys(value).some(k=>k!=="kind"&&k!=="id"))return false;
 const t=value as IntelligenceTarget;
 return t.kind==="stadium"&&/^[a-z0-9-]{3,70}$/.test(t.id)||t.kind==="osm"&&/^(?:node|way|relation)-[1-9]\d{0,18}$/.test(t.id)||t.kind==="attraction"&&/^Q[1-9]\d{0,14}$/.test(t.id);
}
export function validateIntelligenceLead(body:Record<string,unknown>) {
 const keys=["request_id","kind","target","property_id","currency","full_name","email","phone","services","group_size","notes","consent","website_check"];
 const name=plainText(body.full_name,150),email=plainText(body.email,150).toLowerCase(),phone=plainText(body.phone,16),notes=plainText(body.notes??"",1000);
 const reference=plainText(body.request_id,36),currency=body.currency;
 const services=body.services;
 if(Object.keys(body).some(k=>!keys.includes(k))||name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||!/^\+[1-9]\d{7,14}$/.test(phone)||
  !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(reference)||
  !INVESTOR_CURRENCIES.includes(currency as typeof INVESTOR_CURRENCIES[number])||body.consent!==true||body.website_check||
  !Array.isArray(services)||services.length<1||services.length>3||new Set(services).size!==services.length||services.some(s=>!["investor_dossier","corporate_hospitality","group_transport","hotel_blocks"].includes(s))||
  (body.notes!==undefined&&body.notes!==""&&!notes)||
  (body.group_size!=null&&(!Number.isSafeInteger(body.group_size)||Number(body.group_size)<1||Number(body.group_size)>5000)))throw new Error("Review your contact details, services and consent.");
 if(body.kind==="infra") {
  if(!Number.isSafeInteger(body.property_id)||Number(body.property_id)<=0||services.length!==1||services[0]!=="investor_dossier")throw new Error("Choose a valid property.");
 }else if(body.kind!=="hospitality"||!validTarget(body.target)||services.includes("investor_dossier"))throw new Error("Choose a valid venue and hospitality service.");
 return {requestId:reference,kind:body.kind as "infra"|"hospitality",propertyId:body.kind==="infra"?Number(body.property_id):null,target:body.kind==="hospitality"?body.target as IntelligenceTarget:null,
  currency:currency as typeof INVESTOR_CURRENCIES[number],fullName:name,email,phone,services:services as string[],groupSize:body.group_size==null?null:Number(body.group_size),notes};
}
export function conciergeWhatsApp(number:unknown,message:string):string|null {
 return typeof number==="string"&&/^[1-9]\d{7,14}$/.test(number)?"https://wa.me/"+number+"?text="+encodeURIComponent(message):null;
}

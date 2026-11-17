import {plainText} from "./contracts";
const HOSTS:Record<string,readonly string[]>={MAHARERA:["maharera.maharashtra.gov.in","maharera.mahaonline.gov.in"],DUBAI_DLD:["dubailand.gov.ae","dubaipulse.gov.ae"],HM_LAND_REGISTRY:["gov.uk","landregistry.data.gov.uk","publicdata.landregistry.gov.uk"]};
export function officialRegistryUrl(value:unknown,authority:string):string|null{
 if(typeof value!=="string"||value.length>512||!HOSTS[authority])return null;
 try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&!u.hash&&HOSTS[authority].some(host=>u.hostname===host||u.hostname==="www."+host)?u.toString():null;}catch{return null;}
}
export function validateOfficialRegistry(row:Record<string,unknown>){
 const allowed=["country_code","authority","record_id","record_kind","project_name","district","taluka","locality","postal_code","source_url","license","locality_evidence","locality_verified","rights_confirmed","source_status"];
 if(Object.keys(row).some(k=>!allowed.includes(k)))throw new Error("Unexpected registry fields or blob payload.");
 const authority=plainText(row.authority,24),country=plainText(row.country_code,2),id=plainText(row.record_id,80),name=plainText(row.project_name,140);
 if(!HOSTS[authority]||!id||name.length<3||!officialRegistryUrl(row.source_url,authority)||!["historical_unverified","official_dataset"].includes(String(row.source_status)))throw new Error("Missing official dataset provenance.");
 if((authority==="MAHARERA"&&(country!=="IN"||!/^P\d{11}$/.test(id)||row.record_kind!=="project"))||(authority==="DUBAI_DLD"&&(country!=="AE"||row.record_kind!=="project"))||(authority==="HM_LAND_REGISTRY"&&(country!=="GB"||row.record_kind!=="sale_transaction")))throw new Error("Authority scope mismatch.");
 for(const [key,max] of [["district",80],["taluka",80],["locality",120],["postal_code",16]] as const)if(row[key]!=null&&(typeof row[key]!=="string"||!plainText(row[key],max)))throw new Error("Invalid compact locality evidence.");
 if(!["CC0-1.0","OGL-UK-3.0","ODC-BY-1.0","unconfirmed"].includes(String(row.license))||typeof row.locality_verified!=="boolean"||typeof row.rights_confirmed!=="boolean")throw new Error("Dataset permission must be recorded.");
 if(row.locality_evidence!=null&&!officialRegistryUrl(row.locality_evidence,authority))throw new Error("Invalid locality source.");
 if(row.locality_verified&&(!row.locality||!row.locality_evidence||!row.rights_confirmed||row.source_status!=="official_dataset"||row.license==="unconfirmed"))throw new Error("Unverified locality cannot be indexed.");
 if(row.source_status==="historical_unverified"&&(row.locality_verified||row.rights_confirmed))throw new Error("Historical flags cannot establish verification or reuse rights.");
 if(new TextEncoder().encode(JSON.stringify(row)).length>2200)throw new Error("Registry record exceeds compact budget.");
 return {...row,indexable:row.locality_verified===true&&row.rights_confirmed===true&&!!row.locality&&!!row.locality_evidence&&row.source_status==="official_dataset"};
}

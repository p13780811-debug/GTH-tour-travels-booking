import {RequestError} from "@/lib/security/request";
import {cleanString} from "@/lib/security/validators";

export const HOTEL_KINDS=["hotel","motel","hostel","guest_house","apartment","resort"] as const;
const PERMITTED=new Set(["hotel_name","city","country_code","address","category","description","owner_name","website","photo_rights_confirmed","owner_authorised","website_check"]);
function text(value:unknown,min:number,max:number,label:string):string {
 const clean=cleanString(value,{min,max});
 if(!clean)throw new RequestError("Invalid "+label,400);
 return clean;
}
function website(value:unknown):string|null {
 if(value===undefined||value===null||value==="")return null;
 if(typeof value!=="string"||value.length>500)throw new RequestError("Invalid hotel website",400);
 try {
  const u=new URL(value);
  if(u.protocol!=="https:"||u.username||u.password||u.port||
     !u.hostname.includes(".")||u.hostname==="localhost"||
     u.hostname.endsWith(".localhost")||u.hostname.includes(":")||
     /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname))throw new Error();
  return u.toString();
 }catch {throw new RequestError("Use a public HTTPS website, or leave the website field empty",400);}
}
export function validateHotelSubmission(body:Record<string,unknown>,ownerId:string,verifiedEmail:string){
 if(Object.keys(body).some(k=>!PERMITTED.has(k))||body.website_check)
  throw new RequestError("Invalid submission",400);
 const category=String(body.category||"");
 const country=String(body.country_code||"").trim().toUpperCase();
 if(!HOTEL_KINDS.includes(category as typeof HOTEL_KINDS[number])||!/^[A-Z]{2}$/.test(country))
  throw new RequestError("Select a valid hotel category and country",400);
 if(body.photo_rights_confirmed!==true||body.owner_authorised!==true)
  throw new RequestError("Confirm ownership/authority and photo rights",400);
 return {
  owner_id:ownerId,
  contact_email:verifiedEmail,
  hotel_name:text(body.hotel_name,3,180,"hotel name"),
  city:text(body.city,2,100,"city"),
  country_code:country,
  address:text(body.address,8,350,"address"),
  description:text(body.description,40,3000,"hotel description"),
  owner_name:text(body.owner_name,2,120,"owner/contact name"),
  category,
  website:website(body.website),
  photo_rights_confirmed:true,
  owner_authorised:true,
  status:"pending" as const,
 };
}

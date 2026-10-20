import "server-only";
import {getSandboxHotel} from "@/lib/travel/nuitee-sandbox";
export function hotelSlug(name:string):string {
 return name.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,96);
}
/** Human-readable preview URL retains an exact supplier identifier, avoiding ambiguous name matching. */
export function hotelPreviewPath(hotel:{supplierHotelId:string;name:string}):string {
 return "/hotels/signature/"+hotelSlug(hotel.name)+"--"+encodeURIComponent(hotel.supplierHotelId);
}
export async function resolvePreviewHotel(segment:string) {
 const match=/^([a-z0-9-]{3,100})--([A-Za-z0-9_-]{1,100})$/.exec(segment);
 if(!match)return null;
 const hotel=await getSandboxHotel(match[2]);
 if(!hotel||hotelSlug(hotel.name)!==match[1])return null;
 return hotel;
}

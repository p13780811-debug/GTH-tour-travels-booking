/** Pure query builder shared by initial hotel search and next-page loading.
 * Every navigation retains its country, destination, category and hotel-name scope.
 */
export type HotelSearchScope = {
  destination: string;
  city: string;
  name: string;
  country: string;
  category: string;
  sort?: "name_asc" | "name_desc";
  source?: "all" | "partner" | "directory";
  checkin?:string;
  checkout?:string;
  adults?:string;
};
export function hotelSearchParams(scope: HotelSearchScope, page: number): URLSearchParams {
  if(!Number.isSafeInteger(page) || page < 1 || page > 100) {
    throw new RangeError("Invalid hotel page");
  }
  const params = new URLSearchParams({page:String(page)});
  if(scope.destination)params.set("destination",scope.destination);
  else if(scope.city)params.set("city",scope.city);
  if(scope.name)params.set("name",scope.name);
  if(scope.country)params.set("country",scope.country);
  if(scope.category)params.set("category",scope.category);
  if(scope.sort && scope.sort !== "name_asc")params.set("sort",scope.sort);
  if(scope.source && scope.source !== "all")params.set("source",scope.source);
  const dates=validatedHotelStay(scope.checkin,scope.checkout,scope.adults);
  if(dates){params.set("checkin",dates.checkin);params.set("checkout",dates.checkout);}
  if(dates?.adults)params.set("adults",String(dates.adults));
  return params;
}

export function validatedHotelStay(checkin?:string,checkout?:string,guests?:string):
 {checkin:string;checkout:string;adults:number|null}|null {
 if(!checkin||!checkout||!/^\d{4}-\d{2}-\d{2}$/.test(checkin)||!/^\d{4}-\d{2}-\d{2}$/.test(checkout))return null;
 const a=new Date(checkin+"T00:00:00Z"),b=new Date(checkout+"T00:00:00Z");
 if(!Number.isFinite(a.valueOf())||!Number.isFinite(b.valueOf())||a.toISOString().slice(0,10)!==checkin||b.toISOString().slice(0,10)!==checkout)return null;
 const days=(b.valueOf()-a.valueOf())/86400000;
 const now=new Date().toISOString().slice(0,10);
 if(checkin<now||days<1||days>90)return null;
 const adults=guests&&/^(?:[1-9]|1[0-9]|20)$/.test(guests)?Number(guests):null;
 return {checkin,checkout,adults};
}

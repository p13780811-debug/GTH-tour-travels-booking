/** Honest supplier search handoff. Never a guaranteed exact-property match or booking. */
export type HotelStaySelection={checkin?:string;checkout?:string;adults?:number};

function validDate(value:unknown):value is string{
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const day=new Date(value+"T00:00:00Z");
  return Number.isFinite(day.getTime())&&day.toISOString().slice(0,10)===value;
}
export function hotelProviderSearchUrl(destination:string,stay:HotelStaySelection={}):string{
  const text=destination.trim().slice(0,100);
  if(!text)return "https://www.booking.com/";
  const url=new URL("https://www.booking.com/searchresults.html");
  url.searchParams.set("ss",text);
  const today=new Date().toISOString().slice(0,10);
  if(validDate(stay.checkin)&&validDate(stay.checkout)&&stay.checkin>=today&&stay.checkout>stay.checkin){
    const nights=(Date.parse(stay.checkout+"T00:00:00Z")-Date.parse(stay.checkin+"T00:00:00Z"))/86400000;
    if(nights<=90){
      url.searchParams.set("checkin",stay.checkin);
      url.searchParams.set("checkout",stay.checkout);
    }
  }
  if(typeof stay.adults==="number"&&Number.isSafeInteger(stay.adults)&&stay.adults>=1&&stay.adults<=20)
    url.searchParams.set("group_adults",String(stay.adults));
  return url.toString();
}

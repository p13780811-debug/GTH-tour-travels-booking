/**
 * No fake affiliate IDs, prices, dates or availability. This is a clearly
 * labelled external hotel search handoff, not a GTH PRO booking confirmation.
 */
export function hotelProviderSearchUrl(destination:string):string{
  const text=destination.trim().slice(0,100);
  if(!text)return "https://www.booking.com/";
  const url=new URL("https://www.booking.com/searchresults.html");
  url.searchParams.set("ss",text);
  return url.toString();
}

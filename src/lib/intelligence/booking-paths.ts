/**
 * Stable, database-independent first-party booking entry routes.
 * No supplier API hit until user enters the dedicated booking flow.
 */
export type MarketBookingService = {
  id:"hotel"|"flight"|"tour"|"transfer"|"ticket"|"cruise";
  label:string;
  href:string;
  note:string;
};
export function marketBookingHandoffs(city:string,countryCode:string):MarketBookingService[]{
  const destination=city.normalize("NFKC").trim().slice(0,80);
  const validCity=/^[\p{L}\p{M}\p{N} .'-]{2,80}$/u.test(destination)?destination:"";
  const validCountry=/^[A-Z]{2}$/.test(countryCode)?countryCode:"";
  const hotel=new URLSearchParams({view:"booking"});
  if(validCity)hotel.set("city",validCity);
  if(validCountry)hotel.set("country",validCountry);
  const cityQuery=validCity?new URLSearchParams({city:validCity}).toString():"";
  return [
    {id:"hotel",label:"Search & Book Stays",href:"/hotels?"+hotel.toString(),
      note:"Select destination, dates and guests; provider confirms current rooms"},
    {id:"flight",label:"Search Flights",href:validCity?"/flights?"+new URLSearchParams({destinationCity:validCity}).toString()+"#flight-search":"/flights",
      note:"Search airports and dates through the existing flight provider"},
    {id:"tour",label:"Book Tours & Activities",href:"/tours"+(cityQuery?"?"+cityQuery:""),
      note:"Choose specific bookable experiences and verify dates"},
    {id:"transfer",label:"Airport Transfers",href:"/transfers",
      note:"Search exact airport pickup and verify driver arrangements"},
    {id:"ticket",label:"Stadium & Event Tickets",href:"/tickets"+(validCity?"?"+new URLSearchParams({q:validCity}).toString():""),
      note:"Search event-specific admission sources; no guaranteed seats"},
    {id:"cruise",label:"Cruises & River Trips",href:"/cruises",
      note:"Browse partner-operated cruises and day sailings"},
  ];
}
/** Independently source-backed hotel illustrations for cities not yet represented
 * in GTH's own OSM catalog. These are editorial examples only, NOT bookable
 * provider listings, supplier IDs, current offers or verified availability.
 * Do not attach unlicensed or unverified property photographs.
 */
export const HOTEL_EDITORIAL_EXAMPLES={
  london:{name:"The Savoy",source:"Wikimedia Commons · Savoy Hotel",url:"https://commons.wikimedia.org/wiki/Category:Savoy_Hotel"},
  paris:{name:"Hôtel Ritz Paris",source:"Wikimedia Commons · Hôtel Ritz Paris",url:"https://commons.wikimedia.org/wiki/Category:H%C3%B4tel_Ritz_Paris"},
  "new-york":{name:"The Plaza Hotel",source:"Wikimedia Commons · Plaza Hotel, New York",url:"https://commons.wikimedia.org/wiki/Category:Plaza_Hotel_(New_York_City)"},
  dubai:{name:"Burj Al Arab",source:"Wikimedia Commons · Burj Al Arab",url:"https://commons.wikimedia.org/wiki/Category:Burj_Al_Arab"},
  singapore:{name:"Raffles Hotel",source:"Wikimedia Commons · Raffles Hotel",url:"https://commons.wikimedia.org/wiki/Raffles_Hotel"},
  tokyo:{name:"Imperial Hotel Tokyo",source:"Wikimedia Commons · Imperial Hotel, Tokyo",url:"https://commons.wikimedia.org/wiki/Category:Imperial_Hotel,_Tokyo"},
  bangkok:{name:"Mandarin Oriental, Bangkok",source:"Wikimedia Commons · The Oriental Bangkok",url:"https://commons.wikimedia.org/wiki/Category:The_Oriental_Bangkok"},
  rome:{name:"Hotel de Russie",source:"Wikimedia Commons · Hotel de Russie",url:"https://commons.wikimedia.org/wiki/Category:Hotel_de_Russie"}
} as const;
export type EditorialHotelCity=keyof typeof HOTEL_EDITORIAL_EXAMPLES;
export function getHotelEditorialExample(slug:string){
  return Object.prototype.hasOwnProperty.call(HOTEL_EDITORIAL_EXAMPLES,slug)
    ? HOTEL_EDITORIAL_EXAMPLES[slug as EditorialHotelCity] : null;
}

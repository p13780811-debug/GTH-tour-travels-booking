/** Bundled AI editorial illustrations, not verified listing or venue photos. */
export const LUXURY_VISUALS={
 hero:"/images/luxury/hero.webp",
 flights:"/images/luxury/flights.webp",
 hotels:"/images/luxury/hotels.webp",
 london:"/images/luxury/london.webp",
 melbourne:"/images/luxury/melbourne.webp",
 mumbai:"/images/luxury/mumbai.webp",
 packages:"/images/luxury/packages.webp",
 tickets:"/images/luxury/tickets.webp",
 tokyo:"/images/luxury/tokyo.webp",
 southasia:"/images/luxury/southasia.webp",
 southeastasia:"/images/luxury/southeastasia.webp",
 eastasia:"/images/luxury/eastasia.webp",
 westasia:"/images/luxury/westasia.webp",
 europe:"/images/luxury/europe.webp",
 africa:"/images/luxury/africa.webp",
 northamerica:"/images/luxury/northamerica.webp",
 latinamerica:"/images/luxury/latinamerica.webp",
 oceania:"/images/luxury/oceania.webp",
 property:"/images/luxury/property.webp",
 tenders:"/images/luxury/tenders.webp",
 transport:"/images/luxury/transport.webp"
} as const;
/** Existing repository photography is preferred to newly generated imagery.
 * The approved sports artwork is retained. These are editorial category images,
 * not evidence of a particular listing, available seat or current price. */
export const MODULE_HEROES={
 travel:{name:"Travel",image:"/maldives-bg.jpg",href:"/travel"},
 hotels:{name:"Hotels",image:"/images/mega/hotels.jpg",href:"/app/hotels"},
 flights:{name:"Flights",image:"/images/mega/flights.jpg",href:"/app/flights"},
 tours:{name:"Tours",image:"/images/mega/tours.jpg",href:"/tours"},
 packages:{name:"Packages",image:"/images/cities/dubai.jpg",href:"/app/packages"},
 tickets:{name:"Sports & events",image:LUXURY_VISUALS.tickets,href:"/app/services/tickets"},
 property:{name:"Real estate",image:"/images/real-estate.jpg",href:"/app/property"},
 tenders:{name:"Tenders",image:"/images/tender.jpg",href:"/app/tenders"},
 transport:{name:"Transport",image:"/images/mega/transfers.jpg",href:"/transfers"},
 destinations:{name:"Destinations",image:"/images/global-city.jpg",href:"/app/destinations"}
} as const;
export const MARKETPLACE_HERO_SLIDES=Object.values(MODULE_HEROES);
export const REGIONAL_EDITORIAL_PHOTOS={
 southasia:"/images/cities/munnar.jpg",southeastasia:"/images/cities/bali.jpg",
 eastasia:"/images/cities/seoul.jpg",westasia:"/images/cities/dubai.jpg",
 europe:"/images/cities/paris.jpg",africa:"/images/cities/cape-town.jpg",
 northamerica:"/images/cities/vancouver.jpg",latinamerica:LUXURY_VISUALS.latinamerica,
 oceania:LUXURY_VISUALS.oceania
} as const;
export const GLOBAL_EDITORIAL_FALLBACK="/images/global-city.jpg";
const illustrativeRegional=new Set<string>(Object.values(REGIONAL_EDITORIAL_PHOTOS));
const media:Readonly<Record<string,string>>={
 hotels:MODULE_HEROES.hotels.image,"list-hotel":MODULE_HEROES.hotels.image,flights:MODULE_HEROES.flights.image,packages:MODULE_HEROES.packages.image,
 tours:"/images/mega/tours.jpg",activities:"/images/mega/tours.jpg",attractions:"/images/mega/tours.jpg",
 stadiums:LUXURY_VISUALS.tickets,tickets:LUXURY_VISUALS.tickets,transfers:"/images/mega/transfers.jpg",cars:"/images/mega/transfers.jpg",
 cruises:"/images/cruises/disney-adventure.jpg",insurance:"/images/mega/insurance.jpg",
 bus:MODULE_HEROES.transport.image,train:MODULE_HEROES.transport.image,transport:MODULE_HEROES.transport.image,
 destinations:MODULE_HEROES.destinations.image,guides:MODULE_HEROES.packages.image,blog:MODULE_HEROES.packages.image,
 properties:MODULE_HEROES.property.image,property:MODULE_HEROES.property.image,"post-property":MODULE_HEROES.property.image,
 tenders:MODULE_HEROES.tenders.image,"tender-assistant":MODULE_HEROES.tenders.image
};
export function destinationServicePhoto(key:string):string{return Object.prototype.hasOwnProperty.call(media,key)?media[key]:GLOBAL_EDITORIAL_FALLBACK;}
export function isIllustrativeVisual(path:string|null|undefined):boolean{
 return !path||path===GLOBAL_EDITORIAL_FALLBACK||illustrativeRegional.has(path)||(path.startsWith("/images/luxury/")||path.startsWith("/images/regions/"))||path==="/images/default-city.jpg"||path==="/images/cities/default.jpg"||path==="/images/cities/hotel.jpg";
}
// Broad geographic art direction, never an assertion of exact location.
const regions:ReadonlyArray<readonly [keyof typeof REGIONAL_EDITORIAL_PHOTOS,string]>=[
 ["southasia","AF BD BT IN LK MV NP PK IO"],
 ["southeastasia","BN ID KH LA MM MY PH SG TH TL VN"],
 ["eastasia","CN HK JP KP KR MN MO TW"],
 ["westasia","AE AM AZ BH CY GE IL IQ IR JO KW KZ KG LB OM PS QA SA SY TJ TM TR UZ YE"],
 ["europe","AD AL AT AX BA BE BG BY CH CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA XK"],
 ["africa","AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG EH ER ET GA GH GM GN GQ GW KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RE RW SC SD SH SL SN SO SS ST SZ TD TG TN TZ UG YT ZA ZM ZW"],
 ["northamerica","BM CA GL PM US"],
 ["latinamerica","AG AI AR AW BB BL BO BQ BR BS BZ CL CO CR CU CW DM DO EC FK GD GF GP GT GY HN HT JM KN KY LC MF MQ MS MX NI PA PE PR PY SR SV SX TC TT UY VC VE VG VI"],
 ["oceania","AS AU CC CK CX FJ FM GU HM KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV UM VU WF WS"]
];
const regionByCode=new Map(regions.flatMap(([key,codes])=>codes.split(" ").map(code=>[code,key] as const)));
export function regionVisual(countryCode?:string|null):string{
 // NASA public-domain satellite photographs, regional inspiration only.
 if(countryCode==="GS")return "/images/regions/gs.webp";
 if(countryCode==="TF")return "/images/regions/tf.webp";
 const key=countryCode?regionByCode.get(countryCode):undefined;
 return key?REGIONAL_EDITORIAL_PHOTOS[key]:GLOBAL_EDITORIAL_FALLBACK;
}
const flagship:Readonly<Record<string,{country:string;image:string}>>={
 tokyo:{country:"JP",image:"/images/cities/tokyo.jpg"},london:{country:"GB",image:"/images/cities/london.jpg"},
 mumbai:{country:"IN",image:"/images/cities/mumbai.jpg"}
};
export function destinationVisual(slug:string,countryCode?:string|null,source?:string|null):string{
 const key=slug.replace(/-[a-z]{2}$/,"");
 const candidate=Object.prototype.hasOwnProperty.call(flagship,key)?flagship[key]:undefined;
 if(candidate&&candidate.country===countryCode&&(slug===key||slug===key+"-"+candidate.country.toLowerCase()))return candidate.image;
 if(source&&!source.startsWith("/images/luxury/")&&!source.startsWith("/images/regions/")&&source!==GLOBAL_EDITORIAL_FALLBACK&&!["/images/default-city.jpg","/images/cities/default.jpg","/images/cities/hotel.jpg"].includes(source)&&/^\/images\/[a-zA-Z0-9/_-]+\.(?:jpg|jpeg|png|webp)$/.test(source))return source;
 return regionVisual(countryCode);
}
export function venueVisual(slug:string):string{
 return slug==="melbourne-cricket-ground"?LUXURY_VISUALS.melbourne:slug==="wankhede-stadium"?LUXURY_VISUALS.mumbai:LUXURY_VISUALS.tickets;
}

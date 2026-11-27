import generated from "./marketplace-generated-media.json";
const library:Readonly<Record<string,string>>={
 hero:"/images/mega/welcome.jpg",travel:"/images/travel.jpg",hotels:"/images/mega/hotels.jpg",flights:"/images/mega/flights.jpg",tickets:"/images/editorial/sports.svg",stadiums:"/images/editorial/sports.svg",packages:"/images/mega/welcome.jpg",destinations:"/images/global-city.jpg",property:"/images/real-estate.jpg",tenders:"/images/tender.jpg",transport:"/images/mega/transfers.jpg",tours:"/images/mega/tours.jpg",melbourne:"/images/editorial/australia.svg",mumbai:"/images/cities/mumbai.jpg",tokyo:"/images/cities/tokyo.jpg",london:"/images/cities/london.jpg",coastal:"/images/cities/goa.jpg",mountain:"/images/cities/manali.jpg",urban:"/images/global-city.jpg",europe:"/images/cities/vienna.jpg",asia:"/images/cities/singapore.jpg",americas:"/images/cities/new-york.jpg",africa:"/images/cities/cape-town.jpg",oceania:"/images/editorial/australia.svg"
};
const generatedMedia:Readonly<Record<string,string>>=generated;
export function marketplacePhoto(key:string):string {
 const custom=Object.hasOwn(generatedMedia,key)?generatedMedia[key]:null;
 if(custom==="/images/luxury/"+key+".webp")return custom;
 return Object.hasOwn(library,key)?library[key]:library.urban;
}
export const marketplaceMediaKeys=Object.keys(library);
export function regionalMarketplacePhoto(country:string|null|undefined):string{
 const code=(country||"").toUpperCase();
 if(/^(AU|NZ|FJ|PG|WS|TO|VU|NC|SB|PF|GU|FM|KI|MH|NR|PW|TV)$/.test(code))return marketplacePhoto("oceania");
 if(/^(IN|NP|BT|BD|LK|PK|CN|JP|KR|TW|HK|MO|SG|MY|TH|ID|VN|PH|KH|LA|MM|MN|AE|SA|QA|OM|KW|BH|JO|IL|TR|IR|IQ|KZ|UZ|KG|TJ|TM|AF)$/.test(code))return marketplacePhoto("asia");
 if(/^(GB|FR|DE|IT|ES|PT|NL|BE|AT|CH|IE|SE|NO|FI|DK|IS|PL|CZ|SK|HU|RO|BG|GR|HR|SI|RS|BA|ME|AL|MK|EE|LV|LT|UA|MD|BY|RU|LU|MT|CY)$/.test(code))return marketplacePhoto("europe");
 if(/^(US|CA|MX|BR|AR|CL|CO|PE|EC|UY|PY|BO|VE|PA|CR|CU|DO|JM|GT|HN|SV|NI|BZ|HT|BS|BB|TT|GY|SR)$/.test(code))return marketplacePhoto("americas");
 if(/^(ZA|EG|MA|DZ|TN|LY|NG|GH|KE|TZ|UG|RW|ET|SN|CI|CM|AO|MZ|ZM|ZW|BW|NA|MG|MU|SC|SD|SS|SO|DJ|ER|GA|CG|CD|NE|ML|BF|BJ|TG|SL|LR|GN|GM|MR|TD|CF|BI|MW|LS|SZ|GQ|ST|KM|CV)$/.test(code))return marketplacePhoto("africa");
 return marketplacePhoto("urban");
}
export function serviceMediaKey(id:string):string{
 if(/property|broker|claim-project/.test(id))return "property";
 if(/tender/.test(id))return "tenders";
 if(/ticket|stadium/.test(id))return "tickets";
 if(/transfer|car|transport|bus|train|ferry/.test(id))return "transport";
 if(/hotel|stay/.test(id))return "hotels";
 if(/flight/.test(id))return "flights";
 if(/package/.test(id))return "packages";
 if(/tour|activit|cruise/.test(id))return "tours";
 return "travel";
}
export const marketplaceShortcuts=[
 {label:"Find stays",href:"/app/hotels",media:"hotels",detail:"Rooms & stays"},
 {label:"Match tickets",href:"/app/services/tickets",media:"tickets",detail:"Event discovery"},
 {label:"Global flights",href:"/app/flights",media:"flights",detail:"Compare routes"},
 {label:"Travel packages",href:"/app/packages",media:"packages",detail:"Build your itinerary"},
 {label:"Explore destinations",href:"/app/destinations",media:"destinations",detail:"Worldwide city directory"},
 {label:"Transport",href:"/app/services/transport",media:"transport",detail:"Bus, rail & ferry"},
 {label:"Real Estate",href:"/app/property",media:"property",detail:"Property intelligence"},
 {label:"Global tenders",href:"/app/tenders",media:"tenders",detail:"Procurement research"}
] as const;
export const flagshipHubs=[
 {title:"Melbourne · MCG",media:"melbourne",href:"/app/venues/melbourne-cricket-ground",description:"Stadium guide & match-day planning"},
 {title:"Mumbai · Wankhede",media:"mumbai",href:"/app/venues/wankhede-stadium",description:"Cricket & city stays"},
 {title:"Tokyo",media:"tokyo",href:"/app/destinations/tokyo",description:"City discovery & travel"},
 {title:"London",media:"london",href:"/app/destinations/london",description:"City discovery & travel"}
] as const;

/** Local, source-honest editorial imagery. No image API or new theme.
 * Imported generated assets must be committed before any path is enabled.
 */
import generated from "./marketplace-generated-media.json";
const originals:Readonly<Record<string,string>>={
 hotel:"/images/mega/hotels.jpg",hotels:"/images/mega/hotels.jpg",flight:"/images/mega/flights.jpg",flights:"/images/mega/flights.jpg",
 tickets:"/images/editorial/sports.svg",stadiums:"/images/editorial/sports.svg",packages:"/images/travel.jpg",property:"/images/real-estate.jpg",tender:"/images/tender.jpg",tenders:"/images/tender.jpg",
 transfers:"/images/mega/transfers.jpg",transport:"/images/mega/transfers.jpg",cars:"/images/mega/transfers.jpg",tours:"/images/mega/tours.jpg",activities:"/images/mega/tours.jpg",
 destination:"/images/global-city.jpg",destinations:"/images/global-city.jpg",melbourne:"/images/global-city.jpg",mumbai:"/images/cities/mumbai.jpg",tokyo:"/images/cities/tokyo.jpg",london:"/images/cities/london.jpg",hero:"/images/global-city.jpg"
};
export function marketplacePhoto(kind:string):string{
 const key=kind==="hotel"?"hotels":kind==="flight"?"flights":kind==="stadiums"?"tickets":kind;
 const image=(generated as Readonly<Record<string,string>>)[key];
 if(typeof image==="string"&&/^\/images\/luxury\/[a-z-]+\.webp$/.test(image))return image;
 return Object.hasOwn(originals,key)?originals[key]:originals.destination;
}
export const marketplaceServices=[
 {kind:"hotels",title:"Hotels & stays",href:"/app/hotels",detail:"Find your next stay"},
 {kind:"tickets",title:"Match passes",href:"/app/services/tickets",detail:"Explore event sources"},
 {kind:"flights",title:"Global flights",href:"/app/flights",detail:"Compare routes"},
 {kind:"packages",title:"Travel packages",href:"/app/packages",detail:"Build your itinerary"},
 {kind:"transport",title:"Transport",href:"/go/transport",detail:"Open branded booking portal"},
 {kind:"tours",title:"Tours & experiences",href:"/app/services/tours",detail:"Explore activities"},
 {kind:"property",title:"Real Estate",href:"/app/property",detail:"Research properties"},
 {kind:"tenders",title:"Global tenders",href:"/app/tenders",detail:"Discover opportunities"}
] as const;
export const marketplaceHubs=[
 {kind:"melbourne",title:"Melbourne (MCG)",detail:"Cricket & match-day planning",href:"/stadiums/melbourne-cricket-ground"},
 {kind:"mumbai",title:"Mumbai (Wankhede)",detail:"Cricket & match-day planning",href:"/stadiums/wankhede-stadium"},
 {kind:"tokyo",title:"Tokyo",detail:"City travel & experiences",href:"/destinations/tokyo"},
 {kind:"london",title:"London",detail:"City travel & experiences",href:"/destinations/london"}
] as const;

import {normalizeQuery,type Pillar} from "./routing";

export type ServiceGroup="travel"|"property"|"tender";
export type ServiceIcon="plane"|"hotel"|"building"|"tender"|"bus"|"train"|"ship"|"car"|"route"|"compass"|"ticket"|"shield"|"map"|"book"|"offer"|"landmark"|"bookmark"|"tools"|"user";
export type NativeService={label:string;path:string;kind:Pillar;mode:"native"|"web";description:string;icon:ServiceIcon};
export const SERVICE_GROUPS=[
 {id:"travel",label:"Travel",caption:"Plan the journey. Discover the world."},
 {id:"property",label:"Real Estate",caption:"Research a place. Make an informed move."},
 {id:"tender",label:"Tenders",caption:"Find opportunities. Prepare your next bid."},
] as const;

/** Only established GTH PRO routes. Native browsing reuses the public sources;
 * booking and account actions retain the existing website's controls. */
export const SERVICES:readonly NativeService[]=[
 {label:"Flights",path:"/app/flights",kind:"travel",mode:"web",icon:"plane",description:"Compare routes, dates and supplier fares"},
 {label:"Hotels",path:"/app/hotels",kind:"hotel",mode:"native",icon:"hotel",description:"Explore stays and published accommodation records"},
 {label:"Tours & activities",path:"/tours",kind:"tour",mode:"native",icon:"compass",description:"Discover listed experiences by destination"},
 {label:"Activities",path:"/activities",kind:"travel",mode:"web",icon:"ticket",description:"Discover activities and check provider options"},
 {label:"Bus journeys",path:"/bus",kind:"travel",mode:"web",icon:"bus",description:"Plan bus routes and check available journeys"},
 {label:"Train journeys",path:"/train",kind:"travel",mode:"web",icon:"train",description:"Explore rail routes and booking options"},
 {label:"Ferry journeys",path:"/ferry",kind:"travel",mode:"web",icon:"ship",description:"Ferries, speedboats and island connections"},
 {label:"Cruises",path:"/cruises",kind:"travel",mode:"web",icon:"ship",description:"Cruise holidays, harbour and river experiences"},
 {label:"Airport transfers",path:"/transfers",kind:"travel",mode:"web",icon:"route",description:"Airport pickups and onward travel options"},
 {label:"Car rentals",path:"/cars",kind:"travel",mode:"web",icon:"car",description:"Compare rental options and rental conditions"},
 {label:"Destinations",path:"/app/destinations",kind:"travel",mode:"web",icon:"map",description:"City guides and ideas for your next journey"},
 {label:"Attractions",path:"/attractions",kind:"travel",mode:"web",icon:"landmark",description:"Source-backed places and sightseeing references"},
 {label:"Airport Explorer",path:"/travel/airports",kind:"travel",mode:"web",icon:"plane",description:"Explore airports and onward travel services"},
 {label:"Travel guides",path:"/guides",kind:"travel",mode:"web",icon:"book",description:"Destination guides and practical travel reading"},
 {label:"Travel blog",path:"/blog",kind:"travel",mode:"web",icon:"book",description:"Travel stories and editorial inspiration"},
 {label:"Deals & offers",path:"/travel/deals",kind:"travel",mode:"web",icon:"offer",description:"Explore provider offers and their current terms"},
 {label:"Travel protection",path:"/insurance",kind:"travel",mode:"web",icon:"shield",description:"Review coverage and policy terms with providers"},
 {label:"Travel eSIM",path:"/flights/out/yesim",kind:"travel",mode:"web",icon:"map",description:"Explore connectivity plans for your journey"},
 {label:"Real Estate",path:"/app/property",kind:"property",mode:"native",icon:"building",description:"Discover published property inventory"},
 {label:"Project registry",path:"/real-estate/registry",kind:"property",mode:"web",icon:"landmark",description:"Research registration records and original evidence"},
 {label:"Saved properties",path:"/real-estate/saved",kind:"property",mode:"web",icon:"bookmark",description:"Open your website property watchlist"},
 {label:"Property tools",path:"/real-estate/tools",kind:"property",mode:"web",icon:"tools",description:"Finance, area and project planning tools"},
 {label:"Property workspace",path:"/real-estate/workspace",kind:"property",mode:"web",icon:"building",description:"Continue your property research workspace"},
 {label:"List a property",path:"/real-estate/post-property",kind:"property",mode:"web",icon:"user",description:"Sign in to submit your property"},
 {label:"Public tenders",path:"/app/tenders",kind:"tender",mode:"native",icon:"tender",description:"Explore published notices by country"},
 {label:"Saved tenders",path:"/tender/saved",kind:"tender",mode:"web",icon:"bookmark",description:"Open your website tender watchlist"},
 {label:"Tender services",path:"/tender/services",kind:"tender",mode:"web",icon:"tools",description:"Bid assistance and document preparation"},
 {label:"Tender assistant",path:"/tender/assistant",kind:"tender",mode:"web",icon:"tender",description:"Research opportunities and prepare questions"},
];
export function serviceGroup(service:NativeService):ServiceGroup{
 return service.kind==="property"?"property":service.kind==="tender"?"tender":"travel";
}
export function filterServices(query:string,group:ServiceGroup|"all"="all"):NativeService[]{
 const words=normalizeQuery(query).toLocaleLowerCase("en").split(" ").filter(Boolean);
 return SERVICES.filter(service=>{
  const section=SERVICE_GROUPS.find(item=>item.id===serviceGroup(service))!;
  const text=(service.label+" "+service.description+" "+section.label).toLocaleLowerCase("en");
  return (group==="all"||section.id===group)&&words.every(word=>text.includes(word));
 });
}
/** Booking queries belong to their real planner, not hotel/property inventory.
 * No route, date, airport or supplier identifier is guessed from free text. */
export function bookingServiceForQuery(raw:string):NativeService|undefined{
 const query=normalizeQuery(raw);
 const intents:[RegExp,string][]=[
  [/\b(?:airport\s+(?:transfer|pickup)s?|transfers?)\b/i,"Airport transfers"],
  [/\b(?:flights?|airfares?)\b/i,"Flights"],
  [/\b(?:cruises?|cruising)\b/i,"Cruises"],
  [/\b(?:ferr(?:y|ies)|speedboats?)\b/i,"Ferry journeys"],
  [/\b(?:trains?|railways?|rail)\b/i,"Train journeys"],
  [/\b(?:bus|buses|coach(?:es)?)\b/i,"Bus journeys"],
  [/\b(?:car\s+(?:rental|hire)s?|rent\s+a\s+car)\b/i,"Car rentals"],
  [/\b(?:esims?)\b/i,"Travel eSIM"],
 ];
 const label=intents.find(([pattern])=>pattern.test(query))?.[1];
 return SERVICES.find(service=>service.label===label);
}

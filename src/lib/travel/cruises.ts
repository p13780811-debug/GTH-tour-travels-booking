import media from "@/data/cruise-media.json";
/** Editorial product identities checked against the linked official Klook pages.
 * No live fares, copied reviews, inventory feed or supplier-photo rights are implied.
 */
export const CRUISE_REVIEWED_ON = "2026-11-05";
export type CruiseType = "holiday" | "sightseeing" | "dining";
export type Cruise = {slug:string;title:string;city:string;country:string;type:CruiseType;duration:string;summary:string;highlights:readonly string[];sourceUrl:string;image:string;photo:(typeof media)[keyof typeof media]};
export const cruisePhotos=Object.values(media);
function cruisePhoto(id:keyof typeof media){return {image:media[id].path,photo:media[id]};}
export const cruises: readonly Cruise[] = [
 {slug:"disney-adventure-3-nights",title:"Disney Adventure · 3-night cruise",city:"Singapore",country:"Singapore",type:"holiday",duration:"3 nights",summary:"A Singapore round-trip sailing with days at sea aboard Disney Adventure.",highlights:["Inside, oceanview and verandah cabin options","Check the selected sailing and cabin package"],sourceUrl:"https://www.klook.com/en-IN/activity/142451-3-night-disney-adventure-cruise-from-singapore/",...cruisePhoto("disney-adventure")},
 {slug:"disney-adventure-4-nights",title:"Disney Adventure · 4-night cruise",city:"Singapore",country:"Singapore",type:"holiday",duration:"4 nights",summary:"A longer Disney Adventure sailing departing from Singapore.",highlights:["Multiple stateroom categories","Itinerary varies with the chosen sailing"],sourceUrl:"https://www.klook.com/en-IN/activity/142504-4-night-disney-adventure-cruise-from-singapore/",...cruisePhoto("disney-adventure")},
 {slug:"genting-dream",title:"Genting Dream",city:"Singapore",country:"Singapore",type:"holiday",duration:"Select sailing",summary:"Explore the published Genting Dream cruise packages departing from Singapore.",highlights:["Compare sailing dates and cabin categories","Confirm the route in the selected package"],sourceUrl:"https://www.klook.com/en-IN/activity/164709-genting-dream-cruise-new-season/",...cruisePhoto("genting-dream")},
 {slug:"spectrum-of-the-seas",title:"Spectrum of the Seas",city:"Hong Kong",country:"Hong Kong",type:"holiday",duration:"Select sailing",summary:"Royal Caribbean cruise packages departing from Hong Kong.",highlights:["Compare itineraries and cabin categories","Check port calls for your departure"],sourceUrl:"https://www.klook.com/en-SG/activity/125574-spectrum-of-the-seas-by-royal-caribbean-international/",...cruisePhoto("spectrum-of-the-seas")},
 {slug:"singapore-river-cruise",title:"Singapore River Cruise",city:"Singapore",country:"Singapore",type:"sightseeing",duration:"Short cruise",summary:"See Singapore's riverside landmarks from a sightseeing boat.",highlights:["River sightseeing experience","Confirm boarding point and operating hours"],sourceUrl:"https://www.klook.com/en-IN/activity/3846-river-cruise-singapore/",...cruisePhoto("singapore-river")},
 {slug:"aqua-luna-harbour",title:"Aqua Luna · Victoria Harbour",city:"Hong Kong",country:"Hong Kong",type:"sightseeing",duration:"Short cruise",summary:"Explore Victoria Harbour with Aqua Luna's published sailing experiences.",highlights:["Harbour and skyline views","Select the desired sailing session"],sourceUrl:"https://www.klook.com/en-SG/activity/659-aqualuna-evening-sail-hong-kong/",...cruisePhoto("aqua-luna")},
 {slug:"dubai-marina-dinner",title:"Dubai Marina Dinner Cruise",city:"Dubai",country:"United Arab Emirates",type:"dining",duration:"Evening experience",summary:"A Dubai Marina dining cruise listing with buffet and live-show packages.",highlights:["Marina setting and dinner experience","Check the menu, transfer and package inclusions"],sourceUrl:"https://www.klook.com/en-US/activity/144402-dubai-marina-dinner-cruise-live-show/",...cruisePhoto("dubai-dhow")},
];
export const cruiseTypes = [{id:"holiday",label:"Cruise holidays"},{id:"sightseeing",label:"Sightseeing cruises"},{id:"dining",label:"Dinner cruises"}] as const;
export function findCruise(slug:string):Cruise|undefined{return cruises.find(item=>item.slug===slug);}
export function filterCruises(destination:string,type:string):Cruise[]{
 const q=destination.normalize("NFKC").trim().toLocaleLowerCase();
 return cruises.filter(item=>(!q||`${item.city} ${item.country} ${item.title}`.toLocaleLowerCase().includes(q))&&(!type||item.type===type));
}
/** Only a fixed, reviewed product ID can select a destination. No user URL. */
export function cruiseAffiliateUrl(slug:string):string|null{
 const item=findCruise(slug);if(!item)return null;
 const target=new URL(item.sourceUrl);
 if(target.protocol!=="https:"||target.hostname!=="www.klook.com"||target.search||target.hash||target.username||target.password||!/^\/[a-z]{2}-[A-Z]{2}\/activity\/[1-9]\d*-[a-z0-9-]+\/$/.test(target.pathname))return null;
 // Same public Klook campaign as the existing destination-search integration.
 const tracked=new URL("https://tp.media/r");
 for(const [key,value] of Object.entries({campaign_id:"137",marker:"417668",p:"4110",trs:"504342",sub_id:"gth_cruise_"+item.slug,u:target.href}))tracked.searchParams.set(key,value);
 return tracked.href;
}

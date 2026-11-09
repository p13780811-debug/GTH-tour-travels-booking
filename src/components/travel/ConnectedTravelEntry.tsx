"use client";
import {useSearchParams} from "next/navigation";
import {EMPTY_CONNECTED_TRIP,parseConnectedTrip,travelMode} from "@/lib/travel/connected-trip";
import {EMPTY_TOUR_SEARCH,tourDiscoveryHref} from "@/lib/tours/discovery";
import ConnectedTravelWorkspace from "./ConnectedTravelWorkspace";
import ConnectedExperienceGallery from "./ConnectedExperienceGallery";
/** URL preferences hydrate in the browser so /travel remains an edge-cached static page. */
export default function ConnectedTravelEntry({countries}:{countries:{code:string;name:string}[]}){
 const params=useSearchParams(),raw:Record<string,string|string[]>={};
 for(const key of params.keys())raw[key]=params.getAll(key).length>1?params.getAll(key):params.get(key)!;
 const parsed=parseConnectedTrip(raw,countries.map(item=>item.code));
 const trip=parsed.ok?parsed.trip:EMPTY_CONNECTED_TRIP,mode=travelMode(raw.travelMode);
 const activitiesHref=tourDiscoveryHref("/activities",{...EMPTY_TOUR_SEARCH,city:trip.city,currency:trip.currency});
 return <ConnectedTravelWorkspace trip={trip} initialMode={mode} countries={countries} initialError={parsed.ok?undefined:parsed.error} activitiesHref={activitiesHref} experiences={<ConnectedExperienceGallery city={trip.city} enabled={mode==="experiences"}/>}/>;
}

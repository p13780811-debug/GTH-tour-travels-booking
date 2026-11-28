import {MODULE_HEROES} from "@/lib/destinations/visual-media";
import {ModuleHomeHero} from "@/components/mobile/LuxuryMarketplace";
import type {Metadata} from "next";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import AviasalesWhiteLabel from "@/components/flights/AviasalesWhiteLabel";
import GTHTransportSearchWidget from "@/components/travel/GTHTransportSearchWidget";
import FlightJourneyServices from "@/components/flights/FlightJourneyServices";
import FlightServiceShortcuts from "@/components/flights/FlightServiceShortcuts";
export const metadata:Metadata={title:"Flights | GTH PRO App"};
export default async function AppFlights({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const query=await searchParams;
 const isResultsView=typeof query.flightSearch==="string"&&/^[A-Za-z0-9]{10,40}$/.test(query.flightSearch);
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(90px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
  <ModuleHomeHero module="Flights" title="The world is within reach." subtitle="Compare routes and travel dates through existing booking services." image={MODULE_HEROES.flights.image} links={[["Stays","/app/hotels"],["Packages","/app/packages"],["Destinations","/app/destinations"]]}>
   <h1 className="mb-3 text-xl font-semibold">Flights</h1>
   {!isResultsView && <div><GTHTransportSearchWidget mode="flight" flightOnly /><p className="mb-2 text-sm text-[var(--text-soft)]">No matching first-network flight? Use the alternative flight search below.</p></div>}
  </ModuleHomeHero>
  <div className="mx-auto w-full max-w-7xl pt-3">
   <FlightServiceShortcuts/>
   <AviasalesWhiteLabel isResultsView={isResultsView} resultsPath="/app/flights"/>
   <div className="px-4 sm:px-6"><FlightJourneyServices/></div>
  </div>
 </main>;
}

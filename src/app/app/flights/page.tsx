import type {Metadata} from "next";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import AviasalesWhiteLabel from "@/components/flights/AviasalesWhiteLabel";
import FlightJourneyServices from "@/components/flights/FlightJourneyServices";
import FlightServiceShortcuts from "@/components/flights/FlightServiceShortcuts";
export const metadata:Metadata={title:"Flights | GTH PRO App"};
export default async function AppFlights({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const query=await searchParams;
 const isResultsView=typeof query.flightSearch==="string"&&/^[A-Za-z0-9]{10,40}$/.test(query.flightSearch);
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(90px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
  <div className="mx-auto w-full max-w-7xl pt-3">
   <h1 className="mb-3 px-4 text-xl font-semibold sm:px-6">Flights</h1>
   <FlightServiceShortcuts/>
   <AviasalesWhiteLabel isResultsView={isResultsView} resultsPath="/app/flights"/>
   <div className="px-4 sm:px-6"><FlightJourneyServices/></div>
  </div>
 </main>;
}

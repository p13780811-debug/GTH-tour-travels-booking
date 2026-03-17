

import MegaAggregator from "./mega-aggregator/page";
import TripPlanner from "@/components/TripPlanner"




export default function Home() {
  return (
    <main className="bg-black min-h-screen">
      <MegaAggregator />
      <TripPlanner />
    </main>
  );
}
import type {Metadata} from "next";
import AttractionReviewDashboard from "@/components/travel/AttractionReviewDashboard";
export const metadata:Metadata={title:"Attraction Reviews | GTH PRO Admin",robots:{index:false,follow:false}};
export default function AttractionReviews(){
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]"><div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
  <h1 className="text-3xl font-semibold">Open attraction source review</h1>
  <p className="my-5 text-sm text-[var(--text-soft)]">Private review: check Wikidata category/location and Commons photo rights. Publishing a source reference does not verify ticket inventory.</p>
  <AttractionReviewDashboard/>
 </div></main>;
}
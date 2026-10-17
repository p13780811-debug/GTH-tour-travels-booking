import type {Metadata} from "next";
import Link from "next/link";
import GuideEditorialDashboard from "@/components/travel/GuideEditorialDashboard";
export const metadata:Metadata={title:"Travel Guide Editorial Review | GTH PRO Admin",robots:{index:false,follow:false}};
export default function GuideReviewPage(){
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]"><div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
  <Link href="/admin/attractions" className="text-sm underline">← Attraction source reviews</Link>
  <h1 className="mt-5 text-3xl font-bold">Travel guide editorial & image-rights review</h1>
  <p className="my-5 text-sm leading-7 text-[var(--text-soft)]">Only verified Commons metadata enters the private candidate queue. Each photograph needs a human source and destination check; each travel guide needs a separate editorial check before public SEO indexing.</p>
  <GuideEditorialDashboard/>
 </div></main>;
}

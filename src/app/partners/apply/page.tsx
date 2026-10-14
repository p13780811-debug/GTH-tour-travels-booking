import type {Metadata} from "next";
import Link from "next/link";
import {ArrowLeft,Globe2} from "lucide-react";
import PartnerApplicationForm from "@/components/partners/PartnerApplicationForm";
export const metadata:Metadata={
  title:"Business Partnership Application | GTH PRO",
  description:"Request a review for property listings, agent onboarding, travel supply or affiliate collaboration with GTH PRO.",
  alternates:{canonical:"/partners/apply"},robots:{index:false,follow:true}
};
export default async function ApplyPage({searchParams}:{searchParams:Promise<{type?:string}>}){
  const {type}=await searchParams;
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <Link href="/partners" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--text-soft)]"><ArrowLeft size={16}/> Partnership information</Link>
      <p className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]"><Globe2 size={16}/> GTH PRO · Partner onboarding</p>
      <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Apply to collaborate</h1>
      <p className="my-7 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">Your submission is a private request for review. Nothing is listed or approved automatically. Existing real-estate owners can use the signed-in property submission flow.</p>
      <PartnerApplicationForm defaultType={type||"developer"}/><p className="mt-5 text-xs leading-6 text-[var(--text-soft)]">Submissions are private requests, not automatic approval. <Link href="/privacy-policy" className="underline">Privacy Policy</Link> · <Link href="/affiliate-disclosure" className="underline">Affiliate Disclosure</Link></p>
    </div>
  </main>;
}

import type {Metadata} from "next";
import {Suspense} from "react";
import TenderAssistantLoader from "@/components/tender/TenderAssistantLoader";
// Static shell; selected notices use the existing protected public reader API.
export const metadata:Metadata={
  title:"AI Tender Eligibility & Guided Bid Preparation | GTH PRO",
  description:"Prepare a tender application step by step with source-first eligibility checks, document checklist, private drafts and optional AI coaching.",
  alternates:{canonical:"/tender/assistant"},
  robots:{index:false,follow:false},
};
export default function TenderAssistantPage(){
 return <Suspense fallback={<main className="gth-container py-12"><p role="status">Loading tender assistant…</p></main>}><TenderAssistantLoader/></Suspense>;
}

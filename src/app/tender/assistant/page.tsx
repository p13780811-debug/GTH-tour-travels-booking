import type {Metadata} from "next";
import TenderAssistant from "@/components/tender/TenderAssistant";
import {getPublicTender} from "@/lib/tender/catalog";
export const dynamic="force-dynamic";
export const metadata:Metadata={
  title:"AI Tender Eligibility & Guided Bid Preparation | GTH PRO",
  description:"Prepare a tender application step by step with source-first eligibility checks, document checklist, private drafts and optional AI coaching.",
  alternates:{canonical:"/tender/assistant"},
  robots:{index:false,follow:false},
};
export default async function TenderAssistantPage({searchParams}:{searchParams:Promise<{tenderId?:string}>}){
  const {tenderId}=await searchParams;
  const response=typeof tenderId==="string" && tenderId.length<=40?await getPublicTender(tenderId):null;
  const original=response?.ok?response.item:null;
  return <TenderAssistant initialTender={original?{
    id:original.id,title:original.title,buyer:original.buyer,
    source_reference:original.source_reference,source_url:original.source_url,
    eligibility_requirements:original.eligibility_requirements||{},
    requirements_verified:Boolean(original.requirements_verified),
    deadline_at:original.deadline_at,
  }:null}/>;
}

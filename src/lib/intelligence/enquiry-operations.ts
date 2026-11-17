import {plainText} from "./contracts";
export const ENQUIRY_STATUSES=["new","reviewing","awaiting_supplier","contacted","closed"] as const;
export type EnquiryStatus=typeof ENQUIRY_STATUSES[number];
export function validateEnquiryUpdate(body:Record<string,unknown>){
 const notes=typeof body.operator_notes==="string"?plainText(body.operator_notes.replace(/[\r\n\t]+/g," "),1500):"";
 const expected=body.expected_updated_at,next=body.next_follow_up_at??null;
 if(Object.keys(body).some(k=>!["id","status","operator_notes","next_follow_up_at","expected_updated_at"].includes(k))||!Number.isSafeInteger(body.id)||Number(body.id)<1||!ENQUIRY_STATUSES.includes(body.status as EnquiryStatus)||typeof body.operator_notes!=="string"||(body.operator_notes.trim()!==""&&!notes)||typeof expected!=="string"||expected.length>40||!/^\d{4}-\d{2}-\d{2}T/.test(expected)||!Number.isFinite(Date.parse(expected))||(next!==null&&(typeof next!=="string"||next.length>40||!Number.isFinite(Date.parse(next))||Date.parse(next)>Date.now()+366*86400000)))throw new Error("Review status, notes and follow-up date.");
 return {id:Number(body.id),status:body.status as EnquiryStatus,operator_notes:notes,next_follow_up_at:body.status==="closed"?null:next as string|null,expected_updated_at:expected};
}

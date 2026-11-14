/**
 * Self-assessed document preparation only. This is never tender eligibility,
 * an award probability, lender credit or a substitution for official criteria.
 * The inputs never leave the visitor's browser.
 */
export type BidReadinessInput={
 turnoverLakhs:string;experienceYears:string;similarProjects:string;
 msme:"unknown"|"registered"|"not_registered";
 gstReady:boolean;financialsReady:boolean;criteriaReviewed:boolean;
};
const numeric=(raw:string,max:number)=>{
 if(!/^\d{1,9}(?:\.\d{1,2})?$/.test(raw))return null;
 const n=Number(raw);return Number.isFinite(n)&&n>=0&&n<=max?n:null;
};
export function scoreBidReadiness(input:BidReadinessInput){
 const turnover=numeric(input.turnoverLakhs,100000000);
 const years=numeric(input.experienceYears,100);
 const similar=numeric(input.similarProjects,100000);
 if(turnover===null||years===null||similar===null)
  return {ok:false as const,error:"Enter valid nonnegative turnover (INR lakh), experience years and similar project counts."};
 const steps=[
  {label:"Turnover information supplied",points:turnover>0?20:0,max:20},
  {label:"Work experience information supplied",points:years>0?15:0,max:15},
  {label:"Comparable work examples available",points:similar>0?15:0,max:15},
  {label:"MSME registration status answered",points:input.msme!=="unknown"?10:0,max:10},
  {label:"GST / business registration documents ready",points:input.gstReady?10:0,max:10},
  {label:"Financial statements ready",points:input.financialsReady?15:0,max:15},
  {label:"Exact tender eligibility conditions reviewed",points:input.criteriaReviewed?15:0,max:15}
 ];
 const score=steps.reduce((sum,step)=>sum+step.points,0);
 const level=score>=75?"Preparation looks advanced":score>=45?"Preparation is in progress":"More preparation needed";
 return {ok:true as const,score,level,steps,missing:steps.filter(step=>!step.points).map(step=>step.label),
  note:"Indicative self-reported preparation score only. Not an eligibility decision, bid approval or verified qualification. Read the official tender notice."};
}

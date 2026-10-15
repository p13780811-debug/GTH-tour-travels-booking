/**
 * Tender preparation state schema shared by browser and authenticated API.
 * User-declared progress, NEVER proof of government verification/submission.
 * No document contents, national IDs, passwords, tokens, bid amounts or secrets.
 */
export const PREBID_CHECKS=[
  {id:"prebid_meeting",label:"Review meeting date and mandatory attendance clause"},
  {id:"site_visit",label:"Review site visit, demo or attendance certificate"},
  {id:"clarifications",label:"Review clarification deadlines and corrigenda"},
  {id:"portal_requirements",label:"Review signing, security, forms and portal submission rules"}
] as const;
export const REVIEW_IDS=PREBID_CHECKS.map(x=>x.id);
export type TenderPreparation={
  version:1;
  checked_documents:string[];
  checked_prebid:string[];
  notice_reviewed_at:string|null;
  deadline_snapshot:string|null;
  source_updated_snapshot:string|null;
  external_submission:"not_reported"|"user_reported";
  external_submission_recorded_at:string|null;
};
export const EMPTY_PREPARATION:TenderPreparation={
  version:1,checked_documents:[],checked_prebid:[],notice_reviewed_at:null,
  deadline_snapshot:null,source_updated_snapshot:null,external_submission:"not_reported",
  external_submission_recorded_at:null,
};
const UUID_LIST=/^[\s\S]{3,120}$/;
const noControl=(v:string)=>!(/[\u0000-\u001f\u007f]/.test(v));
const saneDate=(v:unknown):string|null=>{
  if(v===null||v===undefined||v==="")return null;
  if(typeof v!=="string"||v.length>35||! /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(v))throw new Error("Invalid workflow timestamp");
  const time=Date.parse(v);
  if(!Number.isFinite(time)||Math.abs(time-Date.now())>20*365*86400000)throw new Error("Invalid workflow timestamp");
  return new Date(time).toISOString();
};
export function parsePreparation(raw:unknown):TenderPreparation{
  if(!raw || typeof raw!=="object" || Array.isArray(raw))throw new Error("Invalid workflow progress");
  const v=raw as Record<string,unknown>;
  const allowed=Object.keys(EMPTY_PREPARATION);
  if(Object.keys(v).some(k=>!allowed.includes(k))||v.version!==1)throw new Error("Unsupported workflow progress version");
  const docs=v.checked_documents;
  const pre=v.checked_prebid;
  if(!Array.isArray(docs)||docs.length>25||docs.some(x=>typeof x!=="string"||!UUID_LIST.test(x)||!noControl(x)))
    throw new Error("Invalid reviewed documents");
  if(!Array.isArray(pre)||pre.length>REVIEW_IDS.length||pre.some(x=>typeof x!=="string"||!REVIEW_IDS.includes(x as typeof REVIEW_IDS[number])))
    throw new Error("Invalid prebid reviews");
  const status=v.external_submission;
  if(status!=="not_reported"&&status!=="user_reported")throw new Error("Invalid handoff status");
  const timestamp=saneDate(v.external_submission_recorded_at);
  if(status==="user_reported"&&!timestamp)throw new Error("Missing user submission date");
  return {
    version:1,
    checked_documents:[...new Set(docs as string[])],
    checked_prebid:[...new Set(pre as string[])],
    notice_reviewed_at:saneDate(v.notice_reviewed_at),
    deadline_snapshot:saneDate(v.deadline_snapshot),
    source_updated_snapshot:saneDate(v.source_updated_snapshot),
    external_submission:status,
    external_submission_recorded_at:status==="user_reported"?timestamp:null,
  };
}
export function deriveReadiness(state:TenderPreparation,officialCriteriaReviewed:boolean,deadline:string|null,now:Date=new Date()){
  const ms=deadline?Date.parse(deadline):NaN;
  const expired=Number.isFinite(ms)&&ms<=now.getTime();
  const soon=Number.isFinite(ms)&&ms>now.getTime()&&ms-now.getTime()<=72*3600000;
  const pendingAttendance=REVIEW_IDS.filter(k=>!state.checked_prebid.includes(k));
  const needsSourceReview=!state.notice_reviewed_at;
  const blockers=[
    ...(!officialCriteriaReviewed?["Official qualification criteria have not been independently verified"]:[]),
    ...(needsSourceReview?["Current official notice and corrigenda not yet reviewed"]:[]),
    ...(pendingAttendance.length?["Pre-bid/site/portal checks not all reviewed"]:[]),
    ...(expired?["Saved tender deadline has passed"]:[])
  ];
  return {expired,soon,pendingAttendance,blockers,
    status:state.external_submission==="user_reported"?"user-reported-external-submission":blockers.length?"review-required":"prepared-for-authority-review" as const
  };
}

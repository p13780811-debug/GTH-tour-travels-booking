import {SERVICE_MESSAGE_PREFIX,SERVICE_UUID,parseServiceMessage} from "./services";
export const COMMERCIAL_CURRENCIES=["INR","USD","EUR","GBP","AED"] as const;
export type TenderCommercial={version:1;revision:number;stage:"quoted"|"accepted"|"paid"|"lost";feeMinor:number;currency:typeof COMMERCIAL_CURRENCIES[number];quoteRef:string;invoiceRef:string;paidDate:string|null;paidZone?:string|null;note:string;updatedAt:string;updatedBy:string};
export type CommercialInput={id:string;expectedRevision:number;stage:TenderCommercial["stage"];fee:string;currency:string;quoteRef:string;invoiceRef:string;paidDate:string;paidZone?:string;note:string;confirmed:boolean};
const text=(value:unknown,max:number)=>typeof value==="string"&&value.length<=max&&!/[\u0000-\u001f\u007f<>]/.test(value);
const noteText=(value:unknown)=>typeof value==="string"&&value.length<=200&&!/[\u0000-\u0009\u000b-\u001f\u007f<>]/.test(value);
export function commercialMoney(value:string):number|null{
 if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(value))return null;
 const [whole,decimal=""]=value.split("."),minor=Number(whole)*100+Number(decimal.padEnd(2,"0"));
 return Number.isSafeInteger(minor)&&minor>0?minor:null;
}
export function parseTenderCommercial(message:unknown):TenderCommercial|null{
 if(!parseServiceMessage(message))return null;
 const row=JSON.parse((message as string).slice(SERVICE_MESSAGE_PREFIX.length)).commercial;
 if(row===undefined)return null;
 if(!row||row.version!==1||!Number.isSafeInteger(row.revision)||row.revision<1||!["quoted","accepted","paid","lost"].includes(row.stage)||
 !Number.isSafeInteger(row.feeMinor)||row.feeMinor<=0||!COMMERCIAL_CURRENCIES.includes(row.currency)||!text(row.quoteRef,80)||!row.quoteRef.trim()||!text(row.invoiceRef,80)||!noteText(row.note)||
 typeof row.updatedAt!=="string"||!Number.isFinite(Date.parse(row.updatedAt))||typeof row.updatedBy!=="string"||!SERVICE_UUID.test(row.updatedBy)||
 (row.stage==="paid"&&(!row.invoiceRef.trim()||typeof row.paidDate!=="string"||!/^\d{4}-\d\d-\d\d$/.test(row.paidDate)))||
 (row.stage!=="paid"&&row.paidDate!==null))throw Error("Commercial log needs review before changing");
 return row as TenderCommercial;
}
export function commercialDateInZone(date:Date,zone:string){
 if(!text(zone,60)||!zone)throw Error("Choose a valid payment time zone");
 const parts=new Intl.DateTimeFormat("en",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
 const part=(kind:string)=>parts.find(p=>p.type===kind)!.value;
 return `${part("year")}-${part("month")}-${part("day")}`;
}
export function nextTenderCommercial(body:Record<string,unknown>,previous:TenderCommercial|null,actor:string,now=new Date()):TenderCommercial{
 const allowed=["id","expectedRevision","stage","fee","currency","quoteRef","invoiceRef","paidDate","paidZone","note","confirmed"];
 if(Object.keys(body).some(k=>!allowed.includes(k))||typeof body.id!=="string"||!SERVICE_UUID.test(body.id)||!SERVICE_UUID.test(actor)||body.confirmed!==true||!Number.isInteger(body.expectedRevision)||body.expectedRevision!==(previous?.revision??0))throw Error("Refresh the request and confirm the commercial event");
 if(previous?.stage==="paid")throw Error("Recorded payments cannot be overwritten; reconcile adjustments in your invoice system");
 if(!["quoted","accepted","paid","lost"].includes(String(body.stage))||!text(body.quoteRef,80)||!(body.quoteRef as string).trim()||!text(body.invoiceRef,80)||!noteText(body.note)||typeof body.fee!=="string"||!COMMERCIAL_CURRENCIES.includes(body.currency as typeof COMMERCIAL_CURRENCIES[number]))throw Error("Complete the quote reference, fee and currency");
 const feeMinor=commercialMoney(body.fee);if(feeMinor===null)throw Error("Enter a positive fee with up to two decimal places");
 const stage=body.stage as TenderCommercial["stage"];
 if(!previous&&stage!=="quoted")throw Error("Record the written quote before acceptance or payment");
 if(stage==="accepted"&&previous?.stage!=="quoted")throw Error("Only a quoted request can be accepted");
 if(stage==="paid"&&previous?.stage!=="accepted")throw Error("Record customer acceptance before payment");
 if(stage!=="quoted"&&previous&&(feeMinor!==previous.feeMinor||body.currency!==previous.currency||body.quoteRef!==previous.quoteRef))throw Error("Record a revised quote before changing its fee, currency or reference");
 let paidDate:string|null=null,paidZone:string|null=null;
 if(stage==="paid"){
  paidZone=typeof body.paidZone==="string"?body.paidZone:"UTC";
  const today=commercialDateInZone(now,paidZone);
  if(typeof body.paidDate!=="string"||!/^\d{4}-\d\d-\d\d$/.test(body.paidDate)||!Number.isFinite(Date.parse(body.paidDate))||new Date(body.paidDate).toISOString().slice(0,10)!==body.paidDate||body.paidDate>today||!(body.invoiceRef as string).trim())throw Error("Record a valid payment date and invoice or receipt reference");
  paidDate=body.paidDate;
 }
 return {version:1,revision:(previous?.revision??0)+1,stage,feeMinor,currency:body.currency as TenderCommercial["currency"],quoteRef:(body.quoteRef as string).trim(),invoiceRef:stage==="paid"?(body.invoiceRef as string).trim():"",paidDate,paidZone,note:(body.note as string).trim(),updatedAt:now.toISOString(),updatedBy:actor};
}
export function appendTenderCommercial(message:string,commercial:TenderCommercial){
 if(!parseServiceMessage(message))throw Error("Not a tender service request");
 const output=SERVICE_MESSAGE_PREFIX+JSON.stringify({...JSON.parse(message.slice(SERVICE_MESSAGE_PREFIX.length)),commercial});
 if(output.length>3000)throw Error("Commercial log exceeds the request storage limit");return output;
}
export function commercialPageTotals(items:Array<{commercial?:TenderCommercial|null}>){
 const currencies=new Map<string,{quoted:number;accepted:number;paid:number}>();
 for(const {commercial:c} of items){if(!c||c.stage==="lost")continue;const row=currencies.get(c.currency)??{quoted:0,accepted:0,paid:0};row[c.stage]+=c.feeMinor;currencies.set(c.currency,row);}
 return [...currencies].map(([currency,totals])=>({currency,...totals}));
}

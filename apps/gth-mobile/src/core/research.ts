import type {DiscoveryKind} from "./catalog";

export type PersonalResearch={note:string;checked:string[]};
const steps:Record<DiscoveryKind,readonly {id:string;label:string}[]>={
 hotel:[{id:"dates",label:"Confirm dates and room availability"},{id:"location",label:"Check the location and property details"},
  {id:"total",label:"Review the total price and taxes"},{id:"terms",label:"Read cancellation and check-in terms"}],
 property:[{id:"source",label:"Review the project and original source"},{id:"rights",label:"Check ownership and registration documents"},
  {id:"cost",label:"Review price, fees and finance"},{id:"visit",label:"Arrange a visit and independent checks"}],
 tender:[{id:"deadline",label:"Confirm the deadline and time zone"},{id:"eligibility",label:"Check official eligibility requirements"},
  {id:"documents",label:"Prepare the required documents"},{id:"submission",label:"Review the official submission process"}],
 tour:[{id:"date",label:"Confirm dates and availability"},{id:"inclusions",label:"Check inclusions and exclusions"},
  {id:"meeting",label:"Review the meeting point and timing"},{id:"terms",label:"Read age and cancellation conditions"}],
};
export function researchSteps(kind:DiscoveryKind){return steps[kind];}
export function normalizeNote(raw:string):string{
 return raw.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,"").slice(0,600);
}
export function parseResearch(raw:unknown,kind:DiscoveryKind):PersonalResearch{
 const data=raw&&typeof raw==="object"?raw as Record<string,unknown>:{};
 const allowed=steps[kind].map(step=>step.id);
 return {note:typeof data.note==="string"?normalizeNote(data.note):"",
  checked:Array.isArray(data.checked)?[...new Set(data.checked.filter((id):id is string=>typeof id==="string"&&allowed.includes(id)))].slice(0,4):[]};
}

import type {Fuel,FuelUnit} from "./city";

export type Shift = {
  cityKey:string; date:string; currency:string; fuel:Fuel; unit:FuelUnit; distanceUnit:"km"|"mi";
  revenue:number; distance:number; efficiency:number; fuelPrice:number; other:number;
};
export const SHIFT_KEY="gth.mobility.diary.v1";
export const MAX_SHIFTS=365;
const fuels=["petrol","diesel","cng"];
const units=["L","US gal","kg","GGE"];
const maxInput=1_000_000_000;

export function validShift(value:unknown):value is Shift {
  if(!value||typeof value!=="object"||Array.isArray(value))return false;
  const row=value as Shift;
  if(typeof row.cityKey!=="string"||row.cityKey.length<2||row.cityKey.length>225||
     typeof row.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||
     typeof row.currency!=="string"||!/^[A-Z]{3}$/.test(row.currency)||
     !fuels.includes(row.fuel)||!units.includes(row.unit)||(row.distanceUnit!=="km"&&row.distanceUnit!=="mi"))return false;
  const stamp=Date.parse(row.date+"T00:00:00Z");
  if(!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==row.date)return false;
  return [row.revenue,row.distance,row.efficiency,row.fuelPrice,row.other]
    .every(n=>Number.isFinite(n)&&n>=0&&n<=maxInput)
    && (row.efficiency===0 ? row.distance===0 : row.efficiency>=0.01)
    && shiftTotals(row).fuelCost<=maxInput;
}
export function shiftTotals(shift:Pick<Shift,"distance"|"efficiency"|"fuelPrice"|"revenue"|"other">) {
  const fuelUsed=shift.efficiency>0?shift.distance/shift.efficiency:0;
  const fuelCost=Math.round(fuelUsed*shift.fuelPrice*1000)/1000;
  const net=Math.round((shift.revenue-shift.other-fuelCost)*1000)/1000;
  return {fuelUsed,fuelCost,net};
}
export function readShifts(raw:string|null):Shift[] {
  if(!raw||raw.length>500_000)return [];
  try{
    const rows:unknown=JSON.parse(raw);
    return Array.isArray(rows)?rows.filter(validShift).slice(0,MAX_SHIFTS):[];
  }catch{return [];}
}
export function upsertShift(rows:Shift[],shift:Shift):Shift[] {
  return [shift,...rows.filter(row=>row.cityKey!==shift.cityKey||row.date!==shift.date)]
    .sort((a,b)=>b.date.localeCompare(a.date)).slice(0,MAX_SHIFTS);
}

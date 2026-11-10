export type ComparableUnit={id:string;project_id:number;price_amount:number;currency:string;area_sqft:number;area_basis:string;property_type:string;listing_type:string;bedrooms?:number};
export function askingEvidence(units:ComparableUnit[],target:{currency:string;property_type:string;area_basis:string;bedrooms?:number}) {
 const distinct=new Map(units.filter(u=>u.listing_type==='buy'&&u.currency===target.currency&&u.property_type===target.property_type&&u.area_basis===target.area_basis&&(target.bedrooms===undefined||u.bedrooms===target.bedrooms)&&u.price_amount>0&&u.area_sqft>0&&Number.isFinite(u.price_amount/u.area_sqft)).map(u=>[u.id,u]));const rows=[...distinct.values()];const projects=new Set(rows.map(u=>u.project_id));if(projects.size<5)return null;const values=rows.map(u=>u.price_amount/u.area_sqft).sort((a,b)=>a-b);const m=Math.floor(values.length/2);return {median:values.length%2?values[m]:(values[m-1]+values[m])/2,min:values[0],max:values.at(-1)!,listings:values.length,projects:projects.size};
}

export function askingPriceChange(amount: unknown, previous: unknown) {
  const read = (value: unknown) => typeof value === "number" || (typeof value === "string" && /^\d+(?:\.\d{1,2})?$/.test(value)) ? Number(value) : NaN
  // Source amounts are stored to two decimal places. Compare integer minor units.
  const current = Math.round(read(amount) * 100)
  const prior = Math.round(read(previous) * 100)
  if (!Number.isSafeInteger(current) || !Number.isSafeInteger(prior) || current <= 0 || prior <= 0) return null
  const cents = current - prior
  return { amount: cents / 100, ratio: cents / prior }
}

/** WeGoTrip product-card contract documented by the supplier via Travelpayouts. */
export const WEGOTRIP_API="https://app.wegotrip.com/api/v2";
export const WEGOTRIP_CARD_DOCUMENTATION="https://support.travelpayouts.com/hc/en-us/articles/360016170039-WeGoTrip-affiliate-program-API";
export type SupplierCity={id:number;name:string;slug:string;country:string};
export type SupplierProduct={provider:"wegotrip";id:number;title:string;city:SupplierCity;image:string;href:string;price:number|null;currency:string;kind:"audio-tour"|"attraction-ticket";admissionOnly?:boolean};
export function object(value:unknown):Record<string,unknown>{return value!==null&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};}
export function supplierId(value:unknown):value is number{return typeof value==="number"&&Number.isSafeInteger(value)&&value>0;}
function text(value:unknown,max:number){return typeof value==="string"?value.trim().replace(/[\u0000-\u001f\u007f]/g,"").slice(0,max):"";}
export function supplierCity(value:unknown):SupplierCity|null{
 const row=object(value),slug=text(row.slug,100),name=text(row.name,120);
 if(!supplierId(row.id)||!name||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return null;
 const country=typeof row.country==="string"?text(row.country,100):text(object(row.country).name,100);
 return {id:row.id,name,slug,country};
}
export function supplierImage(value:unknown):string|null{
 if(typeof value!=="string"||value.length>2048)return null;
 try{const url=new URL(value);return url.protocol==="https:"&&!url.username&&!url.password&&!url.port&&!url.search&&!url.hash&&
 ["wgt-prod-storage.s3.amazonaws.com","app.wegotrip.com"].includes(url.hostname)&&url.pathname.startsWith("/media/")&&/\.(?:jpe?g|png|webp)$/i.test(url.pathname)?url.href:null;}catch{return null;}
}
export function normalizeSupplierProduct(value:unknown,city:SupplierCity):SupplierProduct|null{
 const row=object(value),place=object(row.city),title=text(row.title,240),slug=text(row.slug,240),image=supplierImage(row.preview);
 if(!supplierId(row.id)||place.id!==city.id||place.slug!==city.slug||!title||!image||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||object(row.tags).available!==true||row.locale!=="en"||typeof row.type!=="number"||![1,2,3].includes(row.type))return null;
 const currency=text(row.currencyCode,3);if(!/^[A-Z]{3}$/.test(currency))return null;
 const href=`https://wegotrip.com/${city.slug}-d${city.id}/${slug}-p${row.id}/`;
 return {provider:"wegotrip",id:row.id,title,city,image,href,price:typeof row.price==="number"&&Number.isFinite(row.price)&&row.price>0?row.price:null,currency,kind:row.type===1?"audio-tour":"attraction-ticket",admissionOnly:row.type===2};
}
export function uniqueSupplierProducts(rows:SupplierProduct[]):SupplierProduct[]{
 const ids=new Set<number>(),names=new Set<string>();return rows.filter(row=>{const key=`${row.city.id}:${row.title.normalize("NFKC").toLocaleLowerCase()}`;if(ids.has(row.id)||names.has(key))return false;ids.add(row.id);names.add(key);return true;});
}

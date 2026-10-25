import {appServices} from "./app-dashboard";
export const APP_SERVICE_PREFERENCES_KEY="gth.app.services.v1";
export const MAX_FAVOURITES=8;
export type AppPreferences={version:1;favourites:string[];recent:string[]};
export const emptyAppPreferences=():AppPreferences=>({version:1,favourites:[],recent:[]});
const known=(id:unknown):id is string=>typeof id==="string"&&appServices.some(service=>service.id===id);
export function parseAppPreferences(raw:string|null):AppPreferences{
 if(!raw||raw.length>4096)return emptyAppPreferences();
 try{const value=JSON.parse(raw);if(value?.version!==1)return emptyAppPreferences();
 const clean=(ids:unknown,max:number)=>Array.isArray(ids)?[...new Set(ids.filter(known))].slice(0,max):[];
 return {version:1,favourites:clean(value.favourites,MAX_FAVOURITES),recent:clean(value.recent,4)};
 }catch{return emptyAppPreferences();}
}
export function toggleAppFavourite(value:AppPreferences,id:string):AppPreferences{
 if(!known(id))return value;
 return {...value,favourites:value.favourites.includes(id)?value.favourites.filter(item=>item!==id):value.favourites.length<MAX_FAVOURITES?[...value.favourites,id]:value.favourites};
}
export function recordAppService(value:AppPreferences,id:string):AppPreferences{
 return known(id)?{...value,recent:[id,...value.recent.filter(item=>item!==id)].slice(0,4)}:value;
}
export function appServiceForPath(path:string):string|undefined{
 return appServices.find(service=>service.href.startsWith("/app/")&&(path===service.href||path.startsWith(`${service.href}/`)))?.id;
}

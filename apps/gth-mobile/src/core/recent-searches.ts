import AsyncStorage from "@react-native-async-storage/async-storage";
import {useCallback,useEffect,useRef,useState} from "react";
import {normalizeQuery} from "./routing";
import {createDeviceWriteQueue} from "./device-writes";

export const RECENT_SEARCHES_KEY="gthpro.native.recent-searches.v1";
export const MAX_RECENT_SEARCHES=8;
const MAX_SERIALIZED=2400;
export function parseRecentSearches(raw:string|null):string[]{
 if(!raw||raw.length>MAX_SERIALIZED)return [];
 try {
  const value:unknown=JSON.parse(raw);
  if(!Array.isArray(value))return [];
  const seen=new Set<string>();
  return value.flatMap((item):string[]=>{
   if(typeof item!=="string"||item.length>70)return [];
   const query=normalizeQuery(item);
   const key=query.toLocaleLowerCase("en");
   if(query.length<2||seen.has(key))return [];
   seen.add(key);
   return [query];
  }).slice(0,MAX_RECENT_SEARCHES);
 }catch{return [];}
}
export function rememberSearch(previous:readonly string[],raw:string):string[]{
 const query=normalizeQuery(raw);
 if(query.length<2)return [...previous];
 return [query,...previous.filter(x=>x.toLocaleLowerCase("en")!==query.toLocaleLowerCase("en"))].slice(0,MAX_RECENT_SEARCHES);
}

/** All search history remains on this device; the customer can erase it at once. */
export function useRecentSearches(){
 const [items,setItems]=useState<string[]>([]);
 const [ready,setReady]=useState(false);
 const [storageError,setStorageError]=useState(false);
 const current=useRef<string[]>([]);
 const queue=useRef(createDeviceWriteQueue());
 useEffect(()=>{
  let active=true;
  AsyncStorage.getItem(RECENT_SEARCHES_KEY).then(raw=>{
   if(!active)return;
   const restored=parseRecentSearches(raw);
   current.current=restored;
   setItems(restored);
  }).catch(()=>{if(active)setStorageError(true);}).finally(()=>{if(active)setReady(true);});
  return ()=>{active=false;};
 },[]);
 const write=useCallback((next:string[])=>{
  if(!ready)return;
  current.current=next;
  setItems(next);
  void queue.current(async()=>{
   if(next.length)await AsyncStorage.setItem(RECENT_SEARCHES_KEY,JSON.stringify(next));
   else await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  },saved=>setStorageError(!saved));
 },[ready]);
 return {
  items,ready,storageError,
  remember:(query:string)=>write(rememberSearch(current.current,query)),
  clear:()=>write([]),
 };
}

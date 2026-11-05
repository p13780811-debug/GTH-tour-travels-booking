import AsyncStorage from "@react-native-async-storage/async-storage";
import {useCallback,useEffect,useRef,useState} from "react";
import {approvedRecordPath} from "./routing";
import type {DiscoveryCard} from "./catalog";
import {createDeviceWriteQueue} from "./device-writes";

export const BOOKMARKS_KEY="gthpro.native.bookmarks.v1";
export const BOOKMARK_LIMIT=30;
export function parseBookmarks(raw:string|null):DiscoveryCard[]{
 if(!raw||raw.length>32000)return [];
 try {
  const json:unknown=JSON.parse(raw);
  if(!Array.isArray(json))return [];
  const seen=new Set<string>();
  return json.filter((entry):entry is DiscoveryCard=>{
   if(!entry||typeof entry!=="object")return false;
   const item=entry as Partial<DiscoveryCard>;
   const path=typeof item.id==="string"&&typeof item.kind==="string"
     ?approvedRecordPath(item.kind as DiscoveryCard["kind"],item.id):null;
   if(!path||path!==item.webPath||seen.has(path))return false;
   if(typeof item.title!=="string"||item.title.length>120||!item.title.trim()
    ||typeof item.subtitle!=="string"||item.subtitle.length>120
    ||typeof item.source!=="string"||item.source.length>80)return false;
   seen.add(path);
   return true;
  }).slice(0,BOOKMARK_LIMIT).map(v=>({
   id:v.id,kind:v.kind,title:v.title,subtitle:v.subtitle,source:v.source,
   webPath:v.webPath,tag:typeof v.tag==="string"?v.tag.slice(0,60):undefined,
  }));
 }catch{return [];}
}
export function addBookmark(items:DiscoveryCard[],item:DiscoveryCard):DiscoveryCard[]{
 if(!item.webPath||!approvedRecordPath(item.kind,item.id)||item.webPath!==approvedRecordPath(item.kind,item.id))return items;
 return [item,...items.filter(x=>x.webPath!==item.webPath)].slice(0,BOOKMARK_LIMIT);
}
export function removeBookmark(items:DiscoveryCard[],path:string):DiscoveryCard[]{
 return items.filter(x=>x.webPath!==path);
}
export function useNativeBookmarks(){
 const [items,setItems]=useState<DiscoveryCard[]>([]);
 const [ready,setReady]=useState(false);
 const [storageError,setStorageError]=useState(false);
 const current=useRef<DiscoveryCard[]>([]);
 const readBlocked=useRef(false);
 const writeQueue=useRef(createDeviceWriteQueue());
 useEffect(()=>{
  let mounted=true;
  AsyncStorage.getItem(BOOKMARKS_KEY).then(raw=>{
   if(!mounted)return;
   const restored=parseBookmarks(raw);
   current.current=restored;
   setItems(restored);
  }).catch(()=>{readBlocked.current=true;if(mounted)setStorageError(true);}).finally(()=>{if(mounted)setReady(true);});
  return ()=>{mounted=false;};
 },[]);
 const apply=useCallback((fn:(value:DiscoveryCard[])=>DiscoveryCard[])=>{
  if(!ready)return;
  const next=fn(current.current);
  current.current=next;
  setItems(next);
  // Never overwrite unseen saved records after a failed initial read.
  if(readBlocked.current)return;
  // Serialize writes: tapping Save/Remove quickly cannot resurrect old data.
  void writeQueue.current(()=>AsyncStorage.setItem(BOOKMARKS_KEY,JSON.stringify(next)),
   saved=>setStorageError(!saved));
 },[ready]);
 return {items,ready,storageError,
  save:(item:DiscoveryCard)=>apply(existing=>addBookmark(existing,item)),
  remove:(path:string)=>apply(existing=>removeBookmark(existing,path)),
  clear:()=>apply(()=>[]),
 };
}

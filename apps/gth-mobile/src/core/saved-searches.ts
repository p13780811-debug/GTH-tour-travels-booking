import AsyncStorage from "@react-native-async-storage/async-storage";
import {useEffect,useRef,useState} from "react";
import {createDeviceWriteQueue} from "./device-writes";
import {normalizeQuery} from "./routing";
import type {SearchChoice} from "./unified-search";

type SavedSearch={choice:SearchChoice;term:string;region:string};
const choices=new Set<string>(["all","travel","hotel","property","tender","tour"]);
const storageKey="gthpro.native.saved-searches.v1";
const maxSaved=15;

export function savedSearchKey(search:SavedSearch){
 return JSON.stringify([search.choice,search.term.toLowerCase(),search.region]);
}

export function normalizeSavedSearch(choice:SearchChoice,raw:string,region:string):SavedSearch|null{
 const term=normalizeQuery(raw);
 if(term.length<2||!choices.has(choice))return null;
 const scoped=choice==="tender"||choice==="all";
 return {choice,term,region:scoped&&/^(?:WORLD|[A-Z]{2})$/.test(region)?region:"IN"};
}

function restoreSearches(raw:string|null):SavedSearch[]{
 if(!raw||raw.length>8_000)return [];
 try{
  const data:unknown=JSON.parse(raw);
  if(!Array.isArray(data))return [];
  const seen=new Set<string>();
  return data.flatMap(value=>{
   if(typeof value?.term!=="string"||typeof value.region!=="string"||!choices.has(value.choice))return [];
   const entry=normalizeSavedSearch(value.choice,value.term,value.region);
   if(!entry)return [];
   const key=savedSearchKey(entry);
   if(seen.has(key))return [];
   seen.add(key);
   return [entry];
  }).slice(0,maxSaved);
 }catch{return [];}
}

export function useSavedSearches(){
 const [items,setItems]=useState<SavedSearch[]>([]);
 const [ready,setReady]=useState(false);
 const [storageError,setStorageError]=useState(false);
 const readFailed=useRef(false);
 const current=useRef<SavedSearch[]>([]);
 const writes=useRef(createDeviceWriteQueue());
 useEffect(()=>{
  let active=true;
  AsyncStorage.getItem(storageKey).then(raw=>{
   if(!active)return;
   current.current=restoreSearches(raw);
   setItems(current.current);
  }).catch(()=>{if(active){readFailed.current=true;setStorageError(true);}}).finally(()=>{if(active)setReady(true);});
  return ()=>{active=false;};
 },[]);
 function toggle(entry:SavedSearch){
  if(!ready)return;
  const key=savedSearchKey(entry);
  const filtered=current.current.filter(search=>savedSearchKey(search)!==key);
  const next=filtered.length===current.current.length?[entry,...filtered].slice(0,maxSaved):filtered;
  current.current=next;
  setItems(next);
  if(!readFailed.current)void writes.current(()=>AsyncStorage.setItem(storageKey,JSON.stringify(next)),ok=>setStorageError(!ok));
 }
 return {items,ready,storageError,toggle};
}

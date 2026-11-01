"use client";
import {useCallback,useEffect,useState} from "react";
import {RESEARCH_KEY,parseResearch,saveResearch,removeResearch,type ResearchEntry} from "@/lib/mobile/research-board";
const CHANGE="gth-app-research-changed";

export default function useAppResearch(){
 const [items,setItems]=useState<ResearchEntry[]>([]);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  const sync=()=>{
   try{setItems(parseResearch(window.localStorage.getItem(RESEARCH_KEY)));}
   catch{setItems([]);}
  };
  sync();
  setReady(true);
  window.addEventListener("storage",sync);
  window.addEventListener(CHANGE,sync);
  return ()=>{
   window.removeEventListener("storage",sync);
   window.removeEventListener(CHANGE,sync);
  };
 },[]);
 const update=useCallback((fn:(value:ResearchEntry[])=>ResearchEntry[])=>{
  let current:ResearchEntry[]=[];
  try{current=parseResearch(window.localStorage.getItem(RESEARCH_KEY));}
  catch{current=items;}
  const next=fn(current);
  setItems(next);
  try{
   window.localStorage.setItem(RESEARCH_KEY,JSON.stringify(next));
   window.dispatchEvent(new Event(CHANGE));
  }catch{/* Personal records remain local and navigation still works. */}
 },[items]);
 return {
  items,ready,
  save:(value:Omit<ResearchEntry,"addedAt">)=>update(current=>saveResearch(current,value)),
  remove:(href:string)=>update(current=>removeResearch(current,href)),
  clear:()=>update(()=>[]),
 };
}

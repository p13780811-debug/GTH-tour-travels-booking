import {useEffect,useRef,useState} from "react";
import {combineSlices,nextNativePage,refreshNativeSources,retryNativeSources,searchNativeSources,type SearchChoice,type SearchOutcome} from "./unified-search";

/** Native discovery owns request cancellation, page cursors and stale-result
 * protection. Switching tabs does not discard a completed search. */
export function useNativeDiscovery(choice:SearchChoice,term:string,tenderRegion:string){
 const [data,setData]=useState<SearchOutcome>(()=>combineSlices([]));
 const [pending,setPending]=useState(false);
 const [morePending,setMorePending]=useState(false);
 const [refreshing,setRefreshing]=useState(false);
 const [refreshQueued,setRefreshQueued]=useState(false);
 const [error,setError]=useState("");
 const [revision,setRevision]=useState(0);
 const generation=useRef(0);
 const current=useRef(data);
 const moreLock=useRef(false);
 const moreController=useRef<AbortController|null>(null);
 useEffect(()=>{
  const version=++generation.current;
  moreController.current?.abort();moreLock.current=false;setMorePending(false);setRefreshing(false);setRefreshQueued(false);
  const empty=combineSlices([]);current.current=empty;setData(empty);setError("");
  if((choice==="all"||choice==="travel")&&!term.trim()){setPending(false);return;}
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),11_000);
  setPending(true);
  searchNativeSources(choice,term,controller.signal,tenderRegion).then(result=>{
   if(generation.current!==version)return;
   current.current=result;setData(result);
   if(result.slices.length>0&&result.slices.every(slice=>slice.error))
    setError("The published sources are temporarily unavailable. Please retry.");
  }).catch(()=>{
   if(generation.current===version)setError("Unable to load these records. Check your connection and retry.");
  }).finally(()=>{clearTimeout(timer);if(generation.current===version)setPending(false);});
  return ()=>{generation.current++;clearTimeout(timer);controller.abort();moreController.current?.abort();};
 },[choice,term,tenderRegion,revision]);
 async function recoverOrLoad(mode:"more"|"recover"|"refresh"="more"){
  if(mode==="more"&&current.current.slices.some(slice=>slice.stale))mode="refresh";
  if(mode==="refresh"&&(pending||moreLock.current)){setRefreshQueued(true);return;}
  if(pending||moreLock.current||!current.current.slices.some(slice=>mode==="refresh"?true:mode==="recover"?slice.error:slice.hasNext))return;
  moreLock.current=true;setMorePending(true);
  setRefreshing(mode==="refresh");
  const version=generation.current;
  const controller=new AbortController();moreController.current=controller;
  const timeout=mode==="refresh"?Math.min(45_000,11_000*Math.max(1,...current.current.slices.map(slice=>slice.page??1))):11_000;
  const timer=setTimeout(()=>controller.abort(),timeout);
  try{
   const load=mode==="refresh"?refreshNativeSources:mode==="recover"?retryNativeSources:nextNativePage;
   const result=await load(current.current.slices,term,controller.signal,tenderRegion);
   if(generation.current!==version)return;
   current.current=result;setData(result);
   setError(result.slices.length>0&&result.slices.every(slice=>slice.error)
    ?"The published sources are temporarily unavailable. Please retry.":"");
  }catch{
   if(generation.current===version)setError("Unable to load these records. Check your connection and retry.");
  }finally{
   clearTimeout(timer);
   if(generation.current===version){moreLock.current=false;setMorePending(false);setRefreshing(false);}
  }
 }
 useEffect(()=>{
  if(refreshQueued&&!pending&&!morePending){setRefreshQueued(false);void recoverOrLoad("refresh");}
 },[refreshQueued,pending,morePending]);
 return {...data,pending,morePending,refreshing,error,hasMore:data.slices.some(slice=>slice.hasNext),
  stale:data.slices.some(slice=>slice.stale),refresh:()=>{void recoverOrLoad("refresh");},
  loadMore:()=>recoverOrLoad(),retry:()=>{
   if(current.current.slices.some(slice=>slice.stale))void recoverOrLoad("refresh");
   else if(current.current.slices.some(slice=>slice.error))void recoverOrLoad("recover");
   else setRevision(value=>value+1);
  }};
}

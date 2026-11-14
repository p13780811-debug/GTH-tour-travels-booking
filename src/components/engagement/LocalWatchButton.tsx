"use client";

import {useEffect,useState} from "react";
import {Bell,BellOff} from "lucide-react";

type Kind="property"|"tender"|"flight";
type Watch={id:string;kind:Kind;title:string;path:string;snapshot:string;deadline:string;lastNotice:string};
const KEY="gth-pro-local-watch-v1",LIMIT=50;
function read():Watch[]{
 try{
  const value:unknown=JSON.parse(localStorage.getItem(KEY)||"[]");
  if(!Array.isArray(value))return [];
  return value.filter((x):x is Watch=>Boolean(x)&&typeof x==="object"
   &&["property","tender","flight"].includes(x.kind)&&typeof x.id==="string"&&x.id.length<130
   &&typeof x.path==="string"&&x.path.startsWith("/")&&!x.path.startsWith("//")
   &&typeof x.title==="string"&&typeof x.snapshot==="string"
   &&typeof x.deadline==="string"&&typeof x.lastNotice==="string").slice(0,LIMIT);
 }catch{return [];}
}
function write(items:Watch[]){
 try{localStorage.setItem(KEY,JSON.stringify(items.slice(0,LIMIT)));window.dispatchEvent(new Event("gth-watch-change"));return true;}
 catch{return false;}
}
async function localNotice(title:string,body:string,path:string){
 // This is a notification while a GTH page runs, NOT true background Web Push.
 if(!("Notification" in window)||Notification.permission!=="granted"||!("serviceWorker" in navigator))return false;
 try{
  const registration=await navigator.serviceWorker.register("/sw.js",{scope:"/"});
  await registration.showNotification(title.slice(0,110),{
   body:body.slice(0,180),tag:"gth-watch-"+path.slice(0,80),
   data:{path},icon:"/app-brand/icon-192.png",
  });
  return true;
 }catch{return false;}
}
export default function LocalWatchButton({kind,id,title,path,snapshot="",deadline=""}:{
 kind:Kind;id:string;title:string;path:string;snapshot?:string;deadline?:string;
}){
 const [saved,setSaved]=useState(false),[message,setMessage]=useState("");
 const key=kind+":"+id;
 useEffect(()=>{
  const sync=()=>setSaved(read().some(x=>x.kind+":"+x.id===key));
  sync();window.addEventListener("storage",sync);window.addEventListener("gth-watch-change",sync);
  return()=>{window.removeEventListener("storage",sync);window.removeEventListener("gth-watch-change",sync);};
 },[key]);
 useEffect(()=>{
  const list=read(),index=list.findIndex(x=>x.kind+":"+x.id===key);
  if(index<0||!path.startsWith("/")||path.startsWith("//"))return;
  const previous=list[index],next:{title:string;path:string;snapshot:string;deadline:string}={
   title:title.slice(0,120),path,snapshot:snapshot.slice(0,100),deadline:deadline.slice(0,40),
  };
  const now=Date.now(),until=Date.parse(deadline),last=Date.parse(previous.lastNotice);
  const canAlert=!Number.isFinite(last)||now-last>24*3600_000;
  const changed=kind==="property"&&Boolean(previous.snapshot&&next.snapshot)&&previous.snapshot!==next.snapshot;
  const due=kind==="tender"&&Number.isFinite(until)&&until>now&&until-now<72*3600_000;
  if(changed||due){
    if(canAlert){void localNotice("GTH PRO watch",changed?"Recorded property price information changed. Recheck the original listing.":"A saved tender deadline is within 72 hours. Confirm with the issuer.",path);}
    next.snapshot=snapshot.slice(0,100);
    list[index]={...previous,...next,lastNotice:canAlert?new Date(now).toISOString():previous.lastNotice};
    write(list);
  }
 },[key,kind,title,path,snapshot,deadline]);
 async function toggle(){
  setMessage("");
  if(!path.startsWith("/")||path.startsWith("//")||id.length>120)return;
  const list=read(),exists=list.some(x=>x.kind+":"+x.id===key);
  if(exists){setMessage(write(list.filter(x=>x.kind+":"+x.id!==key))?"Watch removed from this device.":"Browser storage unavailable.");return;}
  if(list.length>=LIMIT){setMessage("Maximum 50 local watches. Remove an older watch.");return;}
  // Permission request follows a direct click, never a page load.
  let permission="unsupported";
  if("Notification" in window&&window.isSecureContext)try{permission=await Notification.requestPermission();}catch{permission="denied";}
  const added=write([...list,{kind,id:id.slice(0,120),title:title.slice(0,120),path,snapshot:snapshot.slice(0,100),deadline:deadline.slice(0,40),lastNotice:""}]);
  if(!added){setMessage("Device storage unavailable; watch was not saved.");return;}
  setMessage(permission==="granted"?"Saved. Local notifications can appear when you revisit GTH PRO pages.":"Saved for your next visit. Browser notifications are unavailable or not permitted.");
 }
 return <div className="mt-2">
  <button type="button" aria-pressed={saved} onClick={()=>void toggle()}
   className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-semibold">
   {saved?<BellOff size={16}/>:<Bell size={16}/>}
   {saved?"Stop watching":kind==="flight"?"Save flight route":"Notify me on next visit"}
  </button>
  {message&&<p role="status" className="mt-2 text-xs leading-5 text-[var(--text-soft)]">{message}</p>}
  <p className="mt-1 max-w-xs text-[11px] leading-5 text-[var(--text-soft)]">
   {kind==="flight"?"Route saved on this browser. Automatic fare/price-drop alerts require an authorized live feed and are not active."
    :kind==="tender"?"Deadline reminder is checked when you revisit; for an offline reminder use the calendar download. This is not background Web Push."
    :"Recorded changes are checked when you reopen this listing; no closed-app background push or guaranteed price-drop feed."}
  </p>
 </div>;
}

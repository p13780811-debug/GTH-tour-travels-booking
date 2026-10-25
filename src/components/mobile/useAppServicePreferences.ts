"use client";
import {useEffect,useRef,useState} from "react";
import {APP_SERVICE_PREFERENCES_KEY,emptyAppPreferences,parseAppPreferences,type AppPreferences} from "@/lib/mobile/app-preferences";
export default function useAppServicePreferences(){
 const [preferences,setPreferences]=useState(emptyAppPreferences);
 const current=useRef(preferences),storageAvailable=useRef(true);
 useEffect(()=>{
  function sync(){try{const value=parseAppPreferences(localStorage.getItem(APP_SERVICE_PREFERENCES_KEY));current.current=value;setPreferences(value);}catch{storageAvailable.current=false;}}
  function changed(event:StorageEvent){if(event.key===APP_SERVICE_PREFERENCES_KEY||event.key===null)sync();}
  sync();window.addEventListener("storage",changed);return ()=>window.removeEventListener("storage",changed);
 },[]);
 function update(change:(value:AppPreferences)=>AppPreferences){
  let value=current.current;
  if(storageAvailable.current)try{value=parseAppPreferences(localStorage.getItem(APP_SERVICE_PREFERENCES_KEY));}catch{storageAvailable.current=false;}
  const next=change(value);current.current=next;setPreferences(next);
  if(storageAvailable.current)try{localStorage.setItem(APP_SERVICE_PREFERENCES_KEY,JSON.stringify(next));}catch{storageAvailable.current=false;}
 }
 return {preferences,update};
}

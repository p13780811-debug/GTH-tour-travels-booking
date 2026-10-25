"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
import {APP_SERVICE_PREFERENCES_KEY,appServiceForPath,parseAppPreferences,recordAppService} from "@/lib/mobile/app-preferences";
export default function AppServiceUsage(){
 const path=usePathname();
 useEffect(()=>{const id=appServiceForPath(path);if(!id)return;
  try{const value=parseAppPreferences(localStorage.getItem(APP_SERVICE_PREFERENCES_KEY));if(value.recent[0]!==id)localStorage.setItem(APP_SERVICE_PREFERENCES_KEY,JSON.stringify(recordAppService(value,id)));}catch{/* Navigation remains available when device storage is blocked. */}
 },[path]);return null;
}

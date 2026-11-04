import AsyncStorage from "@react-native-async-storage/async-storage";
import {useEffect,useRef,useState} from "react";
import {createDeviceWriteQueue} from "./device-writes";

export type AppearanceMode="system"|"light"|"dark";
export const APPEARANCE_KEY="gthpro.native.appearance.v1";
export function parseAppearance(value:unknown):AppearanceMode{
 return value==="light"||value==="dark"?value:"system";
}
export function useAppearance(systemDark:boolean){
 const [mode,setMode]=useState<AppearanceMode>("system");
 const [ready,setReady]=useState(false);
 const [storageError,setStorageError]=useState(false);
 const queue=useRef(createDeviceWriteQueue());
 useEffect(()=>{
  let active=true;
  AsyncStorage.getItem(APPEARANCE_KEY).then(value=>{
   if(active)setMode(parseAppearance(value));
  }).catch(()=>{if(active)setStorageError(true);}).finally(()=>{if(active)setReady(true);});
  return ()=>{active=false;};
 },[]);
 function select(value:AppearanceMode){
  if(!ready)return;
  const next=parseAppearance(value);setMode(next);
  void queue.current(()=>AsyncStorage.setItem(APPEARANCE_KEY,next),saved=>setStorageError(!saved));
 }
 return {mode,ready,storageError,select,dark:mode==="system"?systemDark:mode==="dark"};
}

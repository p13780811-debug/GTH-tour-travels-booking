import {useEffect,useRef} from "react";
import {AppState} from "react-native";

/** No background polling or paid push service. Returning from the website or
 * another app revalidates current source pages through the existing APIs. */
export function useForegroundRefresh(refresh:()=>void){
 const current=useRef(refresh);
 useEffect(()=>{current.current=refresh;},[refresh]);
 useEffect(()=>{
  let previous=AppState.currentState;
  const listener=AppState.addEventListener("change",next=>{
   if(next==="active"&&(previous==="background"||previous==="inactive"))current.current();
   previous=next;
  });
  return ()=>listener.remove();
 },[]);
}

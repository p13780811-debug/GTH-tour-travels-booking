"use client";

import {useLayoutEffect} from "react";
import {usePathname} from "next/navigation";

/** A newly opened destination guide must not inherit the directory footer
 * viewport. This affects ONLY destination detail pages and honours #anchors.
 */
export default function DestinationPageScroll(){
 const pathname=usePathname();
 useLayoutEffect(()=>{
  if(window.location.hash)return;
  window.scrollTo({top:0,left:0,behavior:"instant"});
  const frame=window.requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:"instant"}));
  return ()=>window.cancelAnimationFrame(frame);
 },[pathname]);
 return null;
}

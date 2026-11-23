"use client";

import {useEffect} from "react";

/**
 * Country cards navigate directly to the result section. Next.js can restore
 * the previous scroll position on streamed navigation before the target mounts;
 * re-align after the destination page is committed so users see new results.
 */
export default function DestinationDiscoveryScroll({country}:{country:string}) {
  useEffect(()=>{
    if(window.location.hash!=="#discover")return;
    const frame=requestAnimationFrame(()=>{
      if(window.location.hash!=="#discover")return;
      document.getElementById("discover")?.scrollIntoView({block:"start",behavior:"instant"});
    });
    return ()=>cancelAnimationFrame(frame);
  },[country]);
  return null;
}

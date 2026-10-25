"use client";
import {useEffect,useRef} from "react";

/** A small, optional brand animation never blocks the app or downloads on Save-Data. */
export default function AppBrandMotion(){
 const video=useRef<HTMLVideoElement>(null);
 useEffect(()=>{
  const element=video.current;
  if(!element)return;
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection=(navigator as Navigator & {connection?:{saveData?:boolean}}).connection;
  let visible=false;
  const update=()=>{
   if(motion.matches||connection?.saveData){element.pause();element.removeAttribute("src");element.load();return;}
   if(visible&&!document.hidden){
    if(!element.getAttribute("src"))element.src="/app-brand/motion.mp4";
    if(!element.ended)void element.play().catch(()=>{});
   }else element.pause();
  };
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;update();});
  observer.observe(element);
  motion.addEventListener("change",update);
  document.addEventListener("visibilitychange",update);
  return ()=>{observer.disconnect();motion.removeEventListener("change",update);document.removeEventListener("visibilitychange",update);element.pause();};
 },[]);
 return <video ref={video} poster="/app-brand/motion.jpg" muted playsInline preload="none" aria-label="GTH PRO animated logo" className="h-24 w-24 shrink-0 rounded-2xl border border-[var(--border)] object-cover sm:h-28 sm:w-28"/>;
}

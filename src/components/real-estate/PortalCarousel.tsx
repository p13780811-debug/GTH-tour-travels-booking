"use client"

import {useCallback,useEffect,useRef,useState,type ReactNode} from "react"
import {ChevronLeft,ChevronRight,Pause,Play} from "lucide-react"

type Slide={id:string;label:string;content:ReactNode}
/** Native swipe carousel; pauses for interaction, reduced motion, hidden pages and offscreen slots. */
export default function PortalCarousel({label,slides,overlayControls=false}:{label:string;slides:readonly Slide[];overlayControls?:boolean}) {
  const viewport=useRef<HTMLDivElement>(null)
  const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[hovered,setHovered]=useState(false),[focused,setFocused]=useState(false)
  const [reduced,setReduced]=useState(true),[visible,setVisible]=useState(false),[hidden,setHidden]=useState(false)
  const activeIndex=useRef(index)
  useEffect(()=>{activeIndex.current=index},[index])
  const count=slides.length
  const go=useCallback((next:number)=>{
    if(!count)return
    const position=(next+count)%count
    setIndex(position)
    viewport.current?.scrollTo({left:position*viewport.current.clientWidth,behavior:reduced?"auto":"smooth"})
  },[count,reduced])
  useEffect(()=>{
    const media=window.matchMedia("(prefers-reduced-motion: reduce)")
    const motion=()=>setReduced(media.matches),visibility=()=>setHidden(document.hidden)
    motion();visibility();media.addEventListener("change",motion);document.addEventListener("visibilitychange",visibility)
    const element=viewport.current
    const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(entries=>setVisible(entries[0]?.isIntersecting===true),{threshold:.25}):null
    if(element&&observer)observer.observe(element);else setVisible(true)
    return()=>{media.removeEventListener("change",motion);document.removeEventListener("visibilitychange",visibility);observer?.disconnect()}
  },[])
  useEffect(()=>{
    if(count<2||paused||hovered||focused||reduced||hidden||!visible)return
    const timer=window.setInterval(()=>go(index+1),8000)
    return()=>window.clearInterval(timer)
  },[count,paused,hovered,focused,reduced,hidden,visible,index,go])
  useEffect(()=>{
    const element=viewport.current
    if(!element||typeof ResizeObserver==="undefined")return
    const observer=new ResizeObserver(()=>element.scrollTo({left:activeIndex.current*element.clientWidth,behavior:"auto"}))
    observer.observe(element);return()=>observer.disconnect()
  },[])
  if(!count)return null
  return <section aria-label={label} aria-roledescription="carousel" className="relative min-w-0"
    onPointerEnter={event=>{if(event.pointerType==="mouse")setHovered(true)}} onPointerLeave={()=>setHovered(false)}
    onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocused(false)}}>
    <div ref={viewport} tabIndex={0} aria-label={`${label} slides`} className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto rounded-2xl motion-reduce:scroll-auto"
      onScroll={()=>{const element=viewport.current;if(element?.clientWidth)setIndex(Math.max(0,Math.min(count-1,Math.round(element.scrollLeft/element.clientWidth))))}}
      onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==="ArrowRight"||event.key==="ArrowLeft"){event.preventDefault();go(index+(event.key==="ArrowRight"?1:-1))}}}>
      {slides.map((slide,i)=><div key={slide.id} role="group" aria-roledescription="slide" aria-label={`${i+1} of ${count}: ${slide.label}`} aria-hidden={i!==index} inert={i!==index} className="relative w-full min-w-0 shrink-0 snap-center">{slide.content}</div>)}
    </div>
    {count>1&&<div role="group" aria-label={`${label} controls`} className={overlayControls?"gth-glass absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full px-1":"mt-2 flex items-center justify-end gap-1"}>
      <span className="px-2 text-xs" aria-live={paused||focused?"polite":"off"}>{index+1} / {count}</span>
      <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full" aria-label={`Previous ${label} slide`} onClick={()=>go(index-1)}><ChevronLeft size={17}/></button>
      <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full" disabled={reduced} aria-label={reduced?`${label} auto-play disabled for reduced motion`:paused?`Play ${label}`:`Pause ${label}`} aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused||reduced?<Play size={15}/>:<Pause size={15}/>}</button>
      <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full" aria-label={`Next ${label} slide`} onClick={()=>go(index+1)}><ChevronRight size={17}/></button>
    </div>}
  </section>
}

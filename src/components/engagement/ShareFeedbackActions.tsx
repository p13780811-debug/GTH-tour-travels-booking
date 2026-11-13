"use client";

import {useState} from "react";
import Link from "next/link";
import {MessageCircle, MessageSquare} from "lucide-react";

/**
 * A zero-request sharing control. Never sends a message on the visitor's
 * behalf. Only internal, same-origin research links are eligible.
 */
export default function ShareFeedbackActions({title,path}:{
  title:string;
  path:string;
}){
  const [message,setMessage]=useState("");

  function share(){
    setMessage("");
    try{
      if(!path.startsWith("/")||path.startsWith("//")||path.includes("\\"))
        throw new Error("Invalid internal path");
      const destination=new URL(path,window.location.origin);
      if(destination.origin!==window.location.origin||!["http:","https:"].includes(destination.protocol))
        throw new Error("External path");
      const label=title.trim().slice(0,160)||"GTH PRO research guide";
      const text=`GTH PRO · ${label}\n${destination.href}`;
      window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank","noopener,noreferrer");
      setMessage("Choose a WhatsApp chat to send the link. Nothing is sent automatically.");
    }catch{
      setMessage("Sharing is unavailable. Copy the link from your browser instead.");
    }
  }

  return <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Share and feedback">
    <button type="button" onClick={share}
      className="gth-btn inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold">
      <MessageCircle size={16} aria-hidden="true"/>Share on WhatsApp
    </button>
    <Link href="/contact" prefetch={false}
      className="inline-flex min-h-11 items-center gap-2 px-2 text-xs font-semibold text-[var(--text-soft)] underline underline-offset-4">
      <MessageSquare size={15} aria-hidden="true"/>Feedback
    </Link>
    {message&&<p role="status" className="w-full text-xs leading-5 text-[var(--text-soft)]">{message}</p>}
  </div>;
}

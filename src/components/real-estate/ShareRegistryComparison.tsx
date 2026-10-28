"use client";
import {useState} from "react";
export default function ShareRegistryComparison({projects}:{projects:string[]}){
 const [message,setMessage]=useState("");
 return <><button type="button" className="gth-btn min-h-11" onClick={async()=>{try{const url=new URL("/real-estate/registry/compare",window.location.origin);url.search=new URLSearchParams({projects:projects.join(",")}).toString();await navigator.clipboard.writeText(url.href);setMessage("Public comparison copied. Private notes are never included.");}catch{setMessage("Copy this page's address from your browser to share the comparison.");}}}>Copy public comparison link</button>{message&&<p role="status" className="mt-3 text-xs">{message}</p>}</>;
}

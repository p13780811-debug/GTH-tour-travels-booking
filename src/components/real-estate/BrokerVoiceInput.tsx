"use client";

import {useEffect,useRef,useState} from "react";
import {Mic,MicOff} from "lucide-react";

type VoiceResult={results:ArrayLike<ArrayLike<{transcript:string}>>};
type VoiceError={error:string};
type Recognition={
 lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number;
 onresult:((event:VoiceResult)=>void)|null;
 onerror:((event:VoiceError)=>void)|null;
 onend:(()=>void)|null;
 start:()=>void;stop:()=>void;abort:()=>void;
};
type BrowserSpeech=Window&{
 SpeechRecognition?:new()=>Recognition;
 webkitSpeechRecognition?:new()=>Recognition;
};

export default function BrokerVoiceInput({onTranscript}:{onTranscript:(text:string)=>void}){
 const [language,setLanguage]=useState<"en-IN"|"hi-IN">("en-IN");
 const [listening,setListening]=useState(false);
 const [notice,setNotice]=useState("");
 const current=useRef<Recognition|null>(null);
 useEffect(()=>()=>{if(current.current){current.current.onend=null;current.current.onresult=null;current.current.onerror=null;current.current.abort();current.current=null;}},[]);
 function toggle(){
  if(current.current){current.current.stop();return;}
  if(!window.isSecureContext){setNotice("Voice typing requires a secure HTTPS connection.");return;}
  const browser=window as BrowserSpeech;
  const Speech=browser.SpeechRecognition??browser.webkitSpeechRecognition;
  if(!Speech){setNotice("Voice typing is not supported in this browser. Please type the project name instead.");return;}
  try{
   const recognition=new Speech();
   recognition.lang=language;
   recognition.continuous=false;
   recognition.interimResults=false;
   recognition.maxAlternatives=1;
   recognition.onresult=event=>{
    const spoken=event.results[0]?.[0]?.transcript?.normalize("NFKC").trim().replace(/\s+/gu," ").slice(0,70);
    if(spoken){
     onTranscript(spoken);
     setNotice("Voice text added. Check the project name, then tap Search projects.");
    }
   };
   recognition.onerror=event=>{
    setNotice(event.error==="not-allowed"||event.error==="service-not-allowed"
     ?"Microphone access was denied. You can type the project name instead."
     :event.error==="no-speech"?"No speech detected. Try again or type the name."
     :"Voice typing could not finish. Try normal typing.");
   };
   recognition.onend=()=>{if(current.current===recognition)current.current=null;setListening(false);};
   current.current=recognition;
   setNotice("");
   recognition.start();
   setListening(true);
  }catch{
   current.current=null;setListening(false);
   setNotice("Voice typing is unavailable. Please type the project name.");
  }
 }
 return <div className="mt-2 flex flex-wrap items-center gap-2">
   <select aria-label="Voice input language" value={language} onChange={event=>setLanguage(event.target.value as "en-IN"|"hi-IN")} disabled={listening} className="gth-input min-h-11 text-sm">
    <option value="en-IN">English (India)</option>
    <option value="hi-IN">Hindi (India)</option>
   </select>
   <button type="button" onClick={toggle} aria-pressed={listening} className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
    {listening?<MicOff size={17}/>:<Mic size={17}/>}
    {listening?"Stop listening":"Voice typing"}
   </button>
   {listening&&<span role="status" className="text-xs text-[var(--text-soft)]">Listening… speak the project name.</span>}
   {notice&&<p role="status" className="w-full text-xs text-[var(--text-soft)]">{notice}</p>}
   <p className="w-full text-xs leading-5 text-[var(--text-soft)]">Microphone starts only when you tap. GTH PRO does not record or store audio. Your browser may use its online speech service to transcribe it.</p>
 </div>;
}

"use client";

import {useEffect,useRef,useState} from "react";
import {Mic,Square,Volume2} from "lucide-react";
import {TRAFFIC_LANGUAGES,trafficLabels,type TrafficLanguage} from "@/lib/mobility/traffic-language";

type VoiceResult={results:ArrayLike<ArrayLike<{transcript:string}>>};
type Recognition={
  lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number;
  onresult:((event:VoiceResult)=>void)|null;onerror:(()=>void)|null;onend:(()=>void)|null;
  start:()=>void;stop:()=>void;abort:()=>void;
};
type SpeechWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};

export default function TrafficVoice({language,onTranscript,readout}:{language:TrafficLanguage;onTranscript?:(value:string)=>void;readout:string}){
  const labels=trafficLabels(language),locale=TRAFFIC_LANGUAGES[language][1];
  const engine=useRef<Recognition|null>(null);
  const [listening,setListening]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const [error,setError]=useState(false);

  useEffect(()=>()=>{
    const active=engine.current;
    if(active){active.onend=null;active.onresult=null;active.onerror=null;active.abort();engine.current=null;}
    window.speechSynthesis?.cancel();
  },[]);
  function microphone(){
    if(engine.current){engine.current.stop();return;}
    const w=window as SpeechWindow;
    const Speech=w.SpeechRecognition??w.webkitSpeechRecognition;
    if(!Speech||!window.isSecureContext){setError(true);return;}
    window.speechSynthesis?.cancel();
    setError(false);
    const active=new Speech();
    active.lang=locale;active.continuous=false;active.interimResults=false;active.maxAlternatives=1;
    active.onresult=event=>{
      const transcript=event.results[0]?.[0]?.transcript?.trim().slice(0,180);
      if(transcript)onTranscript?.(transcript);
    };
    active.onerror=()=>setError(true);
    active.onend=()=>{if(engine.current===active)engine.current=null;setListening(false);};
    try{engine.current=active;active.start();setListening(true);}
    catch{engine.current=null;setListening(false);setError(true);}
  }
  function speak(){
    const audio=window.speechSynthesis;
    if(!audio||typeof SpeechSynthesisUtterance==="undefined"){setError(true);return;}
    if(speaking){audio.cancel();setSpeaking(false);return;}
    const utterance=new SpeechSynthesisUtterance(readout.slice(0,720));
    utterance.lang=locale;
    const voices=audio.getVoices();
    const voice=voices.find(v=>v.lang.toLowerCase()===locale.toLowerCase())??voices.find(v=>v.lang.toLowerCase().startsWith(language+"-"));
    if(voice)utterance.voice=voice;
    utterance.onend=()=>setSpeaking(false);
    utterance.onerror=()=>{setSpeaking(false);setError(true);};
    setError(false);setSpeaking(true);audio.speak(utterance);
  }
  return <div className="flex flex-wrap gap-2">
    {onTranscript&&<button type="button" onClick={microphone} aria-pressed={listening}
      className="gth-btn inline-flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold">
      {listening?<Square size={16} aria-hidden="true"/>:<Mic size={18} aria-hidden="true"/>}{listening?labels.listen:labels.voice}
    </button>}
    <button type="button" onClick={speak} aria-pressed={speaking}
      className="gth-btn inline-flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold">
      <Volume2 size={18} aria-hidden="true"/>{speaking?labels.stop:labels.speak}
    </button>
    {error&&<p className="w-full text-sm" role="status">{labels.error}</p>}
    {onTranscript&&<p className="w-full text-xs leading-5 text-[var(--text-soft)]" lang="en">Voice starts when tapped. Your browser may use its online speech service. GTH PRO saves only the selected report fields.</p>}
  </div>;
}

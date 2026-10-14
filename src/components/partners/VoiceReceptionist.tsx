"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, MicOff, PhoneCall, Send, Volume2, VolumeX } from "lucide-react";

type Transcript = { role: "user" | "assistant"; text: string };
type AIHistory = { role: "user" | "model"; parts: { text: string }[] };
type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
type SpeechBrowser = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

const greeting = "Namaste! Main GTH PRO ki AI receptionist hoon, human staff nahi. Travel, hotels, property, tender aur partnerships ke general sawaal pooch sakte hain. Booking ya price provider ke saath confirm karein.";
const initial: Transcript[] = [{ role: "assistant", text: greeting }];

export default function VoiceReceptionist() {
  const [supported, setSupported] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [language, setLanguage] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [phase, setPhase] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Transcript[]>(initial);
  const recognitionRef = useRef<Recognition | null>(null);
  const activeRef = useRef(false);
  const busyRef = useRef(false);
  const phaseRef = useRef("idle");
  const langRef = useRef("hi-IN");
  const mutedRef = useRef(false);
  const historyRef = useRef<AIHistory[]>([]);
  const runRef = useRef(0);
  const lastTranscriptRef = useRef("");

  useEffect(() => {
    const w = window as SpeechBrowser;
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    setVoiceAvailable(Boolean(window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined"));
    return () => {
      activeRef.current = false;
      runRef.current += 1;
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  function setPhaseSafe(next: typeof phase) {
    phaseRef.current = next;
    setPhase(next);
  }
  function stop() {
    activeRef.current = false;
    runRef.current += 1;
    busyRef.current = false;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    setActive(false);
    setPhaseSafe("idle");
  }

  function listen() {
    if (!activeRef.current || busyRef.current) return;
    const speechWindow = window as SpeechBrowser;
    const Engine = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Engine) {
      setError("Voice recognition is not supported in this browser. You can type below.");
      stop();
      return;
    }
    try {
      const rec = new Engine();
      recognitionRef.current = rec;
      rec.lang = langRef.current;
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = event => {
        const item = event.results[event.resultIndex];
        const spoken = item?.isFinal ? item[0]?.transcript?.trim() : "";
        if (!spoken || spoken === lastTranscriptRef.current || busyRef.current || !activeRef.current) return;
        lastTranscriptRef.current = spoken;
        busyRef.current = true;
        setPhaseSafe("thinking");
        rec.stop();
        void askAI(spoken, true);
      };
      rec.onerror = event => {
        if (!activeRef.current || phaseRef.current !== "listening") return;
        setError(event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone permission denied. Allow microphone access or type your question."
          : "Voice recognition stopped. Tap Start voice conversation to try again.");
        stop();
      };
      rec.onend = () => {
        if (recognitionRef.current === rec) recognitionRef.current = null;
        if (activeRef.current && phaseRef.current === "listening" && !busyRef.current) {
          activeRef.current = false;
          setActive(false);
          setPhaseSafe("idle");
          setError("No speech detected. Tap Start voice conversation to try again.");
        }
      };
      setPhaseSafe("listening");
      rec.start();
    } catch {
      stop();
      setError("Could not start the microphone. Check permissions or use the text option.");
    }
  }

  function speak(reply: string, invocation: number) {
    if (invocation !== runRef.current || !activeRef.current || mutedRef.current || !window.speechSynthesis) {
      busyRef.current = false;
      setPhaseSafe("idle");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(reply.slice(0, 1300));
    utterance.lang = langRef.current;
    utterance.rate = 0.96;
    utterance.onend = () => {
      if (invocation !== runRef.current) return;
      busyRef.current = false;
      if (activeRef.current) listen();
      else setPhaseSafe("idle");
    };
    utterance.onerror = () => {
      if (invocation !== runRef.current) return;
      busyRef.current = false;
      if (activeRef.current) listen();
      else setPhaseSafe("idle");
    };
    setPhaseSafe("speaking");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  async function askAI(message: string, useVoice: boolean) {
    if (!message.trim() || (busyRef.current && !useVoice)) return;
    busyRef.current = true;
    setError("");
    setDraft("");
    setMessages(prev => [...prev.slice(-11), { role: "user", text: message }]);
    const invocation = runRef.current;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ message: message.slice(0, 1000), history: historyRef.current.slice(-12) })
      });
      const result: unknown = await response.json();
      const obj = result && typeof result === "object" ? result as Record<string, unknown> : {};
      if (!response.ok || typeof obj.reply !== "string" || !obj.reply.trim())
        throw new Error(typeof obj.error === "string" ? obj.error : "AI is temporarily unavailable.");
      if (invocation !== runRef.current) return;
      const reply = obj.reply.trim().slice(0, 4000);
      setMessages(prev => [...prev.slice(-11), { role: "assistant", text: reply }]);
      historyRef.current = [...historyRef.current, { role: "user", parts: [{ text: message.slice(0, 1000) }] },
        { role: "model", parts: [{ text: reply }] }].slice(-12);
      if (useVoice) speak(reply, invocation);
      else {
        busyRef.current = false;
        setPhaseSafe("idle");
      }
    } catch (e) {
      if (invocation !== runRef.current) return;
      busyRef.current = false;
      activeRef.current = false;
      setActive(false);
      setPhaseSafe("idle");
      setError(e instanceof Error ? e.message : "AI service is unavailable. Please use email or the enquiry form.");
    }
  }

  function begin() {
    if (activeRef.current) { stop(); return; }
    if (!supported) { setError("Browser voice recognition is unavailable; use the message box instead."); return; }
    setError("");
    lastTranscriptRef.current = "";
    activeRef.current = true;
    setActive(true);
    langRef.current = language;
    listen();
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busyRef.current) return;
    if (activeRef.current) {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      window.speechSynthesis?.cancel();
      runRef.current += 1;
      activeRef.current = false;
      setActive(false);
    }
    void askAI(text, false);
  }

  return (
    <section id="ai-voice-team" aria-label="GTH PRO AI voice receptionist"
      className="scroll-mt-24 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <PhoneCall className="mt-1 shrink-0 text-[var(--gold)]" size={28} aria-hidden="true"/>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">GTH PRO AI receptionist</p>
          <h2 className="mt-2 text-2xl font-semibold">Talk to our AI team</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
            Speak from this website using your microphone, or type your question. This is an AI assistant,
            not a human operator or a telephone number.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label htmlFor="gth-ai-language" className="text-sm font-semibold">Voice language</label>
        <select id="gth-ai-language" value={language} onChange={e => {
          const next = e.target.value === "en-IN" ? "en-IN" : "hi-IN";
          setLanguage(next); langRef.current = next;
        }} disabled={active || phase === "thinking"}
          className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]">
          <option value="hi-IN">Hindi / Hinglish</option>
          <option value="en-IN">English (India)</option>
        </select>
        <button type="button" onClick={begin} disabled={phase === "thinking"}
          className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60">
          {active ? <MicOff size={17}/> : <Mic size={17}/>}
          {active ? "End voice conversation" : "Start voice conversation"}
        </button>
        <button type="button" onClick={() => {
          mutedRef.current = !mutedRef.current;
          setMuted(mutedRef.current);
          if (mutedRef.current) window.speechSynthesis?.cancel();
        }} disabled={!voiceAvailable}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold disabled:opacity-60">
          {muted ? <VolumeX size={17}/> : <Volume2 size={17}/>}
          {muted ? "Unmute" : "Mute"}
        </button>
      </div>
      <p role="status" className="mt-3 text-sm font-semibold text-[var(--gold)]">
        {phase === "listening" ? "Listening... speak now." :
          phase === "thinking" ? "AI is preparing a response..." :
          phase === "speaking" ? "AI is speaking..." :
          supported ? "Ready. Microphone permission is requested when you start." :
          "Text chat available. Browser microphone speech recognition not supported."}
      </p>
      {error && <p role="alert" className="mt-2 text-sm text-[var(--text)]">{error}</p>}
      <div role="log" aria-label="AI conversation transcript" aria-live="polite"
        className="mt-5 max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
        {messages.map((item,index) => (
          <div key={index} className="text-sm leading-7">
            <strong className="text-[var(--gold)]">{item.role === "assistant" ? "GTH PRO AI" : "You"}: </strong>
            <span className="whitespace-pre-wrap text-[var(--text)]">{item.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
        <label htmlFor="gth-ai-text" className="sr-only">Your question to the AI receptionist</label>
        <input id="gth-ai-text" value={draft} maxLength={1000} onChange={e => setDraft(e.target.value)}
          placeholder="Ask about travel, hotels, property, tenders or partnerships..."
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-sm text-[var(--text)]"/>
        <button type="submit" disabled={!draft.trim() || busyRef.current || phase === "thinking"}
          className="gth-btn-gold inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-60">
          Send <Send size={16}/>
        </button>
      </form>
      <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">
        Voice recognition and read-aloud depend on your device and browser. Your browser may process microphone
        audio through its speech provider; recognised question text is sent to our AI provider to answer.
        No phone calls, audio recordings or payment details are collected by this feature.
        Do not share passwords, payment information or identity documents.
      </p>
      <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">
        Need a human response? Use the enquiry form on this page or email{" "}
        <a href="mailto:official.gthpro@gmail.com" className="font-semibold text-[var(--gold)] underline">official.gthpro@gmail.com</a>.
        Read our <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
      </p>
    </section>
  );
}

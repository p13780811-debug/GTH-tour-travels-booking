"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, MicOff, Sparkles, CheckCircle2 } from "lucide-react"
import { extractListingIntake, INTAKE_MAX_CHARS, type IntakeDraft, type IntakeFields } from "@/lib/real-estate/listing-intake"

type RecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> }
type Recognition = {
  lang: string
  interimResults: boolean
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => Recognition
  webkitSpeechRecognition?: new () => Recognition
}

/** Client-only review-first helper; no external LLM request or automatic submission. */
export default function ListingIntakeAssistant({
  onApply, disabled = false,
}: {
  onApply: (fields: IntakeFields) => void
  disabled?: boolean
}) {
  const [brief, setBrief] = useState("")
  const [draft, setDraft] = useState<IntakeDraft | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [listening, setListening] = useState(false)
  const recognition = useRef<Recognition | null>(null)

  useEffect(() => () => {
    const current = recognition.current
    if (current) {
      current.onend = null
      current.onresult = null
      current.onerror = null
      current.stop()
    }
  }, [])

  const prepare = () => {
    setError("")
    setNotice("")
    try { setDraft(extractListingIntake(brief)) }
    catch (failure) {
      setDraft(null)
      setError(failure instanceof Error ? failure.message : "Please provide more property details.")
    }
  }

  const toggleVoice = () => {
    if (recognition.current) {
      recognition.current.stop()
      recognition.current = null
      setListening(false)
      return
    }
    const browser = window as RecognitionWindow
    const RecognitionClass = browser.SpeechRecognition || browser.webkitSpeechRecognition
    if (!RecognitionClass) {
      setError("Voice typing is not supported by this browser. Please type instead.")
      return
    }
    try {
      const current = new RecognitionClass()
      current.lang = "en-IN"
      current.interimResults = false
      current.onresult = event => {
        const words = event.results[0]?.[0]?.transcript?.trim()
        if (words) {
          setBrief(previous => (previous.trim() + " " + words).trim().slice(0, INTAKE_MAX_CHARS))
          setDraft(null)
          setNotice("Voice note captured. Review the text, then prepare the draft.")
        }
      }
      current.onerror = () => {
        setError("Voice typing was cancelled or microphone permission was denied. Please type instead.")
        setListening(false)
        recognition.current = null
      }
      current.onend = () => { setListening(false); recognition.current = null }
      recognition.current = current
      setListening(true)
      setError("")
      current.start()
    } catch {
      recognition.current = null
      setListening(false)
      setError("The microphone could not start. Please type instead.")
    }
  }

  return <section className="gth-glass rounded-3xl p-5 md:p-7 mb-6" aria-labelledby="listing-intake-heading">
    <div className="flex items-start gap-3">
      <Sparkles className="gold-text shrink-0 mt-1" size={23} aria-hidden="true" />
      <div>
        <p className="gold-text text-xs font-semibold tracking-widest uppercase">Quick listing helper</p>
        <h2 id="listing-intake-heading" className="text-xl font-semibold mt-1">Describe briefly. Get a ready-to-edit listing draft.</h2>
        <p className="text-sm opacity-75 mt-2 leading-6">Type a few details or use voice typing. We fill recognizable form fields and generate a factual description without guessing price, project identity, or registration.</p>
      </div>
    </div>
    <label htmlFor="listing-short-description" className="block font-medium mt-5 mb-2">Describe your property in one or two sentences</label>
    <textarea
      id="listing-short-description"
      className="gth-glass rounded-xl w-full p-3 min-h-28"
      rows={3}
      maxLength={INTAKE_MAX_CHARS}
      value={brief}
      onChange={event => { setBrief(event.target.value); setDraft(null); setNotice(""); setError("") }}
      placeholder="Example: 2 BHK flat for sale in Palava, Dombivli, 950 sqft carpet, 85 lakh, ready to move, 2 bathrooms."
      disabled={disabled}
    />
    <div className="flex flex-wrap gap-3 items-center mt-3">
      <button type="button" className="gth-btn-gold min-h-11 rounded-xl px-5" onClick={prepare} disabled={disabled || !brief.trim()}>
        <Sparkles size={16} className="inline mr-2" aria-hidden="true" />Prepare listing draft
      </button>
      <button type="button" className="gth-btn min-h-11 rounded-xl px-4" onClick={toggleVoice} disabled={disabled} aria-label={listening ? "Stop voice typing" : "Start voice typing"}>
        {listening ? <MicOff size={16} className="inline mr-2" aria-hidden="true" /> : <Mic size={16} className="inline mr-2" aria-hidden="true" />}
        {listening ? "Stop microphone" : "Voice typing"}
      </button>
      <span className="text-xs opacity-65">{brief.length}/{INTAKE_MAX_CHARS}</span>
    </div>
    <p className="text-xs opacity-70 mt-3">Free local drafting, no paid AI API. Voice depends on browser support; browser speech services may process audio. Do not include identity documents in the brief.</p>
    {error && <p role="alert" className="text-sm mt-3">{error}</p>}
    {notice && <p role="status" className="text-sm mt-3">{notice}</p>}
    {draft && <div className="mt-5 rounded-2xl border border-current/15 p-4" aria-live="polite">
      <div className="flex items-center gap-2"><CheckCircle2 size={18} className="gold-text" aria-hidden="true" /><h3 className="font-semibold">Draft suggestions — verify before applying</h3></div>
      {draft.recognized.length > 0
        ? <p className="text-sm mt-3 leading-6"><strong>Detected:</strong> {draft.recognized.join(" · ")}</p>
        : <p className="text-sm mt-3">Not enough recognizable facts; please add the property type, city and other essentials.</p>}
      <p className="text-sm mt-3 leading-6"><strong>Suggested description:</strong> {draft.fields.description}</p>
      <div className="grid md:grid-cols-2 gap-5 mt-4">
        <div><h4 className="text-sm font-semibold">Still needed / worth adding</h4><ul className="text-sm opacity-80 list-disc pl-5 mt-2 space-y-1">{draft.missing.map(item => <li key={item}>{item}</li>)}</ul></div>
        <div><h4 className="text-sm font-semibold">Verify against documents</h4><ul className="text-sm opacity-80 list-disc pl-5 mt-2 space-y-1">{draft.review.map(item => <li key={item}>{item}</li>)}</ul></div>
      </div>
      <button type="button" className="gth-btn-gold min-h-11 rounded-xl px-5 mt-5" onClick={() => { onApply(draft.fields); setNotice("Draft suggestions applied. Check the form fields below before submitting for review.") }} disabled={disabled}>
        Apply suggestions to form
      </button>
      <p className="text-xs opacity-70 mt-3">Existing typed fields stay unchanged. Only you can submit a listing; nothing is automatically published.</p>
    </div>}
  </section>
}

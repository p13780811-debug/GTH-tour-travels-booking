"use client";

import { useState, type FormEvent } from "react";
import { FileDown, Share2, ShieldCheck } from "lucide-react";

type Profile = { companyName: string; companyWebsite: string; capability: string; preferredCity: string };
const empty: Profile = { companyName:"", companyWebsite:"", capability:"", preferredCity:"" };

/** Stateless B2B preparation funnel: server reads only the selected public tender. */
export default function TenderDecisionPitch({ tenderId }: { tenderId: string }) {
  const [profile, setProfile] = useState<Profile>(empty);
  const [consent, setConsent] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [downloadedFile, setDownloadedFile] = useState<File | null>(null);
  function update(field: keyof Profile, value: string) {
    setDownloadedFile(null);
    setProfile(current => ({ ...current, [field]: value }));
    setMessage("");
  }
  async function generate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (working || !consent || profile.companyName.trim().length < 2) return;
    setWorking(true); setMessage(""); setDownloadedFile(null);
    try {
      const response = await fetch("/api/tender/" + encodeURIComponent(tenderId) + "/decision-pitch", {
        method: "POST", cache: "no-store", credentials: "same-origin",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ ...profile, consent }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "PDF generation is temporarily unavailable");
      }
      if (!response.headers.get("content-type")?.startsWith("application/pdf")) throw new Error("Invalid PDF response");
      const blob = await response.blob();
      if (blob.size < 600 || blob.size > 250_000) throw new Error("PDF validation failed");
      const filename = "gth-decision-brief-" + tenderId.toLowerCase() + ".pdf";
      const file = new File([blob], filename, {type:"application/pdf"});
      setDownloadedFile(file);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
      setMessage("Two-page preparation PDF downloaded. Check the original tender and attach the file yourself before sharing.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PDF request could not be completed");
    } finally { setWorking(false); }
  }
  async function share() {
    if (!downloadedFile) return;
    try {
      const payload = { title: "GTH PRO Tender Decision Draft", text: "Unsubmitted tender research draft. Verify all official requirements.", files: [downloadedFile] };
      if (typeof navigator.canShare !== "function" || !navigator.canShare({files: [downloadedFile]}) ||
        typeof navigator.share !== "function") {
        setMessage("File sharing is not supported by this device. Attach the downloaded PDF manually in WhatsApp.");
        return;
      }
      await navigator.share(payload);
      setMessage("Device share action finished. Confirm the recipient and file in your chosen app.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Sharing did not complete. You can attach the downloaded PDF manually.");
    }
  }
  return <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--text)] sm:p-6" aria-labelledby="tender-decision-pitch">
    <h2 id="tender-decision-pitch" className="flex items-center gap-2 text-xl font-semibold"><FileDown size={20} className="text-[var(--gold)]"/> GTH Contractor Decision PDF</h2>
    <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
      Download a free two-page, company-specific procurement research draft with a verified-source checklist and regional team-stay search.
      This does not assess eligibility, guarantee an award, fetch your website or submit a bid.
    </p>
    <details className="mt-4 rounded-xl border border-[var(--border)] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--gold)]">Prepare my 2-page PDF</summary>
      <form onSubmit={generate} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Company name
          <input required minLength={2} maxLength={100} autoComplete="organization" value={profile.companyName}
            onChange={e=>update("companyName",e.target.value)} className="gth-input mt-2 w-full" placeholder="Registered business name"/>
        </label>
        <label className="text-sm font-medium">Company website (optional; not fetched)
          <input type="url" maxLength={220} inputMode="url" placeholder="https://example.com"
            value={profile.companyWebsite} onChange={e=>update("companyWebsite",e.target.value)} className="gth-input mt-2 w-full"/>
        </label>
        <label className="text-sm font-medium">Work experience / capability (self-declared)
          <input maxLength={240} placeholder="Example: civil works, roads, electrical"
            value={profile.capability} onChange={e=>update("capability",e.target.value)} className="gth-input mt-2 w-full"/>
        </label>
        <label className="text-sm font-medium">Preferred team-stay city (optional)
          <input maxLength={80} placeholder="Exact city, not a guessed venue"
            value={profile.preferredCity} onChange={e=>update("preferredCity",e.target.value)} className="gth-input mt-2 w-full"/>
        </label>
        <label className="sm:col-span-2 flex items-start gap-3 text-sm leading-6">
          <input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1 size-4"/>
          <span>I confirm I may use these company details. Generate a private on-demand PDF for my own review; no automatic external messages or uploads.</span>
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={!consent || working || profile.companyName.trim().length<2}
            className="gth-btn gth-btn-gold inline-flex min-h-11 items-center gap-2 disabled:opacity-50">
            <FileDown size={17}/> {working?"Preparing PDF...":"Download 2-page PDF"}
          </button>
          {downloadedFile && <button type="button" onClick={share} className="gth-btn inline-flex min-h-11 items-center gap-2"><Share2 size={17}/> Share PDF using my device</button>}
        </div>
        <p className="sm:col-span-2 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
          <ShieldCheck size={16} className="mt-1 shrink-0"/> GTH PRO does not send PDFs directly through WhatsApp. On supported devices, you can choose WhatsApp in the native share menu.
        </p>
      </form>
    </details>
    <p aria-live="polite" role="status" className="mt-3 text-sm text-[var(--text-soft)]">{message}</p>
  </section>;
}
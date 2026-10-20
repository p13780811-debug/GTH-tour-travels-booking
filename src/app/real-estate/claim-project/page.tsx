"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import JourneyNav from "@/components/real-estate/JourneyNav";
import BottomNav from "@/components/mobile/BottomNav";
import LoginModal from "@/components/real-estate/auth/LoginModal";
import { supabase } from "@/lib/supabase";
import { readApiJson } from "@/lib/api-response";

type Claim = { id: string; project_id: number; rera_reference: string; status: string; created_at?: string };
type MediaReceipt = { id: string; status: string };

async function token() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Sign in to submit or upload.");
  return data.session.access_token;
}

export default function ClaimProjectPage() {
  const [login, setLogin] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [current, setCurrent] = useState<Claim | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploads, setUploads] = useState<MediaReceipt[]>([]);

  useEffect(() => {
    let active = true;
    token().then(async access => {
      const rows = await readApiJson<Claim[]>(await fetch("/api/real-estate/project-claims", {
        headers: { Authorization: `Bearer ${access}` }, cache: "no-store",
      }));
      if (active) setClaims(Array.isArray(rows) ? rows : []);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const submitClaim = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(""); setNotice(""); setBusy(true);
    try {
      const access = await token();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const claim = await readApiJson<Claim>(await fetch("/api/real-estate/project-claims", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
        body: JSON.stringify({
          ...values, authority_attested: values.authority_attested === "on",
          rights_attested: values.rights_attested === "on",
        }),
      }));
      setCurrent(claim);
      setClaims(existing => [claim, ...existing]);
      setNotice("Project claim recorded for independent review. You may upload private media evidence now.");
    } catch (failure) {
      if (failure instanceof Error && /sign in/i.test(failure.message)) setLogin(true);
      setError(failure instanceof Error ? failure.message : "Submission unavailable");
    } finally { setBusy(false); }
  };

  const submitMedia = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!current || !file) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const access = await token();
      const body = new FormData(event.currentTarget);
      body.set("claim_id", current.id); body.set("file", file);
      body.set("rights_attested", body.get("rights_attested") === "on" ? "true" : "false");
      const result = await readApiJson<MediaReceipt>(await fetch("/api/real-estate/claim-media", {
        method: "POST", headers: { Authorization: `Bearer ${access}` }, body,
      }));
      setUploads(existing => [...existing, result]);
      setFile(null);
      event.currentTarget.reset();
      setNotice("Image stored privately for review. It has not been published.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Private media upload failed");
    } finally { setBusy(false); }
  };

  return <main className="gth-container px-4 pt-10 pb-28">
    <JourneyNav />
    <div className="mx-auto max-w-3xl mt-8">
      <p className="gold-text text-xs uppercase tracking-widest">GTH PRO / Real Estate</p>
      <h1 className="text-3xl md:text-4xl font-bold mt-3">Claim a registered project</h1>
      <p className="mt-4 leading-7 opacity-75">For owners, builders and authorized agents. Match the exact MahaRERA identity, submit evidence and request review. A registry match does not prove ownership, media rights or available units.</p>
      <p className="mt-3 text-sm opacity-70">Currently supported: Maharashtra projects with a GTH PRO registry record. Other locations can use <Link href="/partners/apply?type=developer" className="underline">partner applications</Link>.</p>
      <button type="button" onClick={() => setLogin(true)} className="gth-btn mt-5">Sign in with email</button>

      <form onSubmit={submitClaim} className="gth-glass rounded-3xl p-5 sm:p-8 mt-8 grid gap-5">
        <h2 className="text-xl font-bold">1. Request project authorization review</h2>
        <label className="grid gap-2">MahaRERA registration number
          <input required name="rera_reference" pattern="[Pp][0-9]{11}" maxLength={12} placeholder="P51800000000" className="gth-glass rounded-xl p-3 w-full uppercase" />
        </label>
        <label className="grid gap-2">Your relationship
          <select required name="claimant_role" defaultValue="developer" className="gth-glass rounded-xl p-3 w-full bg-[var(--card)]">
            <option value="developer">Builder / developer</option><option value="owner">Owner</option><option value="agent">Authorized agent</option>
          </select>
        </label>
        <label className="grid gap-2">Legal name
          <input required name="legal_name" minLength={3} maxLength={150} className="gth-glass rounded-xl p-3 w-full" />
        </label>
        <label className="grid gap-2">Company name (optional)
          <input name="organization_name" maxLength={160} className="gth-glass rounded-xl p-3 w-full" />
        </label>
        <label className="grid gap-2">Evidence or authorization reference
          <textarea required name="authority_reference" minLength={12} maxLength={500} rows={3} className="gth-glass rounded-xl p-3 w-full" placeholder="Describe your registration/authorization and reference that administrators can verify. Do not enter passwords or identity document numbers." />
        </label>
        <label className="flex gap-3 items-start text-sm leading-6"><input required type="checkbox" name="authority_attested" className="mt-1" /> I am authorized to make this claim and understand that GTH PRO will review my evidence.</label>
        <label className="flex gap-3 items-start text-sm leading-6"><input required type="checkbox" name="rights_attested" className="mt-1" /> I have rights or written authorization for any media I submit. No scraped third-party or fabricated project photos.</label>
        <button type="submit" disabled={busy} className="gth-btn-gold justify-self-start">{busy ? "Submitting..." : "Request independent review"}</button>
      </form>
      {claims.length > 0 && <section className="gth-glass rounded-3xl p-5 sm:p-8 mt-6">
        <h2 className="font-bold text-xl">Your claims</h2>
        <div className="grid gap-3 mt-4">{claims.map(claim => <button key={claim.id} type="button"
          className="text-left rounded-xl border border-[var(--border)] p-3"
          onClick={() => { setCurrent(claim); setNotice(""); setError(""); }}>
          <span className="font-semibold">{claim.rera_reference}</span> · {claim.status} · Project #{claim.project_id}
        </button>)}</div>
      </section>}
      {current && ["pending","approved"].includes(current.status) && <form onSubmit={submitMedia} className="gth-glass rounded-3xl p-5 sm:p-8 mt-6 grid gap-5">
        <h2 className="font-bold text-xl">2. Submit private image evidence</h2>
        <p className="text-sm opacity-75">Project {current.rera_reference}. JPEG, PNG or WebP, max 8 MB each and eight images per claim. Images are re-encoded and kept private until independent authorization and media review. No automatic public publishing.</p>
        <label className="grid gap-2">Original media file
          <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setFile(event.target.files?.[0] || null)} className="gth-glass rounded-xl p-3 w-full" />
        </label>
        <label className="grid gap-2">Image type
          <select name="media_type" defaultValue="photo" className="gth-glass rounded-xl p-3 w-full bg-[var(--card)]"><option value="photo">Actual project photo</option><option value="render">Architectural render (labelled)</option><option value="floor_plan">Floor plan</option></select>
        </label>
        <label className="grid gap-2">Permission basis
          <select name="license_basis" defaultValue="authorized_owner" className="gth-glass rounded-xl p-3 w-full bg-[var(--card)]"><option value="creator">Original work created by me</option><option value="authorized_owner">Authorized by rights holder</option><option value="documented_license">Documented redistribution license</option></select>
        </label>
        <label className="grid gap-2">Original creator / supplier
          <input name="supplier" required minLength={2} maxLength={160} className="gth-glass rounded-xl p-3 w-full" />
        </label>
        <label className="grid gap-2">Written permission or license evidence reference
          <textarea name="permission_reference" required minLength={12} maxLength={500} rows={3} className="gth-glass rounded-xl p-3 w-full" />
        </label>
        <label className="grid gap-2">Original source URL (optional, HTTPS)
          <input name="original_url" type="url" maxLength={800} className="gth-glass rounded-xl p-3 w-full" />
        </label>
        <label className="grid gap-2">Attribution (optional)
          <input name="attribution" maxLength={250} className="gth-glass rounded-xl p-3 w-full" />
        </label>
        <label className="flex gap-3 items-start text-sm"><input type="checkbox" name="rights_attested" required className="mt-1" /> I confirm my right to upload this exact project media.</label>
        <button type="submit" disabled={busy || !file || uploads.length >= 8} className="gth-btn-gold justify-self-start">
          {busy ? "Submitting..." : "Submit image privately"}
        </button>
        <p className="text-sm opacity-70">{uploads.length} file(s) submitted in this session.</p>
      </form>}
      {notice && <p role="status" className="mt-5">{notice}</p>}
      {error && <p role="alert" className="mt-5">{error}</p>}
    </div>
    {login && <LoginModal onClose={() => setLogin(false)} />}
    <BottomNav />
  </main>;
}

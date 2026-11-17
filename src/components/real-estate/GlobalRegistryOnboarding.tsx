"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { readApiJson } from "@/lib/api-response";
import { INDIAN_REGIONS } from "@/lib/real-estate/global-registry";

export type GlobalOnboardingResult = {
  id: string;
  country_code: string;
  city: string;
  project_name: string;
};

/** Adds a compact registry stub only; the existing submission/moderation gate stays intact. */
export default function GlobalRegistryOnboarding({
  onCreated, onNeedLogin,
}: {
  onCreated: (record: GlobalOnboardingResult) => void;
  onNeedLogin: () => void;
}) {
  const [country, setCountry] = useState("IN");
  const [region, setRegion] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [linked, setLinked] = useState(false);

  return <section id="global-registry-onboarding" className="gth-glass mt-6 rounded-3xl p-6" aria-labelledby="global-registry-heading">
    <p className="gold-text text-xs font-semibold">WORLDWIDE PROJECT REGISTRATION</p>
    <h2 id="global-registry-heading" className="mt-2 text-xl font-semibold">Can't find your project? Add its reference</h2>
    <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
      Available for every Indian state and worldwide regions. We save only the essential project identity,
      not documents or bulk-scraped data. Registration is pending independent review;
      your inventory can be submitted straight away for moderation.
    </p>
    <form className="mt-4 grid gap-4" onSubmit={async event => {
      event.preventDefault();
      if (busy) return;
      setError(""); setMessage(""); setBusy(true);
      const form = event.currentTarget;
      const body: Record<string, FormDataEntryValue> = Object.fromEntries(new FormData(form));
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          onNeedLogin();
          setError("Sign in to register a project. Your entries will stay here.");
          return;
        }
        const result = await readApiJson<{ id: number | string; status: string }>(
          await fetch("/api/real-estate/global-registry", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
            cache: "no-store",
            body: JSON.stringify(body),
          }),
        );
        if (result?.id === null || result?.id === undefined) throw new Error("Project registration is temporarily unavailable.");
        onCreated({
          id: String(result.id),
          country_code: String(body.country_code).toUpperCase(),
          city: String(body.city),
          project_name: String(body.project_name),
        });
        setLinked(true);
        setMessage("Project reference saved for review. Complete the listing form below without waiting.");
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Unable to save project reference.");
      } finally { setBusy(false); }
    }}>
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Country (ISO-2)
          <input name="country_code" required minLength={2} maxLength={2} pattern="[A-Za-z]{2}"
            list="gth-registry-countries" value={country} onChange={event => {
              setCountry(event.target.value.toUpperCase()); setRegion(""); setLinked(false);
            }} placeholder="IN, AE, US, GB…" className="gth-glass mt-2 w-full rounded-xl p-3 uppercase" />
          <datalist id="gth-registry-countries">{["IN","AE","US","GB","SG","AU","CA","DE","FR","NZ","ZA"].map(code=><option key={code} value={code}/>)}</datalist>
        </label>
        <label className="text-sm font-medium">State / region
          {country === "IN" ?
            <select name="region_state" required value={region} onChange={event=>{setRegion(event.target.value);setLinked(false);}} className="gth-glass mt-2 w-full rounded-xl bg-[var(--card)] p-3">
              <option value="">Choose state / UT</option>
              {Object.entries(INDIAN_REGIONS).map(([code,name])=><option key={code} value={code}>{name}</option>)}
            </select> :
            <input name="region_state" required minLength={2} maxLength={64} value={region}
              onChange={event=>{setRegion(event.target.value);setLinked(false);}} placeholder="Dubai, England, California…" className="gth-glass mt-2 w-full rounded-xl p-3" />}
        </label>
        <label className="text-sm font-medium">Official authority / source
          <input name="registry_authority" required minLength={3} maxLength={32} list="gth-registry-authorities"
            defaultValue="GLOBAL_UNLISTED" className="gth-glass mt-2 w-full rounded-xl p-3 uppercase" />
          <datalist id="gth-registry-authorities">{["MAHARERA","WBRERA","HIRA","UPRERA","KRERA","GUJRERA","TNRERA","DL-RERA","DLD/RERA","HM_LAND_REGISTRY","MLS","COUNTY_ASSESSOR","GLOBAL_UNLISTED"].map(a=><option key={a} value={a}/>)}</datalist>
        </label>
        <label className="text-sm font-medium">Official registration / permit ID
          <input name="registration_id" required minLength={3} maxLength={80} autoCapitalize="characters"
            placeholder="Enter exact official reference" className="gth-glass mt-2 w-full rounded-xl p-3" />
        </label>
        <label className="text-sm font-medium">Project name
          <input name="project_name" required minLength={3} maxLength={120} className="gth-glass mt-2 w-full rounded-xl p-3" />
        </label>
        <label className="text-sm font-medium">City
          <input name="city" required minLength={2} maxLength={64} className="gth-glass mt-2 w-full rounded-xl p-3" />
        </label>
        <label className="text-sm font-medium">Developer name (optional)
          <input name="developer_name" maxLength={100} className="gth-glass mt-2 w-full rounded-xl p-3" />
        </label>
        <label className="text-sm font-medium">Postal code (optional)
          <input name="postal_code" maxLength={16} className="gth-glass mt-2 w-full rounded-xl p-3" />
        </label>
        <label className="text-sm font-medium">Latitude (optional; paired with longitude)
          <input name="lat" type="number" min={-90} max={90} step="0.00001" className="gth-glass mt-2 w-full rounded-xl p-3" />
        </label>
        <label className="text-sm font-medium">Longitude (optional; paired with latitude)
          <input name="lng" type="number" min={-180} max={180} step="0.00001" className="gth-glass mt-2 w-full rounded-xl p-3" />
        </label>
      </fieldset>
      <button type="submit" disabled={busy} className="gth-btn-gold min-h-11 rounded-xl px-5 py-2 font-semibold disabled:opacity-60">{busy?"Saving project reference…":linked?"Refresh project reference":"Add missing project & continue"}</button>
      {message && <p role="status" className="text-sm">{message}</p>}
      {error && <p role="alert" className="text-sm">{error}</p>}
      <p className="text-xs text-[var(--text-soft)]">User-provided reference ≠ official confirmation, authorized ownership, a published listing or legal title.</p>
    </form>
  </section>;
}

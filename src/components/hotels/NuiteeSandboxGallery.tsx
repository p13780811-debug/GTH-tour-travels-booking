"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Preview-only supplier-media QA. An API URL is not proof that a browser can
 * render the photo, and neither a render nor a license URL proves permission
 * to publish that image in the public catalog.
 */
export default function NuiteeSandboxGallery({
  hotelId,
  hotelName,
  urls,
}: {
  hotelId: string;
  hotelName: string;
  urls: string[];
}) {
  const [selected, setSelected] = useState(0);
  const [loaded, setLoaded] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);

  const images = useMemo(() => [...new Set((urls ?? []).filter((url) => {
    if (typeof url !== "string") return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && !parsed.username && !parsed.password;
    } catch {
      return false;
    }
  }))].slice(0, 50), [urls]);

  useEffect(() => {
    setSelected(0);
    setLoaded([]);
    setFailed([]);
  }, [hotelId, images]);

  const viable = images.filter((src) => !failed.includes(src));
  const activeIndex = Math.min(selected, Math.max(0, viable.length - 1));
  const active = viable[activeIndex] ?? null;

  const recordLoad = (src: string) =>
    setLoaded((old) => old.includes(src) ? old : [...old, src]);
  const recordError = (src: string) => {
    setFailed((old) => old.includes(src) ? old : [...old, src]);
    setSelected(0);
  };

  return (
    <div className="space-y-3" aria-label={"Nuitee sandbox image inspection: " + hotelName}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--text-soft)]">
        <p>{images.length} supplier image URLs · {loaded.length} loaded in browser · {failed.length} failed</p>
        <p>Preview QA only — not licensed for public use by this check</p>
      </div>
      {active ? (
        <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <img
            key={active}
            src={active}
            alt={hotelName + " — supplier preview image " + (activeIndex + 1)}
            className="h-56 w-full object-contain sm:h-80"
            referrerPolicy="no-referrer"
            onLoad={() => recordLoad(active)}
            onError={() => recordError(active)}
          />
          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-3 py-2">
            <button
              type="button"
              className="gth-btn-gold rounded-lg px-3 py-2 text-sm"
              onClick={() => setSelected((i) => (i - 1 + viable.length) % viable.length)}
              disabled={viable.length <= 1}
              aria-label="Previous supplier photograph"
            >Previous</button>
            <span className="text-sm" aria-live="polite">{activeIndex + 1} / {viable.length}</span>
            <button
              type="button"
              className="gth-btn-gold rounded-lg px-3 py-2 text-sm"
              onClick={() => setSelected((i) => (i + 1) % viable.length)}
              disabled={viable.length <= 1}
              aria-label="Next supplier photograph"
            >Next</button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm">
          {images.length ? "No supplier image successfully rendered yet" : "Supplier has provided no photo URLs"}
        </div>
      )}
      {viable.length > 1 && (
        <div className="flex snap-x gap-2 overflow-x-auto pb-2" aria-label="Supplier photo thumbnails">
          {viable.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={"View supplier photo " + (i + 1)}
              aria-pressed={i === activeIndex}
              onClick={() => setSelected(i)}
              className="min-w-24 shrink-0 snap-start overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-1"
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-16 w-24 rounded object-cover"
                onLoad={() => recordLoad(src)}
                onError={() => recordError(src)}
              />
              <span className="block text-center text-xs text-[var(--text-soft)]">{i + 1}</span>
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-[var(--text-soft)]">
        Browser-loaded count means HTTP image rendering worked in this session.
        It does not verify property identity, copyright, or production usage rights.
      </p>
    </div>
  );
}

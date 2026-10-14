"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Globe2, UtensilsCrossed } from "lucide-react";
import { portfolioProjects } from "@/lib/portfolio/projects";

const promotions = portfolioProjects.filter(project =>
  project.advertise &&
  ["gth-pro-portfolio", "thali-treats-palava"].includes(project.id) &&
  /^https:\/\/[a-z0-9.-]+\/?$/i.test(project.href)
);

/** House ads, not third-party sponsored inventory or Google advertising. */
export default function HousePromotions({ flagship = false }: { flagship?: boolean }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (paused || reduceMotion || promotions.length < 2) return;
    const timer = window.setInterval(() => setIndex(prev => (prev + 1) % promotions.length), 8000);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion]);

  if (!promotions.length) return null;
  const item = promotions[index % promotions.length];
  const food = item.id === "thali-treats-palava";
  return (
    <section aria-label="GTH PRO in-house promotions" className={
      flagship
        ? "relative isolate w-full overflow-hidden border-y border-[#e7c575]/35 bg-[#071729] py-8 text-white sm:py-10"
        : "w-full border-y border-[var(--border)] bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6"
    }>
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={"text-[10px] font-bold uppercase tracking-[.17em] " + (flagship ? "text-[#f3d593]" : "text-[var(--gold)]")}>
              Advertisement · GTH PRO owned projects
            </p>
            <h2 className="mt-2 text-lg font-semibold sm:text-xl">Explore our projects</h2>
          </div>
          <p className={"text-xs " + (flagship ? "text-[#c6d3e2]" : "text-[var(--text-soft)]")}>
            In-house promotions · No Google Ads
          </p>
        </div>
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={e => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
          }}
          className={"relative isolate grid min-h-[235px] overflow-hidden rounded-2xl border border-[#e6c575]/40 shadow-[0_14px_40px_rgba(0,0,0,.23)] sm:min-h-[245px] sm:grid-cols-[1.1fr_.9fr] " +
            (food ? "bg-[#2b1a11]" : "bg-[#061b35]")}
        >
          <div className="relative z-10 flex min-w-0 flex-col justify-center p-6 sm:p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[.13em] text-[#ffe29e]">{item.category}</p>
            <h3 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">{item.title}</h3>
            <p className="mt-3 max-w-lg text-sm leading-7 text-[#e1e7f0]">{item.description}</p>
            <a href={item.href} target="_blank" rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-[#f4d58d] bg-[#e9c773] px-5 text-sm font-bold text-[#11223a] transition hover:bg-[#ffe7a7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              aria-label={"Visit " + item.title + " website (opens in new tab)"}>
              Visit official project site <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="relative hidden min-h-[210px] overflow-hidden sm:block" aria-hidden="true">
            {food ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_40%_45%,#9f6429_0%,#61361b_38%,#2b1a11_75%)]">
                <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-[#ffdc91]/55 bg-[#482817]/80 shadow-[0_0_65px_rgba(250,195,102,.27)]"><UtensilsCrossed size={65} className="text-[#ffdc91]" /></div>
              </div>
            ) : (
              <><Image src="/images/global-city.jpg" alt="" fill sizes="(max-width: 640px) 1px, 40vw" className="object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#061b35] via-[#061b35]/30 to-transparent" />
                <Globe2 className="absolute bottom-5 right-6 text-[#f1d28a]" size={36} /></>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2" role="group" aria-label="Select house promotion">
            {promotions.map((project,i) => (
              <button key={project.id} type="button" aria-current={index === i ? "true" : undefined}
                aria-label={"Show promotion: " + project.title} onClick={() => setIndex(i)}
                className={"min-h-10 rounded-full border px-3 text-xs font-semibold transition " +
                  (index === i ? "border-[#e9c773] bg-[#e9c773] text-[#111d32]" : flagship
                    ? "border-[#e9c773]/45 text-[#f4e2b8] hover:border-[#e9c773]"
                    : "border-[var(--border)] text-[var(--text-soft)] hover:border-[var(--gold)]")}>
                {project.title}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setIndex(prev => (prev + promotions.length - 1) % promotions.length)}
              aria-label="Previous promotion" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9b974]/60 text-[#dbb668]"><ChevronLeft size={18}/></button>
            <button type="button" onClick={() => setIndex(prev => (prev + 1) % promotions.length)}
              aria-label="Next promotion" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9b974]/60 text-[#dbb668]"><ChevronRight size={18}/></button>
          </div>
        </div>
        <p className={"mt-3 flex items-center gap-2 text-xs " + (flagship ? "text-[#bacada]" : "text-[var(--text-soft)]")}>
          <ArrowRight size={14} aria-hidden="true"/> These are our own projects, not third-party booking offers.
        </p>
      </div>
    </section>
  );
}

"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  label: string;
  children: ReactNode;
};

/**
 * A small reusable, keyboard-accessible rail. It scrolls the actual content
 * viewport rather than faking another set of cards. Native touch scrolling and
 * CSS scroll snapping remain available on mobile and desktop.
 */
export default function TourCarousel({ label, children }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);

  function move(direction: -1 | 1) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({ left: direction * Math.max(190, Math.round(viewport.clientWidth * 0.75)), behavior: "smooth" });
  }

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-end gap-2">
        <button type="button" onClick={() => move(-1)} aria-label={"Scroll " + label + " left"}
          className="gth-btn inline-flex items-center justify-center"
        ><ChevronLeft size={17} aria-hidden="true" /></button>
        <button type="button" onClick={() => move(1)} aria-label={"Scroll " + label + " right"}
          className="gth-btn inline-flex items-center justify-center"
        ><ChevronRight size={17} aria-hidden="true" /></button>
      </div>
      <div ref={viewportRef} role="region" aria-label={label} tabIndex={0}
        className="flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 scroll-smooth [scrollbar-width:thin]">
        {children}
      </div>
    </div>
  );
}

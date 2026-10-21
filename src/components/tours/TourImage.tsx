"use client";
import { useState } from "react";
import { ImageOff } from "lucide-react";

export default function TourImage({ src, title, className }: { src: string; title: string; className: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return failedSrc === src || src === "/placeholder.jpg" ?
    <div role="img" aria-label={"Photo unavailable for "+title}
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--bg-soft)] p-3 text-xs text-[var(--text-soft)]">
      <ImageOff size={22} aria-hidden="true"/>Photo unavailable
    </div> :
    <img src={src} alt={title} width={432} height={270} loading="lazy" decoding="async"
      onError={() => setFailedSrc(src)} className={className}/>;
}

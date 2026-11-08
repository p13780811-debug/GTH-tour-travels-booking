"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * External Creative Commons airport photography is loaded without Vercel image
 * optimization. If the remote file is unavailable, show GTH PRO's own clearly
 * labelled transfer illustration, never a different city's landmark.
 */
export default function TransferSpotlightImage({
  src, alt, sizes, credit, creditUrl,
}: {
  src: string;
  alt: string;
  sizes: string;
  credit?: string;
  creditUrl?: string;
}) {
  const [failed, setFailed] = useState(false);
  const external = src.startsWith("https://");
  const currentSrc = failed ? "/images/mega/transfers.jpg" : src;

  return (
    <>
      <Image
        src={currentSrc}
        alt={failed ? "Illustrative airport pickup vehicle scene; not the specific airport" : alt}
        fill
        sizes={sizes}
        unoptimized={external && !failed}
        onError={() => {
          if (!failed) setFailed(true);
        }}
        className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
      />
      {credit && creditUrl && !failed && (
        <a href={creditUrl} target="_blank" rel="noopener noreferrer"
          className="absolute bottom-1 right-1 max-w-[95%] rounded bg-black/75 px-1.5 py-1 text-[9px] leading-4 text-white underline"
          title="Original image and Creative Commons license">
          {credit}
        </a>
      )}
    </>
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  primary: string;
  fallback: string;
  alt: string;
  className: string;
  priority?: boolean;
};

export default function FlagshipImage({ primary, fallback, alt, className, priority = false }: Props) {
  const [src, setSrc] = useState(primary);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 680px) 100vw, 34vw"
      className={className}
      onError={() => setSrc(current => current === fallback ? current : fallback)}
    />
  );
}

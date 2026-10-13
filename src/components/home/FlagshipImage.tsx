import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  className: string;
  priority?: boolean;
};

// Use the exact supplied flagship image. Never silently replace it with
// generic travel/property stock imagery: that changes the approved design.
export default function FlagshipImage({ src, alt, className, priority = false }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 680px) 100vw, (max-width: 980px) 50vw, 34vw"
      className={className}
    />
  );
}

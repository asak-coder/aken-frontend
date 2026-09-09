"use client";

import Image from "next/image";

/**
 * HeroMedia
 * - Poster-only hero background (mobile + desktop) using the industrial steel image
 * - Respects `prefers-reduced-motion` via static image (no autoplay video)
 * - The video element is intentionally omitted until real video assets exist,
 *   avoiding 404s from non-existent source files.
 */
export default function HeroMedia({
  // Use an existing public asset by default (prevents 404s in production)
  posterSrc = "/hero-steel.jpg",
  alt = "",
}: {
  posterSrc?: string;
  alt?: string;
}) {
  return (
    <div className="absolute inset-0">
      {/* Mobile poster */}
      <Image
        src={posterSrc}
        alt={alt}
        className="object-cover opacity-70 md:hidden"
        fill
        priority
        sizes="100vw"
      />

      {/* Desktop poster */}
      <Image
        src={posterSrc}
        alt={alt}
        className="hidden object-cover opacity-70 md:block"
        fill
        priority
        sizes="100vw"
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/85" />
    </div>
  );
}

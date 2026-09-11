import Image from "next/image";

/**
 * AKEN official logo.
 *
 * Serves the supplied official artwork exactly as provided — this file is used
 * byte-for-byte (no redraw, no retrace, no recolour, no new SVG).
 *
 * The source artwork is a 2048x2048 transparent PNG whose wordmark spans
 * x 166..1907, y 828..1221 (aspect 1742 / 394). We render that band at its true
 * aspect ratio via object-cover so the mark is never stretched, squashed or
 * distorted — only its display size changes.
 */
const LOGO_SRC = "/logo/aken-logo.png";
const WORDMARK_ASPECT = "1742 / 394";

type BrandLogoProps = {
  /** Display-size classes for the mark. This changes size only, never the artwork. */
  sizeClassName?: string;
  /** Extra classes for the light container. */
  className?: string;
  /** Background container. A light background keeps the original dark artwork visible. */
  containerClassName?: string;
  priority?: boolean;
};

export default function BrandLogo({
  sizeClassName = "h-8 md:h-9",
  className = "",
  containerClassName = "bg-white",
  priority = false,
}: BrandLogoProps) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-lg px-3 py-1.5 shadow-sm",
        containerClassName,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={["relative block overflow-hidden", sizeClassName]
          .filter(Boolean)
          .join(" ")}
        style={{ aspectRatio: WORDMARK_ASPECT }}
      >
        <Image
          src={LOGO_SRC}
          alt="AKEN"
          fill
          priority={priority}
          sizes="(max-width: 768px) 160px, 260px"
          className="object-cover object-center"
        />
      </span>
    </span>
  );
}

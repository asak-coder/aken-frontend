/**
 * Image extraction.
 *
 * The AKEN site renders most imagery through next/image, which emits a
 * `/_next/image?url=...` wrapper. The wrapper is unwrapped here so the
 * audit reports the real asset path and can probe it directly.
 *
 * Alt text is never rewritten by the auditor. Empty-alt images are
 * reported separately from missing-alt images because `alt=""` is the
 * correct, intentional marking for a decorative image, whereas an absent
 * `alt` attribute is a genuine accessibility/SEO defect.
 */

import { attr, findAll, hasAttr } from "../html-dom.mjs";
import { unwrapNextImageUrl } from "../url-utils.mjs";

/**
 * Alt values that carry no information. Matched case-insensitively as
 * whole values only, so "AKEN logo" or "Steel fabrication workshop" are
 * never flagged.
 */
const GENERIC_ALT_VALUES = new Set([
  "image",
  "img",
  "photo",
  "photograph",
  "picture",
  "pic",
  "graphic",
  "banner",
  "icon",
  "logo",
  "untitled",
  "screenshot",
  "figure",
  "alt",
  "test",
  "placeholder",
]);

export function extractImages(doc) {
  const nodes = findAll(doc, (node) => node.name === "img");

  return nodes.map((node) => {
    const rawSrc = attr(node, "src") ?? attr(node, "data-src") ?? null;
    const src = attr(node, "src") ?? null;
    const unwrapped = rawSrc ? unwrapNextImageUrl(rawSrc) : null;
    const altAttributePresent = hasAttr(node, "alt");
    const alt = attr(node, "alt");

    return {
      rawSrc,
      src,
      resolvedAsset: unwrapped,
      isNextOptimised: Boolean(rawSrc && rawSrc.includes("/_next/image")),
      altAttributePresent,
      alt: altAttributePresent ? String(alt) : null,
      altIsEmpty: altAttributePresent && String(alt).trim() === "",
      altIsGeneric: altAttributePresent && isGenericAlt(String(alt)),
      altMatchesFilename:
        altAttributePresent && matchesFilename(String(alt), unwrapped || rawSrc),
      width: attr(node, "width") ?? null,
      height: attr(node, "height") ?? null,
      hasDimensions: hasAttr(node, "width") && hasAttr(node, "height"),
      loading: attr(node, "loading") ?? null,
      srcset: attr(node, "srcset") ?? null,
      decoding: attr(node, "decoding") ?? null,
      insidePicture: false,
    };
  });
}

export function isGenericAlt(altText) {
  const value = String(altText || "").trim().toLowerCase().replace(/[.!]+$/, "");
  if (!value) return false;
  if (GENERIC_ALT_VALUES.has(value)) return true;
  // "image1", "img_2", "photo-3"
  return /^(image|img|photo|pic|graphic|banner|untitled)[\s_-]*\d+$/.test(value);
}

export function matchesFilename(altText, srcValue) {
  if (!altText || !srcValue) return false;
  const filename = String(srcValue)
    .split("?")[0]
    .split("/")
    .pop()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "");
  if (!filename) return false;
  const normalised = String(altText)
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[\s_-]+/g, "-");
  return normalised === filename.replace(/[\s_-]+/g, "-");
}

export function imagesMissingAlt(images) {
  return images.filter((image) => !image.altAttributePresent);
}

export function imagesWithEmptyAlt(images) {
  return images.filter((image) => image.altIsEmpty);
}

export function imagesWithGenericAlt(images) {
  return images.filter((image) => image.altIsGeneric);
}

export function imagesMissingWithoutDimensions(images) {
  return images.filter(
    (image) => !image.hasDimensions && image.loading !== "lazy",
  );
}

/** Total bytes are not knowable from HTML alone; this is only a count. */
export function imageSummary(images) {
  return {
    total: images.length,
    missingAlt: imagesMissingAlt(images).length,
    emptyAlt: imagesWithEmptyAlt(images).length,
    genericAlt: imagesWithGenericAlt(images).length,
    withoutDimensions: imagesMissingWithoutDimensions(images).length,
    lazyLoaded: images.filter((image) => image.loading === "lazy").length,
  };
}

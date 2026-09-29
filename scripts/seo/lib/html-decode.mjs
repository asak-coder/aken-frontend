/**
 * HTML entity DECODING, for turning markup into text so the auditor can
 * measure titles, headings, alt text and visible copy accurately.
 *
 * This module only ever converts entities into characters. It deliberately
 * contains no escaping/encoding helper: the auditor never writes HTML, so
 * an `escapeHtml` function would be dead, misleading code.
 */

const NAMED_ENTITIES = Object.freeze({
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  shy: "",
  copy: "\u00A9",
  reg: "\u00AE",
  trade: "\u2122",
  deg: "\u00B0",
  plusmn: "\u00B1",
  times: "\u00D7",
  divide: "\u00F7",
  frac12: "\u00BD",
  ndash: "\u2013",
  mdash: "\u2014",
  hellip: "\u2026",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D",
  sbquo: "\u201A",
  bdquo: "\u201E",
  laquo: "\u00AB",
  raquo: "\u00BB",
  bull: "\u2022",
  middot: "\u00B7",
  dagger: "\u2020",
  permil: "\u2030",
  prime: "\u2032",
  Prime: "\u2033",
  euro: "\u20AC",
  pound: "\u00A3",
  yen: "\u00A5",
  cent: "\u00A2",
  inr: "\u20B9",
  rupee: "\u20B9",
  larr: "\u2190",
  uarr: "\u2191",
  rarr: "\u2192",
  darr: "\u2193",
  harr: "\u2194",
  ne: "\u2260",
  le: "\u2264",
  ge: "\u2265",
  infin: "\u221E",
  minus: "\u2212",
  ensp: " ",
  emsp: " ",
  thinsp: " ",
  zwnj: "",
  zwj: "",
  lrm: "",
  rlm: "",
});

const ENTITY_PATTERN = /&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]{1,31});/g;

/** Decode every entity the auditor can recognise; unknown entities stay as-is. */
export function decodeHtmlEntities(input) {
  const value = String(input ?? "");
  if (!value.includes("&")) return value;

  return value.replace(ENTITY_PATTERN, (match, body) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      return codePointToString(Number.parseInt(body.slice(2), 16), match);
    }
    if (body.startsWith("#")) {
      return codePointToString(Number.parseInt(body.slice(1), 10), match);
    }
    const named = NAMED_ENTITIES[body];
    if (named !== undefined) return named;
    const lower = NAMED_ENTITIES[body.toLowerCase()];
    return lower !== undefined ? lower : match;
  });
}

function codePointToString(codePoint, fallback) {
  if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
    return fallback;
  }
  // Surrogate code points are not valid characters on their own.
  if (codePoint >= 0xd800 && codePoint <= 0xdfff) return fallback;
  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return fallback;
  }
}

/** Collapse whitespace runs (including nbsp) into single spaces. */
export function collapseWhitespace(input) {
  return String(input ?? "")
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Decode then collapse. The standard way to read an HTML text node. */
export function textContent(input) {
  return collapseWhitespace(decodeHtmlEntities(input));
}

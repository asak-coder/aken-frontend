/**
 * JSON-LD script block extraction.
 *
 * The raw script text is returned verbatim - it is NOT whitespace-collapsed
 * or entity-decoded. Both would corrupt valid JSON (a newline or an entity
 * reference can legally appear inside a JSON string value), and a parse
 * failure caused by the auditor's own normalisation would produce a false
 * "invalid structured data" finding on a perfectly valid page.
 *
 * `<script>` is a raw-text element in the tokenizer, so its body arrives as
 * one text node with no markup interpretation applied.
 */

import { attr, findAll } from "../html-dom.mjs";

const JSON_LD_TYPE = "application/ld+json";

export function extractJsonLdScripts(doc) {
  const scripts = findAll(doc, (node) => node.name === "script");

  const blocks = [];
  for (const script of scripts) {
    const type = String(attr(script, "type") || "").trim().toLowerCase();
    if (type !== JSON_LD_TYPE) continue;
    blocks.push({
      raw: (script.text || "").trim(),
      viaSrc: attr(script, "src") || null,
    });
  }

  return blocks;
}

/** Convenience: same as above but returns only the raw strings. */
export function jsonLdRawStrings(doc) {
  return extractJsonLdScripts(doc).map((block) => block.raw);
}

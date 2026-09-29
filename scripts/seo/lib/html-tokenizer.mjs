/**
 * A small, dependency-free HTML tokenizer.
 *
 * Why hand-rolled: the auditor runs as a plain Node script inside the
 * Next.js repo. Pulling in an HTML parser dependency for a read-only
 * audit script would add a package to the application's install for no
 * runtime benefit, and the auditor only ever needs six constructs
 * (title, meta, link, headings, anchors, images, JSON-LD script bodies).
 *
 * Correctness properties that matter here and are covered by tests:
 *   - `>` inside a quoted attribute value does not end the tag
 *   - `<` that is not the start of a tag is treated as literal text
 *   - `<script>` / `<style>` / `<title>` / `<textarea>` bodies are raw
 *     text: markup inside them is never parsed as elements
 *   - attribute values are entity-decoded, because `&` in an href is
 *     part of the URL
 */

import { decodeHtmlEntities } from "./html-decode.mjs";

export const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/** Elements whose content is text, not markup. */
export const RAW_TEXT_ELEMENTS = new Set(["script", "style", "textarea", "title"]);

/** Elements that may not contain a nested element of the same kind. */
const SELF_CLOSING_PEERS = Object.freeze({
  li: ["li"],
  dt: ["dt", "dd"],
  dd: ["dt", "dd"],
  p: ["p"],
  tr: ["tr", "td", "th"],
  td: ["td", "th"],
  th: ["td", "th"],
  option: ["option"],
  optgroup: ["optgroup"],
  thead: ["tbody", "tfoot"],
  tbody: ["tbody", "tfoot"],
});

/** Elements that terminate an open <p>. */
const BLOCK_ELEMENTS = new Set([
  "address", "article", "aside", "blockquote", "details", "div", "dl",
  "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3",
  "h4", "h5", "h6", "header", "hgroup", "hr", "main", "nav", "ol", "p",
  "pre", "section", "table", "ul",
]);

export function isSiblingCloseTrigger(openTagName, incomingTagName) {
  const peers = SELF_CLOSING_PEERS[incomingTagName];
  if (peers && peers.includes(openTagName)) return true;
  if (openTagName === "p" && BLOCK_ELEMENTS.has(incomingTagName)) return true;
  if (isHeading(incomingTagName) && isHeading(openTagName)) return true;
  return false;
}

export function isHeading(name) {
  return /^h[1-6]$/.test(String(name || ""));
}

/**
 * @param {string} html
 * @returns {Array<object>} token stream
 */
export function tokenize(html) {
  const source = String(html ?? "");
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    const tagStart = source.indexOf("<", index);

    if (tagStart === -1) {
      pushText(tokens, source.slice(index));
      break;
    }

    if (tagStart > index) {
      pushText(tokens, source.slice(index, tagStart));
    }

    index = tagStart;
    const next = source[index + 1];

    if (source.startsWith("<!--", index)) {
      const commentEnd = source.indexOf("-->", index + 4);
      const end = commentEnd === -1 ? source.length : commentEnd + 3;
      tokens.push({ type: "comment", text: source.slice(index + 4, end) });
      index = end;
      continue;
    }

    if (next === "!" || next === "?") {
      const end = source.indexOf(">", index + 2);
      const stop = end === -1 ? source.length : end + 1;
      tokens.push({ type: "doctype", text: source.slice(index, stop) });
      index = stop;
      continue;
    }

    if (next === "/") {
      const end = source.indexOf(">", index + 2);
      if (end === -1) {
        pushText(tokens, source.slice(index));
        break;
      }
      const name = source.slice(index + 2, end).trim().split(/[\s/]/)[0].toLowerCase();
      tokens.push({ type: "close", name });
      index = end + 1;
      continue;
    }

    // A '<' followed by anything other than a letter is literal text.
    if (!next || !/[a-zA-Z]/.test(next)) {
      pushText(tokens, "<");
      index += 1;
      continue;
    }

    const tagEnd = findTagEnd(source, index);
    if (tagEnd === -1) {
      pushText(tokens, source.slice(index));
      break;
    }

    const rawTag = source.slice(index + 1, tagEnd);
    const open = parseOpenTag(rawTag);
    tokens.push(open);
    index = tagEnd + 1;

    if (
      RAW_TEXT_ELEMENTS.has(open.name) &&
      !open.selfClosing &&
      !VOID_ELEMENTS.has(open.name)
    ) {
      const closeMarker = `</${open.name}`;
      const lowerSource = source.toLowerCase();
      const closeStart = lowerSource.indexOf(closeMarker, index);
      if (closeStart === -1) {
        pushText(tokens, source.slice(index));
        break;
      }
      if (closeStart > index) {
        pushText(tokens, source.slice(index, closeStart));
      }
      index = closeStart;
    }
  }

  return tokens;
}

function pushText(tokens, text) {
  if (!text) return;
  tokens.push({ type: "text", text });
}

/** Index of the tag-closing `>`, ignoring `>` inside quoted attribute values. */
function findTagEnd(source, start) {
  let quote = null;
  for (let i = start + 1; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === ">") return i;
  }
  return -1;
}

const ATTRIBUTE_PATTERN =
  /([^\s"'=<>`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]*)))?/g;

function parseOpenTag(rawTag) {
  const trimmed = rawTag.trim();
  const selfClosing = /\/\s*$/.test(trimmed);
  const withoutSlash = selfClosing ? trimmed.replace(/\/\s*$/, "") : trimmed;
  const nameMatch = withoutSlash.match(/^([a-zA-Z][a-zA-Z0-9:_-]*)/);
  const name = (nameMatch ? nameMatch[1] : "").toLowerCase();
  const attributes = {};
  const remainder = nameMatch ? withoutSlash.slice(nameMatch[1].length) : "";

  for (const match of remainder.matchAll(ATTRIBUTE_PATTERN)) {
    const key = match[1].toLowerCase();
    if (!key || Object.hasOwn(attributes, key)) continue;
    const rawValue = match[2] ?? match[3] ?? match[4] ?? "";
    attributes[key] = decodeHtmlEntities(rawValue);
  }

  return { type: "open", name, attrs: attributes, selfClosing };
}

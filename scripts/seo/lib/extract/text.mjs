/**
 * Visible-text extraction.
 *
 * Used for three things:
 *   - thin-content detection (word count)
 *   - duplicate-content signals (shingled similarity)
 *   - checking whether structured-data values actually appear on a page
 *
 * `<script>`, `<style>`, `<noscript>`, `<template>`, `<svg>` and `<head>`
 * subtrees are skipped: their contents are not copy, and JSON-LD in
 * particular would otherwise make every page appear to contain its own
 * metadata as visible text.
 */

import { attr, findFirstByTag } from "../html-dom.mjs";
import { textContent } from "../html-decode.mjs";

const NON_VISIBLE_ELEMENTS = new Set([
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "head",
]);

export function visibleText(node) {
  if (!node) return "";
  if (NON_VISIBLE_ELEMENTS.has(node.name)) return "";
  if (attr(node, "hidden") !== undefined) return "";

  const parts = [];
  if (node.text) parts.push(node.text);
  for (const child of node.children) {
    const childText = visibleText(child);
    if (childText) parts.push(childText);
  }
  return textContent(parts.join(" "));
}

/** Text inside <main> when present, otherwise the whole body text. */
export function mainContentText(doc) {
  const main = findFirstByTag(doc, "main");
  if (main) return visibleText(main);
  return bodyText(doc);
}

/** Text of the whole body, minus non-visible subtrees. */
export function bodyText(doc) {
  const body = findFirstByTag(doc, "body");
  return body ? visibleText(body) : visibleText(doc);
}

export function countWords(text) {
  const value = String(text || "").trim();
  if (!value) return 0;
  return value.split(/\s+/).filter(Boolean).length;
}

/**
 * Normalised form used for similarity comparisons: lower-cased, with
 * punctuation and digits stripped so that "Rs 350" and "350" do not defeat
 * an otherwise obvious match.
 */
export function normalizeForComparison(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/[^a-z\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sliding n-word shingles over the normalised text. */
export function shingles(text, size = 5) {
  const words = normalizeForComparison(text).split(" ").filter(Boolean);
  const result = new Set();
  if (words.length < size) return result;
  for (let index = 0; index + size <= words.length; index += 1) {
    result.add(words.slice(index, index + size).join(" "));
  }
  return result;
}

/** Jaccard similarity of two shingle sets. 0 when either side is empty. */
export function jaccardSimilarity(left, right) {
  if (!left || !right || left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  const [small, large] = left.size <= right.size ? [left, right] : [right, left];
  for (const item of small) {
    if (large.has(item)) intersection += 1;
  }
  const union = left.size + right.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** First N characters, for report excerpts. */
export function excerpt(text, length = 160) {
  const value = String(text || "").trim();
  return value.length <= length ? value : `${value.slice(0, length - 1)}\u2026`;
}

/**
 * sitemap.xml parsing.
 *
 * Handles both document kinds:
 *   - <urlset>     - a list of page URLs
 *   - <sitemapindex> - a list of nested sitemap files
 *
 * Parsing is deliberately narrow: sitemaps are machine-generated, so the
 * only constructs that matter are <loc>, <lastmod>, <changefreq> and
 * <priority> inside <url>/<sitemap>. A malformed document is reported as
 * a problem rather than silently yielding an empty set, because "the
 * sitemap could not be parsed" and "the sitemap is empty" are very
 * different findings.
 */

import { findFirstByTag, parseDocument } from "./html-dom.mjs";
import { textContent } from "./html-decode.mjs";

const LOC_TAG = "loc";
const LASTMOD_TAG = "lastmod";

/**
 * @param {string} xml
 * @returns {{
 *   kind: "urlset"|"sitemapindex"|"unknown",
 *   entries: Array<{loc: string|null, lastModified: string|null, changeFrequency: string|null, priority: string|null}>,
 *   nestedSitemaps: Array<{loc: string|null, lastModified: string|null}>,
 *   errors: string[]
 * }}
 */
export function parseSitemapXml(xml) {
  const result = {
    kind: "unknown",
    entries: [],
    nestedSitemaps: [],
    errors: [],
  };

  const text = String(xml || "");
  if (!text.trim()) {
    result.errors.push("empty document");
    return result;
  }

  const doc = parseDocument(text);
  const urlset = findFirstByTag(doc, "urlset");
  const sitemapindex = findFirstByTag(doc, "sitemapindex");

  if (urlset) {
    result.kind = "urlset";
    for (const urlNode of findAllTags(urlset, "url")) {
      result.entries.push({
        loc: readText(urlNode, LOC_TAG),
        lastModified: readText(urlNode, LASTMOD_TAG),
        changeFrequency: readText(urlNode, "changefreq"),
        priority: readText(urlNode, "priority"),
      });
    }
    return result;
  }

  if (sitemapindex) {
    result.kind = "sitemapindex";
    for (const sitemapNode of findAllTags(sitemapindex, "sitemap")) {
      result.nestedSitemaps.push({
        loc: readText(sitemapNode, LOC_TAG),
        lastModified: readText(sitemapNode, LASTMOD_TAG),
      });
    }
    return result;
  }

  result.errors.push(
    `<urlset> or <sitemapindex> not found (looks like ${looksLikeHtml(text) ? "an HTML error page" : "a non-sitemap document"})`,
  );
  return result;
}

function findAllTags(root, tagName) {
  const matches = [];
  const visit = (node) => {
    if (node.name === tagName) matches.push(node);
    for (const child of node.children) visit(child);
  };
  for (const child of root.children) visit(child);
  return matches;
}

function readText(node, tagName) {
  const child = findFirstByTag(node, tagName);
  if (!child) return null;
  const value = textContent(child.text + child.children.map((c) => c.text).join(" "));
  return value || null;
}

function looksLikeHtml(text) {
  const head = text.slice(0, 400).toLowerCase();
  return head.includes("<!doctype html") || head.includes("<html");
}

/** Convenience: just the page URLs, ready for comparison. */
export function sitemapLocations(parsed) {
  return parsed.entries.map((entry) => entry.loc).filter(Boolean);
}

/** Group entries by lastmod so a build-constant timestamp is visible. */
export function groupByLastModified(parsed) {
  const groups = new Map();
  for (const entry of parsed.entries) {
    const key = entry.lastModified || "(none)";
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  return [...groups.entries()]
    .map(([lastModified, count]) => ({ lastModified, count }))
    .sort((left, right) => right.count - left.count);
}

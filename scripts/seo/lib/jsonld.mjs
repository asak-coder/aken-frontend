/**
 * JSON-LD parsing and structural validation.
 *
 * Two firm boundaries are encoded here:
 *
 *  1. The auditor validates and REPORTS. It never emits structured data,
 *     never "fixes" a node, and never writes anything back to the site.
 *  2. Node types that would require AKEN to assert something unverified -
 *     ratings, reviews, review counts, priced offers, events - are treated
 *     as high-risk if they appear. The auditor flags them; it does not
 *     create, complete or enrich them.
 */

import { SITE } from "./config.mjs";

export const RECOGNISED_TYPES = Object.freeze([
  "Organization",
  "LocalBusiness",
  "GeneralContractor",
  "Service",
  "BreadcrumbList",
  "Article",
  "BlogPosting",
  "NewsArticle",
  "WebSite",
  "WebPage",
  "FAQPage",
  "Question",
  "Answer",
  "Offer",
  "Brand",
  "ContactPoint",
  "PostalAddress",
  "ListItem",
  "ImageObject",
  "Person",
  "City",
  "Country",
  "AdministrativeArea",
]);

/**
 * Types that make a factual claim about the business which the auditor
 * cannot verify. Presence is a WARNING, never an automatic error: a
 * genuine, documented review is legitimate - the point is that a human
 * must confirm it.
 */
export const CLAIM_BEARING_TYPES = Object.freeze([
  "AggregateRating",
  "Review",
  "Rating",
  "Event",
]);

/** Minimum properties any node of this type must carry to be meaningful. */
export const REQUIRED_PROPERTIES = Object.freeze({
  Organization: ["name", "url"],
  LocalBusiness: ["name", "url", "address"],
  GeneralContractor: ["name", "url", "address"],
  Service: ["name"],
  BreadcrumbList: ["itemListElement"],
  Article: ["headline", "author"],
  BlogPosting: ["headline", "author"],
  NewsArticle: ["headline", "author"],
  FAQPage: ["mainEntity"],
  WebSite: ["url", "name"],
  WebPage: ["url"],
  ListItem: ["position"],
  Question: ["name", "acceptedAnswer"],
  Answer: ["text"],
});

const VALID_CONTEXTS = new Set(["https://schema.org", "http://schema.org", "https://schema.org/"]);

/**
 * @param {Array<{raw: string, viaSrc: string|null}>} blocks
 */
export function parseJsonLdBlocks(blocks) {
  return blocks.map((block, index) => {
    const result = {
      index,
      viaSrc: block.viaSrc,
      rawLength: block.raw.length,
      ok: false,
      data: null,
      error: null,
    };

    if (!block.raw) {
      result.error = "empty script body";
      return result;
    }

    try {
      result.data = JSON.parse(block.raw);
      result.ok = true;
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  });
}

export function inferTypes(value) {
  if (!value || typeof value !== "object") return [];
  const type = value["@type"];
  if (typeof type === "string") return [type];
  if (Array.isArray(type)) return type.filter((entry) => typeof entry === "string");
  return [];
}

export function hasType(value, typeName) {
  return inferTypes(value).includes(typeName);
}

/**
 * Flatten parsed blocks into individual nodes, expanding `@graph`.
 */
export function flattenNodes(parsedBlocks) {
  const nodes = [];

  for (const block of parsedBlocks) {
    if (!block.ok || !block.data || typeof block.data !== "object") continue;

    const graph = block.data["@graph"];
    if (Array.isArray(graph)) {
      for (const item of graph) {
        if (item && typeof item === "object") {
          nodes.push({ blockIndex: block.index, context: block.data["@context"], node: item });
        }
      }
      continue;
    }

    nodes.push({ blockIndex: block.index, context: block.data["@context"], node: block.data });
  }

  return nodes;
}

export function validateContexts(parsedBlocks) {
  const problems = [];
  for (const block of parsedBlocks) {
    if (!block.ok || !block.data || typeof block.data !== "object") continue;
    const context = block.data["@context"];
    if (context === undefined) {
      problems.push({ blockIndex: block.index, reason: "missing @context" });
      continue;
    }
    if (typeof context === "string" && !VALID_CONTEXTS.has(context)) {
      problems.push({ blockIndex: block.index, reason: `unexpected @context "${context}"` });
    }
  }
  return problems;
}

export function missingRequiredProperties(node) {
  const missing = [];
  for (const type of inferTypes(node)) {
    const required = REQUIRED_PROPERTIES[type];
    if (!required) continue;
    for (const property of required) {
      if (node[property] === undefined || node[property] === null) {
        missing.push(`${type}.${property}`);
      }
    }
  }
  return missing;
}

/** Every URL-ish string on a node, for host consistency checks. */
export function nodeUrls(node) {
  const urls = [];
  const directKeys = ["url", "@id", "mainEntityOfPage", "image", "logo"];
  for (const key of directKeys) {
    const value = node[key];
    if (typeof value === "string") urls.push({ key, value });
    if (value && typeof value === "object" && typeof value["@id"] === "string") {
      urls.push({ key, value: value["@id"] });
    }
  }
  if (Array.isArray(node.sameAs)) {
    for (const entry of node.sameAs) {
      if (typeof entry === "string") urls.push({ key: "sameAs", value: entry });
    }
  }
  return urls;
}

export function isPrimaryHostString(value) {
  try {
    const url = new URL(value);
    return url.hostname.toLowerCase() === SITE.productionHost;
  } catch {
    return false;
  }
}

/** Stable label used in reports, e.g. "Service:/services/peb". */
export function nodeLabel(entry) {
  const types = inferTypes(entry.node);
  const type = types.length > 0 ? types.join("+") : "unknown";
  const identifier = entry.node["@id"] || entry.node.url || entry.node.name || `block-${entry.blockIndex}`;
  return `${type}:${identifier}`;
}

/**
 * Names and headlines that a reader should be able to see on the page.
 * Descriptions are excluded deliberately: a schema description is often a
 * shortened or rephrased version of on-page copy, and treating that as a
 * mismatch would generate noise rather than signal.
 */
export function claimTexts(node) {
  const texts = [];
  for (const key of ["name", "headline", "alternateName"]) {
    const value = node[key];
    if (typeof value === "string" && value.trim().length >= 4) {
      texts.push({ key, value: value.trim() });
    }
  }
  return texts;
}

export function countTypes(entries) {
  const counts = new Map();
  for (const entry of entries) {
    for (const type of inferTypes(entry.node)) {
      counts.set(type, (counts.get(type) || 0) + 1);
    }
  }
  return counts;
}

export function summariseTypes(entries) {
  return [...countTypes(entries).entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((left, right) => left.type.localeCompare(right.type));
}

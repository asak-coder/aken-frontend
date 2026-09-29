/**
 * Head-level extraction: title, description, canonical, robots directives,
 * Open Graph, Twitter card, language and viewport.
 *
 * Every audit that needs page metadata reads this once per page rather than
 * re-walking the tree.
 */

import { attr, elementText, findAll, findFirstByTag } from "../html-dom.mjs";
import { textContent } from "../html-decode.mjs";

const ROBOTS_META_NAMES = new Set(["robots", "googlebot"]);

export function extractHeadInfo(doc) {
  const htmlRoot = findFirstByTag(doc, "html");
  const titleNode = findFirstByTag(doc, "title");
  const title = titleNode ? textContent(elementText(titleNode)) : "";
  const titleNodeCount = findAll(doc, (node) => node.name === "title").length;

  const metas = findAll(doc, (node) => node.name === "meta");
  const byName = {};
  const byProperty = {};
  const byHttpEquiv = {};
  const robotsSources = [];

  for (const meta of metas) {
    const content = attr(meta, "content") ?? "";
    const name = (attr(meta, "name") || "").toLowerCase();
    const property = (attr(meta, "property") || "").toLowerCase();
    const httpEquiv = (attr(meta, "http-equiv") || "").toLowerCase();

    if (name) {
      byName[name] = content;
      if (ROBOTS_META_NAMES.has(name)) {
        robotsSources.push({ source: name === "robots" ? "meta-robots" : "meta-googlebot", value: content });
      }
    }
    if (property) byProperty[property] = content;
    if (httpEquiv) byHttpEquiv[httpEquiv] = content;
  }

  const links = findAll(doc, (node) => node.name === "link");
  const canonicalHrefs = links
    .filter((link) => tokenList(attr(link, "rel")).includes("canonical"))
    .map((link) => attr(link, "href") || "");

  const alternates = links
    .filter((link) => tokenList(attr(link, "rel")).includes("alternate"))
    .map((link) => ({
      href: attr(link, "href") || "",
      hreflang: attr(link, "hreflang") || "",
      type: attr(link, "type") || "",
    }));

  return {
    title: title || null,
    titleLength: title ? title.length : 0,
    titleNodeCount,
    description: byName.description ? textContent(byName.description) : null,
    descriptionLength: byName.description ? textContent(byName.description).length : 0,
    descriptionTagCount: metas.filter((meta) => (attr(meta, "name") || "").toLowerCase() === "description").length,
    metaByName: byName,
    metaByProperty: byProperty,
    metaByHttpEquiv: byHttpEquiv,
    canonicalHrefs,
    canonicalCount: canonicalHrefs.length,
    alternates,
    robotsSources,
    htmlLang: htmlRoot ? attr(htmlRoot, "lang") || "" : "",
    viewport: byName.viewport || null,
    openGraph: {
      title: byProperty["og:title"] || null,
      description: byProperty["og:description"] || null,
      url: byProperty["og:url"] || null,
      type: byProperty["og:type"] || null,
      image: byProperty["og:image"] || null,
      siteName: byProperty["og:site_name"] || null,
      locale: byProperty["og:locale"] || null,
    },
    twitter: {
      card: byName["twitter:card"] || null,
      title: byName["twitter:title"] || null,
      description: byName["twitter:description"] || null,
      image: byName["twitter:image"] || null,
    },
  };
}

export function tokenList(value) {
  return String(value || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Parse a robots directive string (meta content or an X-Robots-Tag header).
 *
 * Returns the raw tokens plus the two decisions that matter for
 * indexability, and an `unknown` list so an unrecognised directive is
 * surfaced rather than silently ignored.
 */
export function parseRobotsDirectives(value) {
  const tokens = String(value || "")
    .toLowerCase()
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const result = {
    raw: String(value || ""),
    tokens,
    noindex: false,
    nofollow: false,
    none: false,
    noarchive: false,
    nosnippet: false,
    unavailableAfter: null,
    maxSnippet: null,
    maxImagePreview: null,
    unknown: [],
  };

  for (const token of tokens) {
    if (token === "noindex") result.noindex = true;
    else if (token === "nofollow") result.nofollow = true;
    else if (token === "none") {
      result.noindex = true;
      result.nofollow = true;
      result.none = true;
    } else if (token === "noarchive") result.noarchive = true;
    else if (token === "nosnippet") result.nosnippet = true;
    else if (token.startsWith("unavailable_after:")) result.unavailableAfter = token.slice("unavailable_after:".length);
    else if (token.startsWith("max-snippet:")) result.maxSnippet = token.slice("max-snippet:".length);
    else if (token.startsWith("max-image-preview:")) result.maxImagePreview = token.slice("max-image-preview:".length);
    else if (token === "index" || token === "follow" || token === "all") continue;
    else result.unknown.push(token);
  }

  return result;
}

/** Merge several directive sources; a single noindex anywhere wins. */
export function mergeRobotsDirectives(sources) {
  const parsed = sources.map((entry) => ({
    ...parseRobotsDirectives(entry.value),
    source: entry.source,
    /**
     * The original directive string. parseRobotsDirectives stores it as `raw`
     * but not as `value`, so without this the reports and the indexability
     * reasons printed "meta robots: undefined" for every noindexed page.
     */
    value: String(entry.value === null || entry.value === undefined ? "" : entry.value),
  }));

  return {
    sources: parsed,
    noindex: parsed.some((entry) => entry.noindex),
    nofollow: parsed.some((entry) => entry.nofollow),
    unknown: parsed.flatMap((entry) => entry.unknown),
  };
}

export function parseRobotsTxtHeaderValue(headerValue) {
  if (!headerValue) return null;
  return { source: "x-robots-tag", value: String(headerValue) };
}

export function hasOpenGraphEssentials(openGraph) {
  return Boolean(openGraph.title && openGraph.description && openGraph.type);
}

export function hasTwitterEssentials(twitter) {
  return Boolean(twitter.card && (twitter.title || twitter.description));
}

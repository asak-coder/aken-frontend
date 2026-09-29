/**
 * Anchor extraction and classification.
 *
 * Every anchor is resolved to an absolute URL before it leaves this module,
 * because the audits need to compare link targets against a route index.
 * Resolution failures are preserved as a `malformed` classification rather
 * than dropped: an unparseable href is itself a finding.
 */

import { attr, elementText, findAll } from "../html-dom.mjs";
import {
  isAssetPath,
  isNonHttpHref,
  isSameSite,
  parseUrl,
} from "../url-utils.mjs";

const LINK_KIND = Object.freeze({
  INTERNAL: "internal",
  EXTERNAL: "external",
  FRAGMENT: "fragment",
  MAILTO: "mailto",
  TEL: "tel",
  OTHER_SCHEME: "other-scheme",
  MALFORMED: "malformed",
  EMPTY: "empty",
});

export { LINK_KIND };

export function extractAnchors(doc, pageUrl) {
  const nodes = findAll(doc, (node) => node.name === "a");

  return nodes.map((node) => {
    const rawHref = attr(node, "href");
    const text = elementText(node);
    const rel = String(attr(node, "rel") || "").toLowerCase();
    const target = attr(node, "target") || null;
    const classification = classifyHref(rawHref, pageUrl);

    return {
      rawHref: rawHref === undefined ? null : rawHref,
      text,
      rel,
      target,
      ...classification,
    };
  });
}

export function classifyHref(rawHref, pageUrl) {
  if (rawHref === undefined || rawHref === null) {
    return { kind: LINK_KIND.EMPTY, href: null, resolvedUrl: null, url: null };
  }

  const href = String(rawHref).trim();

  if (href === "") {
    return { kind: LINK_KIND.EMPTY, href, resolvedUrl: null, url: null };
  }

  if (href.startsWith("#")) {
    return { kind: LINK_KIND.FRAGMENT, href, resolvedUrl: null, url: null };
  }

  const lower = href.toLowerCase();
  if (lower.startsWith("mailto:")) {
    return { kind: LINK_KIND.MAILTO, href, resolvedUrl: null, url: null };
  }
  if (lower.startsWith("tel:")) {
    return { kind: LINK_KIND.TEL, href, resolvedUrl: null, url: null };
  }
  if (isNonHttpHref(href)) {
    return { kind: LINK_KIND.OTHER_SCHEME, href, resolvedUrl: null, url: null };
  }

  const resolved = parseUrl(href, pageUrl);
  if (!resolved) {
    return { kind: LINK_KIND.MALFORMED, href, resolvedUrl: null, url: null };
  }

  const resolvedUrl = `${resolved.protocol}//${resolved.hostname}${resolved.port ? `:${resolved.port}` : ""}${resolved.pathname}${resolved.search}`;

  return {
    kind: isSameSite(resolved) ? LINK_KIND.INTERNAL : LINK_KIND.EXTERNAL,
    href,
    resolvedUrl,
    url: resolved,
    isAsset: isAssetPath(resolved.pathname),
    usesHttp: resolved.protocol === "http:",
  };
}

/** Anchors that point at another document on this site, ignoring assets. */
export function internalLinks(anchors) {
  return anchors.filter((anchor) => anchor.kind === LINK_KIND.INTERNAL);
}

export function externalLinks(anchors) {
  return anchors.filter((anchor) => anchor.kind === LINK_KIND.EXTERNAL);
}

export function malformedLinks(anchors) {
  return anchors.filter((anchor) => anchor.kind === LINK_KIND.MALFORMED);
}

/** Plain `http://` links where the host also serves HTTPS. */
export function insecureExternalLinks(anchors) {
  return anchors.filter(
    (anchor) => anchor.kind === LINK_KIND.EXTERNAL && anchor.usesHttp === true,
  );
}

/**
 * Anchors that should not be followed for crawl discovery: assets,
 * fragments, non-HTTP schemes, and off-site documents.
 */
export function crawlableInternalTargets(anchors) {
  return anchors.filter(
    (anchor) =>
      anchor.kind === LINK_KIND.INTERNAL && anchor.url !== null && !anchor.isAsset,
  );
}

/**
 * Repeated identical link targets on a single page. Used for the
 * "excessive repeated links" signal in the internal-link audit.
 */
export function countAnchorTargets(anchors) {
  const counts = new Map();
  for (const anchor of anchors) {
    if (!anchor.resolvedUrl) continue;
    counts.set(anchor.resolvedUrl, (counts.get(anchor.resolvedUrl) || 0) + 1);
  }
  return counts;
}

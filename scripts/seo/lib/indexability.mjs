/**
 * Indexability classification for a single page.
 *
 * Answers one question with four possible verdicts plus an honest
 * "could not determine":
 *
 *   INDEXABLE - crawlable, fetchable, and no directive suppresses indexing
 *   NOINDEX   - a robots directive suppresses indexing
 *   BLOCKED   - robots.txt disallows the path for the auditor's user-agent
 *   CONFLICT  - the canonical and the robots directive disagree about which
 *               URL should be the indexed one
 *   UNVERIFIED- the page could not be retrieved, so nothing is claimed
 *
 * The auditor never changes any of this. It reports the state and the
 * evidence that produced it.
 */

import { isPathAllowed } from "./robots-parse.mjs";
import { extractHeadInfo, mergeRobotsDirectives } from "./extract/meta.mjs";

export const INDEXABILITY = Object.freeze({
  INDEXABLE: "INDEXABLE",
  NOINDEX: "NOINDEX",
  BLOCKED: "BLOCKED",
  CONFLICT: "CONFLICT",
  UNVERIFIED: "UNVERIFIED",
});

const AUDIT_USER_AGENT = "AKENSEOAudit";

/**
 * @param {object} input
 * @param {object|null} input.page     crawl record
 * @param {object|null} input.robots   parsed robots.txt
 * @returns {object} indexability verdict with evidence
 */
export function classifyIndexability({ page, robots }) {
  const base = {
    state: INDEXABILITY.UNVERIFIED,
    httpStatus: page ? page.status : 0,
    noindex: false,
    nofollow: false,
    blockedByRobots: false,
    robotsRule: null,
    metaRobots: null,
    googlebotRobots: null,
    xRobotsTag: null,
    canonicalTarget: null,
    canonicalPointsElsewhere: false,
    reasons: [],
  };

  if (!page) {
    base.reasons.push("page was not fetched");
    return base;
  }

  if (page.blocked) {
    base.reasons.push(`request refused by the SSRF guard: ${page.blocked.reason}`);
    return base;
  }

  if (page.error) {
    base.reasons.push(`fetch failed: ${page.error.code} - ${page.error.message}`);
    return base;
  }

  if (!page.ok) {
    base.reasons.push(`HTTP ${page.status}${page.statusText ? ` ${page.statusText}` : ""}`);
    return base;
  }

  if (page.contentType && !isHtmlContentType(page.contentType)) {
    base.reasons.push(`non-HTML content type: ${page.contentType.split(";")[0]}`);
    return base;
  }

  if (page.bodyTruncated) {
    base.reasons.push(
      "response body was truncated at the auditor's byte ceiling, so directives later in the document may be missing",
    );
  }

  const head = page.headInfo || (page.doc ? extractHeadInfo(page.doc) : null);
  const robotSources = head ? [...head.robotsSources] : [];
  if (page.headers && page.headers["x-robots-tag"]) {
    robotSources.push({ source: "x-robots-tag", value: page.headers["x-robots-tag"] });
  }

  const merged = mergeRobotsDirectives(robotSources);
  base.metaRobots = merged.sources.find((entry) => entry.source === "meta-robots") || null;
  base.googlebotRobots = merged.sources.find((entry) => entry.source === "meta-googlebot") || null;
  base.xRobotsTag = merged.sources.find((entry) => entry.source === "x-robots-tag") || null;
  base.noindex = merged.noindex;
  base.nofollow = merged.nofollow;
  base.directiveUnknown = merged.unknown;

  const robotsVerdict = robots ? isPathAllowed(robots, page.path, AUDIT_USER_AGENT) : null;
  if (robotsVerdict && !robotsVerdict.allowed) {
    base.blockedByRobots = true;
    base.robotsRule = robotsVerdict.rule;
  }

  const canonical = resolveCanonicalTarget(head, page);
  if (canonical) {
    base.canonicalTarget = canonical.target;
    base.canonicalPointsElsewhere = canonical.pointsElsewhere;
  }

  if (base.blockedByRobots) {
    base.state = INDEXABILITY.BLOCKED;
    base.reasons.push(`robots.txt: ${base.robotsRule}`);
    if (base.noindex) {
      base.reasons.push("robots meta also requests noindex");
    }
    return base;
  }

  if (base.noindex && base.canonicalPointsElsewhere) {
    base.state = INDEXABILITY.CONFLICT;
    base.reasons.push(
      `noindex is set and the canonical points to ${base.canonicalTarget}, which is a consolidation pattern rather than an error - the canonical target must be the URL that is indexed`,
    );
    return base;
  }

  if (base.noindex) {
    base.state = INDEXABILITY.NOINDEX;
    if (base.xRobotsTag) base.reasons.push(`X-Robots-Tag: ${base.xRobotsTag.value}`);
    if (base.metaRobots) base.reasons.push(`meta robots: ${base.metaRobots.value}`);
    if (base.googlebotRobots) base.reasons.push(`meta googlebot: ${base.googlebotRobots.value}`);
    return base;
  }

  if (base.canonicalPointsElsewhere) {
    base.state = INDEXABILITY.CONFLICT;
    base.reasons.push(
      `page is indexable but declares ${base.canonicalTarget} as its canonical, so this URL should not itself be indexed`,
    );
    return base;
  }

  base.state = INDEXABILITY.INDEXABLE;
  return base;
}

function resolveCanonicalTarget(head, page) {
  if (!head || !Array.isArray(head.canonicalHrefs) || head.canonicalHrefs.length === 0) {
    return null;
  }

  const raw = head.canonicalHrefs[0];
  let target;
  try {
    target = new URL(raw, page.url);
  } catch {
    return { target: raw, pointsElsewhere: true, unparseable: true };
  }

  const normalise = (url) =>
    `${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, "") || "/"}`;

  return {
    target: `${target.protocol}//${target.hostname}${target.pathname}`,
    pointsElsewhere: normalise(target) !== normalise(new URL(page.url)),
  };
}

export function isHtmlContentType(contentType) {
  const value = String(contentType || "").toLowerCase();
  if (!value) return true;
  return value.includes("text/html") || value.includes("application/xhtml+xml");
}

export function isIndexableState(state) {
  return state === INDEXABILITY.INDEXABLE;
}

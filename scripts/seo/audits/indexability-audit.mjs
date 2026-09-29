/**
 * AUDIT 13 - Indexability.
 *
 * Reports the indexability verdict for every crawled URL, with the
 * evidence behind it: robots directives, the X-Robots-Tag header, the
 * robots.txt rule and the canonical target.
 *
 * Severity mapping:
 *   ERROR      - an indexable-looking page is blocked by robots.txt
 *   WARNING    - an indexable page declares a canonical to a different URL
 *   INFO       - intentional noindex, or the documented noindex+canonical
 *                consolidation pattern, or a redirect before content
 *   UNVERIFIED - the page could not be retrieved
 *
 * Nothing is changed. The auditor reports the state; it never removes a
 * noindex, rewrites a canonical or edits robots.txt.
 */

import { INDEXABILITY } from "../lib/indexability.mjs";
import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages } from "./shared.mjs";

const AUDIT = "indexability";

export function runIndexabilityAudit({ crawl }) {
  const findings = [];
  const observations = [];

  const counts = {
    INDEXABLE: 0,
    NOINDEX: 0,
    BLOCKED: 0,
    CONFLICT: 0,
    UNVERIFIED: 0,
  };

  for (const page of crawl.pages) {
    const verdict = page.indexability || {
      state: INDEXABILITY.UNVERIFIED,
      reasons: ["no verdict recorded"],
    };
    counts[verdict.state] = (counts[verdict.state] || 0) + 1;

    observations.push({
      code: "indexability",
      url: page.url,
      path: page.path,
      kind: page.kind,
      state: verdict.state,
      noindex: Boolean(verdict.noindex),
      nofollow: Boolean(verdict.nofollow),
      blockedByRobots: Boolean(verdict.blockedByRobots),
      robotsRule: verdict.robotsRule || null,
      metaRobots: verdict.metaRobots ? verdict.metaRobots.value : null,
      googlebotRobots: verdict.googlebotRobots ? verdict.googlebotRobots.value : null,
      xRobotsTag: verdict.xRobotsTag ? verdict.xRobotsTag.value : null,
      canonicalTarget: verdict.canonicalTarget || null,
      status: page.status,
      reasons: verdict.reasons || [],
    });

    if (verdict.state === INDEXABILITY.BLOCKED) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "indexability-blocked-by-robots",
          url: page.url,
          message: `robots.txt prevents crawling this URL (${verdict.robotsRule}), so no search engine will read it.`,
          evidence: { path: page.path, kind: page.kind, robotsRule: verdict.robotsRule },
        }),
      );
    }

    if (verdict.state === INDEXABILITY.CONFLICT) {
      const noindex = Boolean(verdict.noindex);
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: noindex ? SEVERITY.INFO : SEVERITY.WARNING,
          code: noindex ? "indexability-noindex-canonical-consolidation" : "indexability-canonical-conflict",
          url: page.url,
          message: noindex
            ? `This URL is noindexed and its canonical points at ${verdict.canonicalTarget}. That is a deliberate consolidation pattern, so the target must be indexable and return 200.`
            : `This page is indexable but declares ${verdict.canonicalTarget} as its canonical, so it will not be indexed under its own URL.`,
          evidence: {
            canonicalTarget: verdict.canonicalTarget,
            indexability: verdict.state,
            reasons: verdict.reasons,
          },
        }),
      );
    }

    if (verdict.state === INDEXABILITY.NOINDEX) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.INFO,
          code: "indexability-noindex",
          url: page.url,
          message: "This page requests noindex, so it is intentionally excluded from search results.",
          evidence: {
            metaRobots: verdict.metaRobots ? verdict.metaRobots.value : null,
            googlebot: verdict.googlebotRobots ? verdict.googlebotRobots.value : null,
            xRobotsTag: verdict.xRobotsTag ? verdict.xRobotsTag.value : null,
          },
        }),
      );
    }

    if (verdict.state === INDEXABILITY.UNVERIFIED) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.UNVERIFIED,
          code: "indexability-unverified",
          url: page.url,
          message: `The indexability of this URL could not be determined: ${(verdict.reasons || []).join("; ") || "no response"}`,
          evidence: { status: page.status, error: page.error, blocked: page.blocked },
        }),
      );
    }

    if (verdict.directiveUnknown && verdict.directiveUnknown.length > 0) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.INFO,
          code: "indexability-unknown-directive",
          url: page.url,
          message: `Unrecognised robots directive${verdict.directiveUnknown.length === 1 ? "" : "s"}: ${verdict.directiveUnknown.join(", ")}. Most crawlers ignore these.`,
          evidence: { directives: verdict.directiveUnknown },
        }),
      );
    }
  }

  for (const page of analysedPages(crawl)) {
    if (page.redirects && page.redirects.length > 0) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.INFO,
          code: "indexability-reached-via-redirect",
          url: page.url,
          message: `This URL redirected ${page.redirects.length} time${page.redirects.length === 1 ? "" : "s"} before content was reached (final URL ${page.finalUrl}).`,
          evidence: { redirects: page.redirects },
        }),
      );
    }
  }

  return buildAuditResult({
    id: AUDIT,
    name: "Indexability",
    description:
      "Robots directives, X-Robots-Tag, robots.txt rules and canonical conflicts, reported as INDEXABLE / NOINDEX / BLOCKED / CONFLICT / UNVERIFIED.",
    findings,
    summary: {
      urlsChecked: crawl.pages.length,
      indexable: counts.INDEXABLE,
      noindex: counts.NOINDEX,
      blocked: counts.BLOCKED,
      conflict: counts.CONFLICT,
      unverified: counts.UNVERIFIED,
      pagesWithXRobotsTag: observations.filter((entry) => entry.xRobotsTag !== null).length,
      pagesWithMetaRobots: observations.filter((entry) => entry.metaRobots !== null).length,
    },
    observations,
  });
}

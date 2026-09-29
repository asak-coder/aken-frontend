/**
 * Aggregates the individual audit results into the run-level summary that
 * appears at the top of both reports.
 *
 * Two numbers are deliberately kept separate because conflating them would
 * mislead:
 *
 *   - errors     : real defects found in AKEN's output
 *   - unverified : things the auditor could not determine
 *
 * A run with many UNVERIFIED findings is not a run with many problems. It
 * is a run the auditor could not complete, and the summary says so.
 */

import { SEVERITY, tallyBySeverity } from "../lib/severity.mjs";

export const AUDIT_ORDER = Object.freeze([
  "discovery",
  "titles",
  "descriptions",
  "canonicals",
  "h1",
  "headings",
  "robots",
  "sitemap",
  "structured-data",
  "internal-links",
  "external-links",
  "images",
  "indexability",
  "duplicate-signals",
  "url-quality",
  "blog",
  "services",
]);

/** Report key -> audit id, matching the structure the Phase 1 brief names. */
export const REPORT_KEYS = Object.freeze({
  discovery: "discovery",
  titles: "titles",
  descriptions: "descriptions",
  canonicals: "canonicals",
  h1: "h1",
  headings: "headings",
  robots: "robots",
  sitemap: "sitemap",
  structuredData: "structured-data",
  internalLinks: "internal-links",
  externalLinks: "external-links",
  images: "images",
  indexability: "indexability",
  duplicateSignals: "duplicate-signals",
  urlQuality: "url-quality",
  blog: "blog",
  services: "services",
});

export function buildRunSummary({ crawl, discovery, auditResults }) {
  const allFindings = auditResults.flatMap((result) => result.findings);
  const tally = tallyBySeverity(allFindings);

  const discoverySummary = findSummary(auditResults, "discovery");
  const indexabilitySummary = findSummary(auditResults, "indexability");

  return {
    totalPages: crawl.pages.length,
    indexablePages: indexabilitySummary ? indexabilitySummary.indexable : 0,
    noindexPages: indexabilitySummary ? indexabilitySummary.noindex : 0,
    excludedPages: discoverySummary ? discoverySummary.excludedPages : 0,
    errors: tally[SEVERITY.ERROR],
    warnings: tally[SEVERITY.WARNING],
    infos: tally[SEVERITY.INFO],
    unverified: tally[SEVERITY.UNVERIFIED],
    passes: tally[SEVERITY.PASS],
    totalFindings: allFindings.length,
    auditsRun: auditResults.length,
    crawl: {
      seedCount: crawl.stats.seedCount,
      pagesFetched: crawl.stats.pagesFetched,
      htmlPages: crawl.stats.htmlPages,
      linkOnlyPages: crawl.stats.linkOnlyPages,
      skipped: crawl.stats.skippedCount,
      pageCapReached: crawl.capReached,
      robotsStatus: crawl.robots ? crawl.robots.status : 0,
      sitemapStatus: crawl.sitemap.primary ? crawl.sitemap.primary.status : 0,
      sitemapUrls: crawl.sitemap.urls.length,
      networkEnabled: crawl.networkEnabled,
      httpRequests: undefined,
    },
    sourceInventory: {
      routesDerivedFromSource: discovery.counts.candidateRoutes,
      pageFiles: discovery.counts.pageFiles,
      blogPosts: discovery.counts.blogPosts,
      servicePages: discovery.counts.servicePages,
      publishedProjects: discovery.counts.publishedProjects,
      excludedRoutes: discovery.counts.excludedRoutes,
    },
    auditsByTally: auditResults.map((result) => ({
      id: result.id,
      name: result.name,
      errors: result.tally[SEVERITY.ERROR],
      warnings: result.tally[SEVERITY.WARNING],
      infos: result.tally[SEVERITY.INFO],
      unverified: result.tally[SEVERITY.UNVERIFIED],
    })),
  };
}

function findSummary(auditResults, id) {
  const result = auditResults.find((entry) => entry.id === id);
  return result ? result.summary : null;
}

/**
 * Index the audit results by the report key names, so the JSON report has
 * exactly the `audits` block the Phase 1 brief specifies.
 */
export function indexAudits(auditResults) {
  const byId = new Map(auditResults.map((result) => [result.id, result]));
  const audits = {};

  for (const [reportKey, auditId] of Object.entries(REPORT_KEYS)) {
    const result = byId.get(auditId);
    if (!result) {
      audits[reportKey] = {
        id: auditId,
        name: auditId,
        ran: false,
        note: "This audit did not run in this invocation.",
        tally: { ERROR: 0, WARNING: 0, INFO: 0, UNVERIFIED: 0, PASS: 0 },
        summary: {},
        findings: [],
        observations: [],
      };
      continue;
    }
    audits[reportKey] = { ...result, ran: true };
  }

  return audits;
}

/** Everything the auditor could not determine, gathered for the report. */
export function collectUnverified(auditResults) {
  return auditResults
    .flatMap((result) =>
      result.findings
        .filter((finding) => finding.severity === SEVERITY.UNVERIFIED)
        .map((finding) => ({ audit: result.id, ...finding })),
    );
}

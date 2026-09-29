/**
 * AUDIT 1 - Page discovery.
 *
 * Reports what the auditor actually found, from three independent
 * viewpoints, because they answer different questions:
 *
 *   source-derived - what the project's own route files produce
 *   sitemap        - what the site tells crawlers it publishes
 *   crawled        - what responded when actually requested
 *
 * A route can appear in one and be missing from another, and only the
 * comparison is actionable.
 */

import { INDEXABILITY } from "../lib/indexability.mjs";
import { buildAuditResult, countBy, duplicatesOf, pageRef, unreachablePages } from "./shared.mjs";
import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";

const AUDIT = "discovery";

export function runDiscoveryAudit({ crawl, discovery }) {
  const findings = [];
  const observations = [];

  const pages = crawl.pages;
  const analysed = pages.filter((page) => page.doc !== null);
  const indexable = analysed.filter(
    (page) => page.indexability && page.indexability.state === INDEXABILITY.INDEXABLE,
  );
  const noindex = pages.filter(
    (page) => page.indexability && page.indexability.state === INDEXABILITY.NOINDEX,
  );
  const blocked = pages.filter(
    (page) => page.indexability && page.indexability.state === INDEXABILITY.BLOCKED,
  );
  const conflicted = pages.filter(
    (page) => page.indexability && page.indexability.state === INDEXABILITY.CONFLICT,
  );
  const unverified = pages.filter(
    (page) =>
      !page.indexability ||
      page.indexability.state === INDEXABILITY.UNVERIFIED ||
      unreachablePages({ pages: [page] }).length > 0,
  );

  const byKind = duplicatesOf(countBy(pages, (page) => page.kind)).map(([kind, count]) => ({
    kind,
    count,
  }));

  const sourceOnly = pages.filter((page) => page.fromSource && !page.fromSitemap && page.doc !== null);
  const sitemapOnly = pages.filter((page) => page.fromSitemap && !page.fromSource && page.doc !== null);
  const linkOnly = pages.filter((page) => page.source === "link");

  for (const page of sourceOnly) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.WARNING,
        code: "route-missing-from-sitemap",
        url: page.url,
        message:
          "This route exists in the project's source but was not listed in sitemap.xml, so crawlers may not discover it.",
        evidence: { path: page.path, origin: page.origin, kind: page.kind },
      }),
    );
  }

  for (const page of sitemapOnly) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.INFO,
        code: "sitemap-url-without-source-route",
        url: page.url,
        message:
          "This URL is listed in sitemap.xml but is not produced by any route file found in the project. Confirm that it is intentional and still served.",
        evidence: { path: page.path },
      }),
    );
  }

  for (const page of linkOnly) {
    observations.push({
      code: "page-discovered-by-link-only",
      ...pageRef(page),
      message: "Reached only by following an internal link; no source route or sitemap entry covers it.",
    });
  }

  if (crawl.capReached) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.WARNING,
        code: "crawl-page-cap-reached",
        message:
          "The crawl stopped at its page cap, so this inventory is incomplete. Raise the cap and re-run for a full picture.",
        evidence: { skipped: crawl.skipped.length },
      }),
    );
  }

  for (const warning of discovery.warnings) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.WARNING,
        code: `discovery-${warning.code.toLowerCase().replace(/_/g, "-")}`,
        url: warning.file || null,
        message: warning.message,
      }),
    );
  }

  for (const page of unverified) {
    if (!page.error && !page.blocked && !page.ok) continue;
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.UNVERIFIED,
        code: "page-not-verified",
        url: page.url,
        message: `This route could not be verified during the audit: ${
          page.blocked ? page.blocked.reason : page.error ? page.error.message : `HTTP ${page.status}`
        }`,
        evidence: { status: page.status, path: page.path },
      }),
    );
  }

  const summary = {
    totalPublicPages: pages.length,
    indexablePages: indexable.length,
    excludedPages: discovery.excluded.length + crawl.skipped.length,
    noindexPages: noindex.length,
    blockedPages: blocked.length,
    conflictingPages: conflicted.length,
    unverifiedPages:
      pages.length - analysed.length + unverified.filter((page) => page.doc !== null).length,
    htmlPages: analysed.length,
    sourceRoutes: discovery.counts.candidateRoutes,
    sitemapUrls: crawl.sitemap.urls.length,
    blogPosts: discovery.counts.blogPosts,
    servicePages: discovery.counts.servicePages,
    publishedProjects: discovery.counts.publishedProjects,
    discoveredByKind: byKind,
    excluded: discovery.excluded,
    skipped: crawl.skipped,
  };

  return buildAuditResult({
    id: "discovery",
    name: "Page discovery",
    description: "Inventory of public routes, indexability state and how each page was discovered.",
    findings,
    summary,
    observations,
  });
}

/**
 * AUDIT 8 - sitemap.xml.
 *
 * The interesting findings come from three way comparisons:
 *
 *   source routes  vs  sitemap URLs   -> a route exists but is not listed
 *   sitemap URLs   vs  crawled pages  -> a listed URL is not there or is not indexable
 *   crawled pages  vs  sitemap URLs   -> an indexable page was never listed
 *
 * Severity mapping:
 *   ERROR      - an indexable page is missing from the sitemap, or the
 *                sitemap could not be parsed at all
 *   WARNING    - a sitemap URL is not indexable, 404s, is duplicated, or
 *                is under an excluded prefix
 *   INFO       - informational counts and minor inconsistencies
 *   UNVERIFIED - the sitemap could not be retrieved
 */

import { INDEXABILITY } from "../lib/indexability.mjs";
import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages, indexablePages } from "./shared.mjs";
import { canonicalForm, isExcludedPath, normalizePathname } from "../lib/url-utils.mjs";
import { EXCLUDED_ROUTE_PREFIXES } from "../lib/paths.mjs";
import { groupByLastModified } from "../lib/sitemap-parse.mjs";

const AUDIT = "sitemap";

export function runSitemapAudit({ crawl }) {
  const findings = [];
  const observations = [];
  const primary = crawl.sitemap.primary;
  const pages = analysedPages(crawl);
  const indexable = indexablePages(crawl);

  const sitemapUrls = crawl.sitemap.urls.slice();
  const sitemapNormalised = new Map();

  for (const raw of sitemapUrls) {
    let url;
    try {
      url = new URL(raw, crawl.origin);
    } catch {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "sitemap-malformed-url",
          url: raw,
          message: `The sitemap contains an entry that is not a valid URL: "${raw}".`,
        }),
      );
      continue;
    }

    const key = canonicalForm(url);
    const existing = sitemapNormalised.get(key);
    if (existing) {
      existing.count += 1;
      existing.raw.push(raw);
      continue;
    }
    sitemapNormalised.set(key, { url, key, raw: [raw], count: 1 });
  }

  if (!primary) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.UNVERIFIED,
        code: "sitemap-not-retrieved",
        url: `${crawl.origin}/sitemap.xml`,
        message: "No sitemap was retrieved, so sitemap coverage could not be checked.",
      }),
    );
    return buildAuditResult({
      id: AUDIT,
      name: "sitemap.xml",
      description: "Sitemap retrieval, validity, coverage and URL consistency.",
      findings,
      summary: { retrieved: false, sitemapUrls: 0, indexableUrls: indexable.length },
    });
  }

  if (primary.blocked) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.UNVERIFIED,
        code: "sitemap-fetch-blocked",
        url: primary.url,
        message: `The request for the sitemap was refused by the auditor's own safety guard: ${primary.blocked.reason}`,
      }),
    );
  } else if (primary.error) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.UNVERIFIED,
        code: "sitemap-fetch-failed",
        url: primary.url,
        message: `The sitemap could not be retrieved (${primary.error.code}: ${primary.error.message}).`,
      }),
    );
  } else if (!primary.ok) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.ERROR,
        code: "sitemap-unexpected-status",
        url: primary.url,
        message: `The sitemap returned HTTP ${primary.status}, so crawlers cannot read it.`,
        evidence: { status: primary.status, contentType: primary.contentType },
      }),
    );
  } else if (primary.parsed && primary.parsed.errors.length > 0) {
    for (const error of primary.parsed.errors) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "sitemap-invalid-xml",
          url: primary.url,
          message: `The sitemap could not be parsed: ${error}`,
          evidence: { contentType: primary.contentType, bytes: primary.bytes },
        }),
      );
    }
  }

  for (const document of crawl.sitemap.documents) {
    if (document.bodyTruncated) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "sitemap-truncated",
          url: document.url,
          message:
            "The sitemap exceeded the auditor's byte ceiling and was truncated, so this coverage check may be incomplete.",
          evidence: { bytes: document.bytes },
        }),
      );
    }
  }

  for (const [key, entry] of sitemapNormalised) {
    if (entry.count > 1) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "sitemap-duplicate-url",
          url: key,
          message: `This URL appears ${entry.count} times in the sitemap. Duplicate entries waste crawl budget and signal a generator problem.`,
          actual: entry.count,
          evidence: { occurrences: entry.raw },
        }),
      );
    }
  }

  const sitemapByKey = new Map();
  for (const [key, entry] of sitemapNormalised) {
    sitemapByKey.set(key, entry);
  }

  const indexableKeys = new Set(indexable.map((page) => canonicalForm(new URL(page.url))));
  const analysedByKey = new Map(pages.map((page) => [canonicalForm(new URL(page.url)), page]));

  const missingFromSitemap = indexable.filter(
    (page) => !sitemapByKey.has(canonicalForm(new URL(page.url))),
  );

  for (const page of missingFromSitemap) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.ERROR,
        code: "sitemap-missing-indexable-page",
        url: page.url,
        message:
          "This page is indexable but is not listed in sitemap.xml, so it relies entirely on internal links to be discovered.",
        evidence: { path: page.path, kind: page.kind, source: page.source },
      }),
    );
  }

  for (const [key, entry] of sitemapByKey) {
    if (indexableKeys.has(key)) continue;

    const page = analysedByKey.get(key);
    const path = normalizePathname(entry.url.pathname);

    if (isExcludedPath(path, EXCLUDED_ROUTE_PREFIXES)) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "sitemap-includes-excluded-path",
          url: key,
          message: `The sitemap lists "${path}", which is under an admin, API or internal prefix. Those URLs should not be advertised for indexing.`,
          evidence: { path },
        }),
      );
      continue;
    }

    if (!page) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.INFO,
          code: "sitemap-unexpected-url",
          url: key,
          message:
            "The sitemap lists this URL but it was not reached during the crawl, so its status could not be confirmed.",
        }),
      );
      continue;
    }

    const state = page.indexability ? page.indexability.state : "UNKNOWN";

    if (!page.ok) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "sitemap-lists-failing-url",
          url: page.url,
          message: `The sitemap lists this URL but it returned HTTP ${page.status}. A sitemap must not advertise URLs that fail.`,
          evidence: { status: page.status, error: page.error },
        }),
      );
      continue;
    }

    if (state === INDEXABILITY.NOINDEX || state === INDEXABILITY.CONFLICT) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "sitemap-lists-noindex-url",
          url: page.url,
          message:
            "The sitemap lists this URL but it is not indexable. Listing a noindex URL wastes crawl budget and sends a contradictory signal.",
          evidence: {
            indexability: state,
            reasons: page.indexability ? page.indexability.reasons : [],
            canonicalTarget: page.indexability ? page.indexability.canonicalTarget : null,
          },
        }),
      );
      continue;
    }

    if (state === INDEXABILITY.BLOCKED) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "sitemap-lists-robots-blocked-url",
          url: page.url,
          message: "The sitemap lists a URL that robots.txt disallows.",
          evidence: { rule: page.indexability.robotsRule },
        }),
      );
      continue;
    }

    if (state === INDEXABILITY.UNVERIFIED) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.UNVERIFIED,
          code: "sitemap-url-unverified",
          url: page.url,
          message: "This sitemap URL could not be verified during the audit.",
        }),
      );
    }
  }

  const canonicalMismatches = [];
  for (const [key, entry] of sitemapByKey) {
    const page = analysedByKey.get(key);
    if (!page || !page.headInfo || page.headInfo.canonicalHrefs.length === 0) continue;
    const canonical = page.indexability ? page.indexability.canonicalTarget : null;
    if (!canonical) continue;
    if (canonical !== key) {
      canonicalMismatches.push({ sitemapUrl: key, canonical, path: entry.url.pathname });
    }
  }

  for (const mismatch of canonicalMismatches) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.INFO,
        code: "sitemap-canonical-inconsistency",
        url: mismatch.sitemapUrl,
        message: `The sitemap lists this URL but the page declares ${mismatch.canonical} as its canonical. Prefer listing the canonical URL itself.`,
        expected: mismatch.canonical,
        actual: mismatch.sitemapUrl,
      }),
    );
  }

  observations.push({
    code: "sitemap-summary",
    url: primary.url,
    kind: primary.parsed ? primary.parsed.kind : "unknown",
    count: sitemapUrls.length,
    uniqueCount: sitemapNormalised.size,
    nestedSitemaps: crawl.sitemap.nested,
    lastModifiedGroups: primary.parsed ? groupByLastModified(primary.parsed) : [],
  });

  return buildAuditResult({
    id: AUDIT,
    name: "sitemap.xml",
    description: "Sitemap retrieval, validity, coverage and URL consistency.",
    findings,
    summary: {
      sitemapUrlCount: sitemapUrls.length,
      uniqueSitemapUrlCount: sitemapNormalised.size,
      discoveredIndexableUrlCount: indexable.length,
      discoveredAnalysedPageCount: pages.length,
      missingFromSitemap: missingFromSitemap.map((page) => page.path),
      sitemapUrlsNotIndexable: [...sitemapByKey.keys()].filter((key) => !indexableKeys.has(key)).length,
      duplicateSitemapUrls: [...sitemapNormalised.values()].filter((entry) => entry.count > 1).length,
      canonicalInconsistencies: canonicalMismatches.length,
      nestedSitemaps: crawl.sitemap.nested,
      usedDefaultSitemapPath: crawl.sitemap.usedDefaultPath,
    },
    observations,
  });
}

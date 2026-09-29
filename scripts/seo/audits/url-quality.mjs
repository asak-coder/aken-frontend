/**
 * AUDIT 15 - URL quality.
 *
 * Checks the public URL space for the mechanical problems that create
 * duplicate addresses or expose internal surfaces:
 *
 *   - malformed or unparseable paths
 *   - accidental query parameters on a page URL
 *   - tracking parameters attached to internal links
 *   - uppercase path segments, which create a second spelling of the path
 *   - trailing-slash variants of the same path
 *   - obvious temporary or test-looking paths
 *   - admin and API paths reachable as public URLs
 *
 * Severity mapping:
 *   ERROR      - an admin, API or internal path is reachable and looks public
 *   WARNING    - a tracking parameter, an uppercase segment, a
 *                trailing-slash variant, or a temporary-looking path
 *   INFO       - any other non-canonical query parameter
 *   UNVERIFIED - the URL could not be evaluated
 *
 * The auditor never rewrites a URL.
 */

import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages } from "./shared.mjs";
import { EXCLUDED_ROUTE_PREFIXES } from "../lib/paths.mjs";
import {
  classifyRouteKind,
  isExcludedPath,
  normalizePathname,
  trackingParamsPresent,
} from "../lib/url-utils.mjs";

const AUDIT = "url-quality";

const TEMPORARY_PATTERNS = [
  /^\/test/i,
  /^\/tmp/i,
  /^\/temp/i,
  /^\/draft/i,
  /^\/untitled/i,
  /^\/new-page/i,
  /-copy(-\d+)?$/i,
  /-v\d+$/i,
  /^\/sample/i,
  /^\/demo/i,
  /^\/preview/i,
];

const ALLOWED_QUERY_KEYS = new Set(["page", "q", "category", "tag"]);

export function runUrlQualityAudit({ crawl }) {
  const findings = [];
  const observations = [];
  const pages = analysedPages(crawl);

  const byPathVariant = new Map();

  for (const page of crawl.pages) {
    let url = null;
    try {
      url = new URL(page.url);
    } catch {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "url-unparseable",
          url: page.url,
          message: "This crawled URL could not be parsed, which means the discovered address is malformed.",
          actual: page.url,
        }),
      );
      continue;
    }

    const path = normalizePathname(url.pathname);

    if (isExcludedPath(path, EXCLUDED_ROUTE_PREFIXES)) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: page.ok ? SEVERITY.ERROR : SEVERITY.INFO,
          code: "url-excluded-path-reachable",
          url: page.url,
          message: page.ok
            ? `This URL is under an admin, API or internal prefix and returned HTTP ${page.status}. Such paths must not be part of the public, indexable URL space.`
            : `This URL is under an admin, API or internal prefix (HTTP ${page.status}). It is correctly not public, but confirm it is also disallowed in robots.txt and protected by authentication.`,
          evidence: { path, status: page.status, kind: classifyRouteKind(path) },
        }),
      );
      continue;
    }

    if (url.search && url.search.length > 1) {
      const params = [...url.searchParams.keys()];
      const tracking = trackingParamsPresent(url);
      const unexpected = params.filter(
        (key) => !tracking.includes(key) && !ALLOWED_QUERY_KEYS.has(key.toLowerCase()),
      );

      findings.push(
        createFinding({
          audit: AUDIT,
          severity: tracking.length > 0 ? SEVERITY.WARNING : SEVERITY.INFO,
          code: tracking.length > 0 ? "url-tracking-parameters" : "url-query-variant",
          url: page.url,
          message:
            tracking.length > 0
              ? `This URL was reached with tracking parameters (${tracking.join(", ")}). Tracking parameters should never be part of a crawler-facing address.`
              : `This URL carries query parameters (${params.join(", ")}). Confirm this is a deliberate, canonical address rather than an accidental variant.`,
          evidence: { search: url.search, tracking, unexpected, path },
        }),
      );
    }

    const rawPath = url.pathname;
    if (rawPath.length > 1 && rawPath.endsWith("/")) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "url-trailing-slash",
          url: page.url,
          message: `This URL ends with a trailing slash while the rest of the site does not use one. Two spellings of the same path split signals and force redirects.`,
          expected: `${url.origin}${path}`,
          actual: page.url,
        }),
      );
    }

    if (/[A-Z]/.test(rawPath)) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "url-uppercase-segment",
          url: page.url,
          message: `This URL contains an uppercase character in its path ("${rawPath}"). Paths are case-sensitive, so /Foo and /foo can be treated as two different pages.`,
          evidence: { pathname: rawPath },
        }),
      );
    }

    for (const pattern of TEMPORARY_PATTERNS) {
      if (pattern.test(path)) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.WARNING,
            code: "url-temporary-looking",
            url: page.url,
            message: `This path ("${path}") matches a temporary or test-like pattern. Confirm it is intended to be public and indexable.`,
            evidence: { path, pattern: String(pattern) },
          }),
        );
        break;
      }
    }

    const variantKey = path.toLowerCase();
    const variant = byPathVariant.get(variantKey) || { paths: new Set(), urls: new Set() };
    variant.paths.add(path);
    variant.urls.add(page.url);
    byPathVariant.set(variantKey, variant);

    observations.push({
      code: "url",
      url: page.url,
      path,
      kind: page.kind,
      search: url.search || "",
      indexability: page.indexability ? page.indexability.state : "UNKNOWN",
      status: page.status,
    });
  }

  for (const [variantKey, variant] of byPathVariant) {
    if (variant.paths.size > 1) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "url-duplicate-variant",
          url: [...variant.urls][0],
          message: `The same path appears with different capitalisation or slash forms. Each spelling is a distinct URL to a crawler.`,
          evidence: { paths: [...variant.paths], urls: [...variant.urls], variantKey },
        }),
      );
    }
  }

  const queryParamFrequency = new Map();
  for (const page of pages) {
    try {
      const url = new URL(page.url);
      for (const key of url.searchParams.keys()) {
        queryParamFrequency.set(key, (queryParamFrequency.get(key) || 0) + 1);
      }
    } catch {
      continue;
    }
  }

  return buildAuditResult({
    id: AUDIT,
    name: "URL quality",
    description:
      "Malformed paths, accidental query parameters, case and slash variants, temporary-looking paths and internal-path exposure.",
    findings,
    summary: {
      urlsChecked: crawl.pages.length,
      parsedPages: observations.length,
      urlsWithQuery: observations.filter((entry) => entry.search !== "").length,
      uppercasePaths: observations.filter((entry) => /[A-Z]/.test(entry.path)).length,
      temporaryLooking: findings.filter((finding) => finding.code === "url-temporary-looking").length,
      duplicateVariants: findings.filter((finding) => finding.code === "url-duplicate-variant").length,
      excludedPathsReachable: findings.filter((finding) => finding.code === "url-excluded-path-reachable").length,
      queryParametersSeen: [...queryParamFrequency.entries()]
        .map(([parameter, count]) => ({ parameter, count }))
        .sort((left, right) => right.count - left.count),
      excludedPrefixes: EXCLUDED_ROUTE_PREFIXES,
      note: "The auditor never rewrites a URL. Every finding states the measured problem and leaves the decision to a human.",
    },
    observations,
  });
}

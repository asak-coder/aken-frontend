/**
 * Every tunable the AKEN SEO auditor uses, in one place.
 *
 * Nothing in this file changes the website. It only decides how the
 * read-only auditor interprets what it fetches.
 */

import { FRONTEND_ROOT } from "./paths.mjs";

/** The only host the auditor treats as "our own site". */
export const SITE = Object.freeze({
  productionOrigin: "https://aken.firm.in",
  productionHost: "aken.firm.in",
  /** Redirected to productionHost by next.config.mjs; reported, not crawled. */
  alternateHost: "www.aken.firm.in",
});

/**
 * Thresholds are bands recommended by mainstream technical SEO guidance.
 * They are deliberately advisory:
 *   - a value inside [min, max]            -> PASS
 *   - a value in (max, hardMax] / [hardMin, min) -> WARNING
 *   - a value beyond hardMax / below hardMin, or absent -> ERROR
 * None of these numbers is a ranking factor. They exist so the report can
 * distinguish "long" from "absent".
 */
export const THRESHOLDS = Object.freeze({
  /** Google typically renders ~580px of a title; ~60 characters is the safe band. */
  title: Object.freeze({ min: 15, max: 60, hardMax: 75, hardMin: 5 }),
  /** ~155-160 characters is the conventional meta description band. */
  description: Object.freeze({ min: 70, max: 160, hardMax: 220, hardMin: 40 }),
  /** Word counts. Only used for the thin-content advisory. */
  content: Object.freeze({ thinPageWords: 180 }),
  /** Jaccard similarity of 5-word shingles above which pages look duplicated. */
  duplicateSimilarity: 0.8,
  /** Minimum shingle count before a similarity comparison is meaningful. */
  duplicateMinShingles: 40,
});

/**
 * Fetch policy. Mirrors the safety limits the Phase 1 brief requires:
 * concurrency <= 4, timeout <= 10s, retries <= 2.
 */
export const FETCH_POLICY = Object.freeze({
  concurrency: 4,
  timeoutMs: 10_000,
  retries: 2,
  backoffBaseMs: 400,
  maxBackoffMs: 4_000,
  /** Minimum spacing between two requests to the audited host. */
  minHostDelayMs: 120,
  maxRedirects: 5,
  /** Hard ceiling on a single response body, so a huge file cannot exhaust memory. */
  maxResponseBytes: 3 * 1024 * 1024,
  /** Cap for the external-link probe and image probe bodies. */
  maxProbeBytes: 64 * 1024,
  userAgent:
    "AKENSEOAudit/1.0 (read-only technical audit; +https://aken.firm.in)",
});

/** Run-level caps so one audit can never become a load test. */
export const RUN_LIMITS = Object.freeze({
  maxPages: 300,
  maxCrawledHtmlPages: 200,
  maxInternalLinkProbes: 400,
  maxExternalLinkProbes: 60,
  maxImageProbes: 60,
});

export const DEFAULTS = Object.freeze({
  baseUrl: process.env.SEO_AUDIT_BASE_URL || SITE.productionOrigin,
  noNetwork: false,
  jsonFileName: "seo-audit-latest.json",
  markdownFileName: "SEO_AUDIT_REPORT.md",
  /** Keeps the JSON report readable while still machine-parseable. */
  jsonIndent: 2,
  sourceRoot: FRONTEND_ROOT,
});

/**
 * Files inside the repo that declare the public route surface. Read only.
 */
export const SOURCE_ROUTE_FILES = Object.freeze({
  sitemap: "src/app/sitemap.ts",
  robots: "src/app/robots.ts",
  blogIndex: "src/lib/blog-data.ts",
  blogPostDirectory: "src/lib/blog-data/posts",
  projectsData: "src/lib/projects/projects-data.ts",
  serviceDirectory: "src/app/services",
});

/** Exit codes agreed for `npm run seo:audit`. */
export const EXIT_CODES = Object.freeze({
  NO_ERRORS: 0,
  SEO_ERRORS_FOUND: 1,
  AUDITOR_FAILED: 2,
});

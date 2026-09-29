#!/usr/bin/env node
/**
 * AKEN SEO Autopilot - Phase 1 entry point.
 *
 * Pipeline:
 *   1. discover routes from the project source
 *   2. crawl the live site (robots.txt, sitemap, pages, link graph)
 *   3. run every audit once
 *   4. write the JSON and Markdown reports under reports/seo/
 *   5. exit with a useful status code
 *
 * Exit codes:
 *   0  audit completed with no ERROR findings
 *   1  audit completed and produced ERROR findings
 *   2  the auditor itself failed
 *
 * Warnings never cause a non-zero exit. UNVERIFIED never causes a non-zero
 * exit either: the auditor must not report the site as broken because the
 * auditor could not see it.
 *
 * This command is NEVER imported by application code. It must not be
 * invoked from middleware, a page, a layout or a server component: the
 * audit belongs to an operator running it deliberately.
 */

import process from "node:process";

import { resolveBaseUrl, parseArgs, USAGE } from "./lib/cli-args.mjs";
import { EXIT_CODES } from "./lib/config.mjs";
import { REPORTS_DIR } from "./lib/paths.mjs";
import { createHttpClient } from "./lib/http-client.mjs";
import { checkSafeTarget } from "./lib/ssrf-guard.mjs";
import { discoverSourceRoutes } from "./lib/route-discovery.mjs";
import { crawlSite } from "./lib/site-crawl.mjs";
import { runAllAudits } from "./audits/index.mjs";
import { buildJsonReport } from "./report/json-report.mjs";
import { buildMarkdownReport } from "./report/markdown-report.mjs";
import { assertReportLocationIsPrivate, writeReports } from "./report/write-reports.mjs";
import { hasErrors } from "./lib/severity.mjs";

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const log = options.quiet ? () => {} : (message) => console.log(message);

  if (options.help) {
    console.log(USAGE);
    return EXIT_CODES.NO_ERRORS;
  }

  if (options.errors.length > 0) {
    for (const error of options.errors) console.error(`error: ${error}`);
    console.error("");
    console.error(USAGE);
    return EXIT_CODES.AUDITOR_FAILED;
  }

  const startedAt = Date.now();
  const timestamp = new Date().toISOString();
  const runId = createRunId(timestamp);

  const baseUrl = resolveBaseUrl(options);
  const reportsDirectory = assertReportLocationIsPrivate(options.reportsDir || REPORTS_DIR);

  log(`AKEN SEO audit ${runId}`);
  log(`  base URL        : ${baseUrl.toString()}`);
  log(`  reports         : ${reportsDirectory}`);
  log(`  network         : ${options.noNetwork ? "DISABLED (configuration-only run)" : "enabled"}`);

  if (!options.noNetwork) {
    const safety = await checkSafeTarget(baseUrl);
    if (!safety.safe) {
      console.error("");
      console.error(`error: refusing to audit ${baseUrl.toString()}`);
      console.error(`       ${safety.reason}`);
      console.error("");
      console.error(
        "The auditor will not contact a host that resolves to a private, loopback, link-local or cloud-metadata address, regardless of how it is spelled.",
      );
      return EXIT_CODES.AUDITOR_FAILED;
    }
  }

  const discovery = discoverSourceRoutes();
  log(
    `  source routes   : ${discovery.counts.candidateRoutes} (${discovery.counts.pageFiles} page files, ${discovery.counts.blogPosts} blog, ${discovery.counts.servicePages} services, ${discovery.counts.publishedProjects} projects)`,
  );

  const client = createHttpClient({
    allowNetwork: !options.noNetwork,
    concurrency: 4,
    timeoutMs: 10_000,
    retries: 2,
  });

  const crawl = await crawlSite({
    baseUrl,
    client,
    discovery,
    limits: {
      maxPages: options.maxPages,
      maxSitemaps: options.maxSitemaps,
      includeLinkedPages: options.includeLinkedPages,
    },
  });

  log(
    `  crawled         : ${crawl.pages.length} pages (${crawl.stats.htmlPages} HTML, ${crawl.stats.linkOnlyPages} found by link)`,
  );
  log(`  robots.txt      : HTTP ${crawl.robots ? crawl.robots.status : 0}`);
  log(`  sitemap.xml     : HTTP ${crawl.sitemap.primary ? crawl.sitemap.primary.status : 0}, ${crawl.sitemap.urls.length} URLs`);
  log(`  http requests   : ${client.counters.requests} (${client.counters.retries} retries, ${client.counters.blocked} blocked)`);
  log("");
  log("Running audits:");

  const auditResults = await runAllAudits(
    { crawl, discovery, client, options },
    log,
  );

  const durationMs = Date.now() - startedAt;

  const jsonReport = buildJsonReport({
    runId,
    timestamp,
    baseUrl: baseUrl.toString(),
    crawl,
    discovery,
    auditResults,
    options,
  });

  const markdown = buildMarkdownReport({
    runId,
    timestamp,
    baseUrl: baseUrl.toString(),
    crawl,
    discovery,
    auditResults,
    durationMs,
  });

  const written = writeReports({
    jsonReport,
    markdown,
    directory: reportsDirectory,
    options: {
      jsonFileName: options.jsonFileName,
      markdownFileName: options.markdownFileName,
    },
  });

  const findings = auditResults.flatMap((result) => result.findings);
  const errors = findings.filter((finding) => finding.severity === "ERROR").length;
  const warnings = findings.filter((finding) => finding.severity === "WARNING").length;
  const unverified = findings.filter((finding) => finding.severity === "UNVERIFIED").length;

  log("");
  log(`Wrote ${written.jsonPath}`);
  log(`Wrote ${written.markdownPath}`);
  log("");
  log(`Result: ${crawl.pages.length} pages, ${errors} errors, ${warnings} warnings, ${unverified} unverified.`);
  log(`Duration: ${(durationMs / 1000).toFixed(1)}s`);

  if (hasErrors(findings)) {
    log("");
    log("Exiting with status 1: ERROR findings were produced.");
    return EXIT_CODES.SEO_ERRORS_FOUND;
  }

  return EXIT_CODES.NO_ERRORS;
}

/**
 * A run identifier that sorts chronologically and is unique per invocation:
 * timestamp to the second, plus a short random suffix so two runs in the
 * same second do not collide.
 */
function createRunId(timestamp) {
  const compact = timestamp.replace(/[:.]/g, "-");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `seo-${compact}-${suffix}`;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error("");
    console.error("The auditor failed and did not complete.");
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = EXIT_CODES.AUDITOR_FAILED;
  });

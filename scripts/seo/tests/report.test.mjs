/**
 * TEST 15 - Report generation.
 *
 * This is the integration test for the whole pipeline: it builds a realistic
 * crawl, runs all seventeen audits through the real registry, renders both
 * reports and writes them to a temporary directory.
 *
 * It also asserts the two contract details the Phase 1 brief pins down: the
 * JSON `audits` block uses the required key names, and the Markdown report
 * contains the required section headings in order.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { makeCrawl, makeDiscovery, makePage, makeStubClient, TEST_ORIGIN } from "./helpers.mjs";
import { runAllAudits } from "../audits/index.mjs";
import { buildJsonReport } from "../report/json-report.mjs";
import { buildMarkdownReport } from "../report/markdown-report.mjs";
import { assertReportLocationIsPrivate, writeReports } from "../report/write-reports.mjs";

const RUN_ID = "seo-test-run-0001";
const TIMESTAMP = "2026-09-27T00:00:00.000Z";
const BASE_URL = `${TEST_ORIGIN}/`;

/** Report keys the Phase 1 brief specifies. */
const REQUIRED_AUDIT_KEYS = [
  "discovery",
  "titles",
  "descriptions",
  "canonicals",
  "h1",
  "headings",
  "robots",
  "sitemap",
  "structuredData",
  "internalLinks",
  "externalLinks",
  "images",
  "indexability",
  "duplicateSignals",
  "urlQuality",
  "blog",
  "services",
];

/** Section headings the Phase 1 brief specifies, in the order it lists them. */
const REQUIRED_SECTIONS = [
  "## Executive Summary",
  "## Page Inventory",
  "## Critical Errors",
  "## Warnings",
  "## Metadata",
  "## Canonicals",
  "## Heading Structure",
  "## Robots",
  "## Sitemap",
  "## Structured Data",
  "## Internal Links",
  "## External Links",
  "## Images",
  "## Indexability",
  "## Blog Health",
  "## Service Page Health",
  "## Recommended Actions",
];

const DESCRIPTION =
  "AKEN fabricates and erects pre-engineered buildings and structural steel across eastern India.";

function homePage() {
  return makePage({
    path: "/",
    html: `<!doctype html><html lang="en"><head>
      <title>AKEN | Pre-Engineered Buildings and Structural Steel</title>
      <meta name="description" content="${DESCRIPTION}">
      <link rel="canonical" href="${TEST_ORIGIN}/">
    </head><body>
      <main>
        <h1>Pre-engineered buildings and structural steel</h1>
        <p>AKEN fabricates and erects industrial structures across eastern India with in-house engineering, fabrication and erection teams working to a documented quality programme.</p>
        <img src="/projects/peb-shed-erection.jpg" alt="A pre-engineered building frame being erected" width="1200" height="675">
        <a href="/about">About AKEN</a>
      </main>
    </body></html>`,
  });
}

function aboutPage() {
  return makePage({
    path: "/about",
    html: `<!doctype html><html lang="en"><head>
      <title>About AKEN | Steel Fabrication and EPC Contractor</title>
      <meta name="description" content="${DESCRIPTION}">
      <link rel="canonical" href="${TEST_ORIGIN}/about">
    </head><body>
      <main><h1>About AKEN</h1><p>An engineering and fabrication contractor serving industrial clients.</p></main>
    </body></html>`,
  });
}

async function buildAuditResults() {
  const crawl = makeCrawl({
    pages: [homePage(), aboutPage()],
    sitemapUrls: [`${TEST_ORIGIN}/`, `${TEST_ORIGIN}/about`],
  });

  const discovery = makeDiscovery({ candidates: [{ path: "/" }, { path: "/about" }] });

  const client = makeStubClient(async () => ({
    status: 200,
    ok: true,
    contentType: "text/html",
    headers: {},
    body: "",
  }));

  const auditResults = await runAllAudits({ crawl, discovery, client, options: {} });
  return { crawl, discovery, auditResults };
}

function renderJson(crawl, discovery, auditResults) {
  return buildJsonReport({
    runId: RUN_ID,
    timestamp: TIMESTAMP,
    baseUrl: BASE_URL,
    crawl,
    discovery,
    auditResults,
    options: {},
  });
}

function renderMarkdown(crawl, discovery, auditResults) {
  return buildMarkdownReport({
    runId: RUN_ID,
    timestamp: TIMESTAMP,
    baseUrl: BASE_URL,
    crawl,
    discovery,
    auditResults,
    durationMs: 1234,
  });
}

test("every audit runs to completion without throwing", async () => {
  const { auditResults } = await buildAuditResults();

  assert.equal(auditResults.length, REQUIRED_AUDIT_KEYS.length);

  const thrown = auditResults.flatMap((result) =>
    result.findings.filter((finding) => finding.code === "audit-threw"),
  );

  assert.equal(
    thrown.length,
    0,
    `no audit should throw, but these did: ${thrown.map((finding) => finding.message).join(" | ")}`,
  );
});

test("the JSON report carries the required top-level shape", async () => {
  const { crawl, discovery, auditResults } = await buildAuditResults();
  const report = renderJson(crawl, discovery, auditResults);

  assert.equal(report.runId, RUN_ID);
  assert.equal(report.timestamp, TIMESTAMP);
  assert.equal(report.baseUrl, BASE_URL);

  assert.equal(report.mode.readOnly, true);
  assert.equal(report.mode.websiteModified, false);
  assert.equal(report.mode.deploymentTriggered, false);

  assert.ok(report.environment, "the environment block is required");
  assert.equal(report.environment.productionHost, "aken.firm.in");

  assert.ok(report.summary, "the summary block is required");
  assert.equal(typeof report.summary.errors, "number");
  assert.equal(typeof report.summary.warnings, "number");
  assert.equal(typeof report.summary.unverified, "number");

  assert.ok(Array.isArray(report.limitations) && report.limitations.length > 0);
  assert.ok(report.policies && report.policies.ssrfProtection);
});

test("the JSON audits block uses exactly the required key names", async () => {
  const { crawl, discovery, auditResults } = await buildAuditResults();
  const report = renderJson(crawl, discovery, auditResults);

  for (const key of REQUIRED_AUDIT_KEYS) {
    assert.ok(key in report.audits, `the audits block must contain "${key}"`);
    assert.equal(report.audits[key].ran, true, `the "${key}" audit must be marked as run`);
    assert.ok(Array.isArray(report.audits[key].findings), `"${key}" must expose its findings`);
  }
});

test("the Markdown report contains every required section heading in order", async () => {
  const { crawl, discovery, auditResults } = await buildAuditResults();
  const markdown = renderMarkdown(crawl, discovery, auditResults);

  assert.ok(markdown.startsWith("# AKEN SEO AUDIT"), "the document must open with the title");
  assert.ok(markdown.includes(`Run timestamp: ${TIMESTAMP}`), "the timestamp must be present");

  let cursor = -1;
  for (const section of REQUIRED_SECTIONS) {
    const index = markdown.indexOf(section);
    assert.notEqual(index, -1, `the report must contain "${section}"`);
    assert.ok(index > cursor, `"${section}" must appear after the previous section`);
    cursor = index;
  }
});

test("writing the reports creates exactly the two expected files", async () => {
  const { crawl, discovery, auditResults } = await buildAuditResults();

  const jsonReport = renderJson(crawl, discovery, auditResults);
  const markdown = renderMarkdown(crawl, discovery, auditResults);

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aken-seo-test-"));

  try {
    const written = writeReports({ jsonReport, markdown, directory });

    assert.ok(fs.existsSync(written.jsonPath), "the JSON report must exist on disk");
    assert.ok(fs.existsSync(written.markdownPath), "the Markdown report must exist on disk");

    assert.deepEqual(fs.readdirSync(directory).sort(), ["SEO_AUDIT_REPORT.md", "seo-audit-latest.json"]);

    const reparsed = JSON.parse(fs.readFileSync(written.jsonPath, "utf8"));
    assert.equal(reparsed.runId, RUN_ID, "the written JSON must round-trip");

    assert.ok(written.jsonBytes > 0);
    assert.ok(written.markdownBytes > 0);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("the writer refuses to place a report anywhere under public/", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aken-seo-test-"));

  try {
    const resolved = assertReportLocationIsPrivate(directory);
    assert.equal(resolved, path.resolve(directory));

    assert.throws(
      () => assertReportLocationIsPrivate(path.join(directory, "public", "seo")),
      /public/i,
      "a path containing a public segment must be refused, because anything there is web-reachable",
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

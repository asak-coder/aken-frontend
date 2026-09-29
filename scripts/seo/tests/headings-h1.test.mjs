/**
 * TEST 4 - Duplicate H1 detection and heading structure.
 *
 * Required scenario: duplicate H1.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { makeCrawl, makePage } from "./helpers.mjs";
import { runH1Audit } from "../audits/h1.mjs";
import { runHeadingsAudit } from "../audits/headings.mjs";
import { analyseHeadingStructure } from "../lib/extract/headings.mjs";

function page(path, body) {
  return makePage({
    path,
    html: `<!doctype html><html><head><title>Title ${path}</title></head><body>${body}</body></html>`,
  });
}

test("detects an identical H1 on two indexable pages", () => {
  const crawl = makeCrawl({
    pages: [
      page("/a", "<h1>Steel Fabrication Services</h1>"),
      page("/b", "<h1>Steel Fabrication Services</h1>"),
    ],
  });

  const result = runH1Audit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "h1-duplicate");

  assert.ok(finding, "two identical H1s must be reported");
  assert.equal(finding.evidence.pages.length, 2);
});

test("reports a missing H1 in page content", () => {
  const crawl = makeCrawl({ pages: [page("/no-h1", "<h2>Only an H2</h2><p>Text</p>")] });
  const result = runH1Audit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "h1-missing");

  assert.ok(finding, "a page without an H1 must be reported");
  assert.equal(finding.severity, "ERROR");
});

test("does not count an H1 that only exists inside site chrome", () => {
  const crawl = makeCrawl({
    pages: [
      page(
        "/chrome-only",
        '<header><h1>Site name</h1></header><main><h2>Real heading</h2></main><footer><h3>Company</h3></footer>',
      ),
    ],
  });

  const result = runH1Audit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "h1-missing");

  assert.ok(finding, "an H1 in the header is not the page's H1");
  assert.equal(finding.evidence.chromeH1Count, 1);
  assert.equal(result.summary.pagesWithChromeOnlyH1, 1);
});

test("reports multiple H1 elements in content as a warning", () => {
  const crawl = makeCrawl({
    pages: [page("/two-h1", "<main><h1>First</h1><h1>Second</h1></main>")],
  });

  const result = runH1Audit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "h1-multiple");

  assert.ok(finding, "two content H1s must be reported");
  assert.equal(finding.severity, "WARNING");
  assert.equal(finding.actual, 2);
});

test("reports a heading level jump as INFO, never as an error", () => {
  const crawl = makeCrawl({
    pages: [page("/jump", "<main><h1>Title</h1><h2>Section</h2><h4>Deep</h4></main>")],
  });

  const result = runHeadingsAudit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "heading-level-skipped");

  assert.ok(finding, "a skipped level must be reported");
  assert.equal(finding.severity, "INFO");
});

test("structure analysis ignores chrome headings and reports duplicates within a page", () => {
  const structure = analyseHeadingStructure([
    { level: 1, text: "Title" },
    { level: 2, text: "Section" },
    { level: 2, text: "Section" },
  ]);

  assert.equal(structure.h1Count, 1);
  assert.equal(structure.duplicateHeadings.length, 1);
  assert.equal(structure.jumps.length, 0);
});

test("structure analysis flags an H2 that appears before the H1", () => {
  const structure = analyseHeadingStructure([
    { level: 2, text: "Lead" },
    { level: 1, text: "Title" },
  ]);

  assert.equal(structure.h2BeforeH1, true);
});

/**
 * TEST 3 - Canonical validation.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { makeCrawl, makePage } from "./helpers.mjs";
import { runCanonicalsAudit } from "../audits/canonicals.mjs";

function page(path, canonical) {
  const link = canonical === null ? "" : `<link rel="canonical" href="${canonical}">`;
  return makePage({
    path,
    html: `<!doctype html><html><head><title>Title ${path}</title>${link}</head><body><h1>Heading</h1></body></html>`,
  });
}

test("reports a missing canonical on an indexable page as an error", () => {
  const crawl = makeCrawl({ pages: [page("/about", null)] });
  const result = runCanonicalsAudit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "canonical-missing");

  assert.ok(finding, "a missing canonical must be reported");
  assert.equal(finding.severity, "ERROR");
});

test("treats a self-referencing absolute canonical as correct", () => {
  const crawl = makeCrawl({ pages: [page("/about", "https://aken.firm.in/about")] });
  const result = runCanonicalsAudit({ crawl });

  assert.equal(result.findings.length, 0, "a correct canonical must produce no findings");
  assert.equal(result.summary.canonicalSelf, 1);
});

test("reports a relative canonical as an error", () => {
  const crawl = makeCrawl({ pages: [page("/about", "/about")] });
  const result = runCanonicalsAudit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "canonical-not-absolute");

  assert.ok(finding, "a relative canonical must be reported");
  assert.equal(finding.severity, "ERROR");
});

test("reports a canonical on the wrong hostname as an error", () => {
  const crawl = makeCrawl({ pages: [page("/about", "https://www.aken.firm.in/about")] });
  const result = runCanonicalsAudit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "canonical-wrong-host");

  assert.ok(finding, "a canonical on another host must be reported");
  assert.equal(finding.severity, "ERROR");
  assert.equal(finding.evidence.alternateHost, "www.aken.firm.in");
});

test("reports an http canonical as an error", () => {
  const crawl = makeCrawl({ pages: [page("/about", "http://aken.firm.in/about")] });
  const result = runCanonicalsAudit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "canonical-insecure-scheme");

  assert.ok(finding, "an insecure canonical must be reported");
  assert.equal(finding.severity, "ERROR");
});

test("reports two canonical elements on one page as an error", () => {
  const crawl = makeCrawl({
    pages: [
      makePage({
        path: "/double",
        html:
          '<!doctype html><html><head><title>T</title><link rel="canonical" href="https://aken.firm.in/double"><link rel="canonical" href="https://aken.firm.in/double"></head><body><h1>H</h1></body></html>',
      }),
    ],
  });

  const result = runCanonicalsAudit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "canonical-duplicated");

  assert.ok(finding, "two canonicals must be reported");
  assert.equal(finding.severity, "ERROR");
  assert.equal(finding.actual, 2);
});

test("reports a canonical pointing elsewhere on an indexable page as a warning", () => {
  const crawl = makeCrawl({ pages: [page("/blog/slug", "https://aken.firm.in/blog")] });
  const result = runCanonicalsAudit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "canonical-points-elsewhere");

  assert.ok(finding, "a canonical to another URL must be reported");
  assert.equal(finding.severity, "WARNING");
  assert.equal(finding.actual, "https://aken.firm.in/blog");
});

test("treats noindex plus a cross-page canonical as an informational consolidation", () => {
  const crawl = makeCrawl({
    pages: [
      makePage({
        path: "/blog/slug",
        html:
          '<!doctype html><html><head><title>T</title><meta name="robots" content="noindex"><link rel="canonical" href="https://aken.firm.in/blog"></head><body><h1>H</h1></body></html>',
      }),
    ],
  });

  const result = runCanonicalsAudit({ crawl });
  const finding = result.findings.find(
    (entry) => entry.code === "canonical-consolidation-with-noindex",
  );

  assert.ok(finding, "the consolidation pattern must be reported");
  assert.equal(finding.severity, "INFO");
});

test("reports a trailing-slash canonical as a warning", () => {
  const crawl = makeCrawl({ pages: [page("/about", "https://aken.firm.in/about/")] });
  const result = runCanonicalsAudit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "canonical-trailing-slash");

  assert.ok(finding, "a trailing-slash canonical must be reported");
  assert.equal(finding.severity, "WARNING");
});

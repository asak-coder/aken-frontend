/**
 * TEST 2 - Meta description handling.
 *
 * Required scenario: missing description.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { makeCrawl, makePage } from "./helpers.mjs";
import { runDescriptionsAudit } from "../audits/descriptions.mjs";

function page(path, description) {
  const meta = description === null
    ? ""
    : `<meta name="description" content="${description}">`;
  return makePage({
    path,
    html: `<!doctype html><html><head><title>Title for ${path}</title>${meta}</head><body><h1>Heading</h1></body></html>`,
  });
}

/**
 * 138 characters, deliberately inside the 70-160 advisory band so the
 * "in band" case actually exercises the band rather than the upper limit.
 */
const GOOD = "AKEN fabricates and erects pre-engineered buildings, structural steel and roofing cladding across eastern India with in-house engineering.";

test("reports a missing meta description as an error", () => {
  const crawl = makeCrawl({ pages: [page("/no-description", null)] });
  const result = runDescriptionsAudit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "description-missing");

  assert.ok(finding, "a page without a description must be flagged");
  assert.equal(finding.severity, "ERROR");
  assert.equal(result.summary.missingDescriptions, 1);
});

test("reports a too-short description as a warning", () => {
  const crawl = makeCrawl({ pages: [page("/short", "We build steel structures.")] });
  const result = runDescriptionsAudit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "description-too-short");

  assert.ok(finding, "a short description must be flagged");
  assert.equal(finding.severity, "WARNING");
});

test("accepts a description inside the advisory band", () => {
  const crawl = makeCrawl({ pages: [page("/good", GOOD)] });
  const result = runDescriptionsAudit({ crawl });

  assert.equal(result.findings.length, 0, "an in-band description must produce no findings");
  assert.equal(result.summary.missingDescriptions, 0);
});

test("reports an identical description on two indexable pages", () => {
  const crawl = makeCrawl({ pages: [page("/a", GOOD), page("/b", GOOD)] });
  const result = runDescriptionsAudit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "description-duplicate");

  assert.ok(finding, "two identical descriptions must be reported");
  assert.equal(finding.evidence.pages.length, 2);
});

test("reports duplicate description tags on one page", () => {
  const crawl = makeCrawl({
    pages: [
      makePage({
        path: "/double",
        html: `<!doctype html><html><head><title>T</title><meta name="description" content="${GOOD}"><meta name="description" content="${GOOD}"></head><body><h1>H</h1></body></html>`,
      }),
    ],
  });

  const result = runDescriptionsAudit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "multiple-description-tags");

  assert.ok(finding, "two description tags must be reported");
  assert.equal(finding.actual, 2);
});

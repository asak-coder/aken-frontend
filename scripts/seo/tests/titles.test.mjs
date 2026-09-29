/**
 * TEST 1 - Title handling.
 *
 * Covers duplicate-title detection and missing-title detection, which are
 * two of the fifteen scenarios the Phase 1 brief requires.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { makeCrawl, makePage } from "./helpers.mjs";
import { runTitlesAudit } from "../audits/titles.mjs";

const TITLE = "Structural Steel Fabrication Company in Eastern India";

function page(path, title, extra = "") {
  return makePage({
    path,
    html: `<!doctype html><html><head><title>${title}</title></head><body><h1>${title}</h1>${extra}</body></html>`,
  });
}

test("detects an identical title used on two indexable pages", () => {
  const crawl = makeCrawl({
    pages: [page("/", TITLE), page("/about", TITLE), page("/services", "Our Services")],
  });

  const result = runTitlesAudit({ crawl });
  const duplicate = result.findings.filter((finding) => finding.code === "title-duplicate");

  assert.equal(duplicate.length, 1, "exactly one duplicate group should be reported");
  assert.equal(duplicate[0].severity, "ERROR");
  assert.equal(duplicate[0].evidence.pages.length, 2);
  assert.deepEqual(
    duplicate[0].evidence.pages.sort(),
    ["/", "/about"],
    "the evidence must name every page in the group",
  );
});

test("reports a duplicate shared with a noindexed page as INFO, not as an error", () => {
  const noindexPage = makePage({
    path: "/blog/slug",
    html: `<!doctype html><html><head><title>${TITLE}</title><meta name="robots" content="noindex"></head><body><h1>Slug</h1></body></html>`,
  });

  const crawl = makeCrawl({ pages: [page("/", TITLE), noindexPage] });
  const result = runTitlesAudit({ crawl });
  const duplicate = result.findings.filter((finding) => finding.code === "title-duplicate");

  assert.equal(duplicate.length, 1, "the overlap is still worth recording");
  assert.equal(duplicate[0].severity, "INFO", "one indexable member is not an error");
  assert.deepEqual(
    duplicate[0].evidence.indexablePages,
    ["/"],
    "the evidence must separate indexable members from noindexed ones",
  );
});

test("reports a missing title as an error", () => {
  const crawl = makeCrawl({
    pages: [
      makePage({
        path: "/no-title",
        html: "<!doctype html><html><head></head><body><h1>Heading</h1></body></html>",
      }),
    ],
  });

  const result = runTitlesAudit({ crawl });
  const missing = result.findings.filter((finding) => finding.code === "title-missing");

  assert.equal(missing.length, 1);
  assert.equal(missing[0].severity, "ERROR");
  assert.equal(result.summary.missingTitles, 1);
});

test("reports a title longer than the advisory band as a warning, not an error", () => {
  const long = "A".repeat(64);
  const crawl = makeCrawl({ pages: [page("/long", long)] });
  const result = runTitlesAudit({ crawl });
  const warning = result.findings.find((finding) => finding.code === "title-too-long");

  assert.ok(warning, "a 64 character title should produce a warning");
  assert.equal(warning.severity, "WARNING");
});

test("flags multiple title elements on one page", () => {
  const crawl = makeCrawl({
    pages: [
      makePage({
        path: "/double-title",
        html: "<!doctype html><html><head><title>First</title><title>Second</title></head><body><h1>H</h1></body></html>",
      }),
    ],
  });

  const result = runTitlesAudit({ crawl });
  const finding = result.findings.find((entry) => entry.code === "multiple-title-elements");

  assert.ok(finding, "two title elements should be reported");
  assert.equal(finding.actual, 2);
});

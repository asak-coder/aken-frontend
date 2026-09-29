/**
 * TEST 9 - Noindex detection and indexability classification.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { makeCrawl, makePage, makeRobots } from "./helpers.mjs";
import { classifyIndexability, INDEXABILITY } from "../lib/indexability.mjs";
import { runIndexabilityAudit } from "../audits/indexability-audit.mjs";

function page(path, head = "") {
  return makePage({
    path,
    html: `<!doctype html><html><head><title>Title ${path}</title>${head}</head><body><h1>H</h1></body></html>`,
  });
}

test("classifies a plain page as indexable", () => {
  const record = page("/about", '<link rel="canonical" href="https://aken.firm.in/about">');
  const verdict = classifyIndexability({ page: record, robots: null });

  assert.equal(verdict.state, INDEXABILITY.INDEXABLE);
});

test("detects a meta robots noindex", () => {
  const record = page("/private", '<meta name="robots" content="noindex">');
  const verdict = classifyIndexability({ page: record, robots: null });

  assert.equal(verdict.state, INDEXABILITY.NOINDEX);
  assert.equal(verdict.noindex, true);
  assert.equal(verdict.metaRobots.value, "noindex");
});

test("detects noindex in a googlebot meta tag", () => {
  const record = page("/private", '<meta name="googlebot" content="noindex, nofollow">');
  const verdict = classifyIndexability({ page: record, robots: null });

  assert.equal(verdict.state, INDEXABILITY.NOINDEX);
  assert.equal(verdict.nofollow, true);
  assert.equal(verdict.googlebotRobots.value, "noindex, nofollow");
});

test("detects noindex in an X-Robots-Tag response header", () => {
  const record = makePage({
    path: "/private",
    headers: { "x-robots-tag": "noindex" },
  });
  const verdict = classifyIndexability({ page: record, robots: null });

  assert.equal(verdict.state, INDEXABILITY.NOINDEX);
  assert.equal(verdict.xRobotsTag.value, "noindex");
});

test("treats robots meta value `none` as noindex plus nofollow", () => {
  const record = page("/none", '<meta name="robots" content="none">');
  const verdict = classifyIndexability({ page: record, robots: null });

  assert.equal(verdict.noindex, true);
  assert.equal(verdict.nofollow, true);
});

test("classifies a page disallowed by robots.txt as BLOCKED", () => {
  const robots = makeRobots("User-agent: *\nDisallow: /admin/\n").parsed;
  const record = makePage({
    path: "/admin/login",
    kind: "admin",
  });
  const verdict = classifyIndexability({ page: record, robots });

  assert.equal(verdict.state, INDEXABILITY.BLOCKED);
  assert.equal(verdict.blockedByRobots, true);
  assert.equal(verdict.robotsRule, "Disallow: /admin/");
});

test("classifies noindex plus a cross-page canonical as CONFLICT", () => {
  const record = page(
    "/blog/slug",
    '<meta name="robots" content="noindex"><link rel="canonical" href="https://aken.firm.in/blog">',
  );
  const verdict = classifyIndexability({ page: record, robots: null });

  assert.equal(verdict.state, INDEXABILITY.CONFLICT);
  assert.equal(verdict.canonicalTarget, "https://aken.firm.in/blog");
  assert.equal(verdict.canonicalPointsElsewhere, true);
});

test("classifies an indexable page whose canonical points elsewhere as CONFLICT", () => {
  const record = page("/duplicate", '<link rel="canonical" href="https://aken.firm.in/primary">');
  const verdict = classifyIndexability({ page: record, robots: null });

  assert.equal(verdict.state, INDEXABILITY.CONFLICT);
  assert.equal(verdict.noindex, false);
});

test("returns UNVERIFIED for a page that returned HTTP 500", () => {
  const record = makePage({ path: "/broken", status: 500 });
  const verdict = classifyIndexability({ page: record, robots: null });

  assert.equal(verdict.state, INDEXABILITY.UNVERIFIED);
  assert.match(verdict.reasons[0], /HTTP 500/);
});

test("returns UNVERIFIED, quoting the cause, for a transport failure", () => {
  const record = makePage({
    path: "/unreachable",
    status: 0,
    error: { code: "TIMEOUT", message: "request timed out" },
  });
  const verdict = classifyIndexability({ page: record, robots: null });

  assert.equal(verdict.state, INDEXABILITY.UNVERIFIED);
  assert.match(verdict.reasons[0], /TIMEOUT/);
});

test("records an unrecognised robots directive without treating it as a failure", () => {
  const record = page("/about", '<meta name="robots" content="index, nosnippet, foo-directive">');
  const verdict = classifyIndexability({ page: record, robots: null });

  assert.equal(verdict.state, INDEXABILITY.INDEXABLE);
  assert.deepEqual(verdict.directiveUnknown, ["foo-directive"]);
});

test("the indexability audit reports counts per state and an informational noindex finding", () => {
  const crawl = makeCrawl({
    pages: [
      page("/about", '<link rel="canonical" href="https://aken.firm.in/about">'),
      page("/private", '<meta name="robots" content="noindex">'),
    ],
  });

  const result = runIndexabilityAudit({ crawl });

  assert.equal(result.summary.indexable, 1);
  assert.equal(result.summary.noindex, 1);
  assert.equal(result.summary.urlsChecked, 2);

  const noindexFinding = result.findings.find((finding) => finding.code === "indexability-noindex");
  assert.ok(noindexFinding);
  assert.equal(noindexFinding.severity, "INFO");
});

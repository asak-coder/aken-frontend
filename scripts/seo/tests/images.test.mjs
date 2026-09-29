/**
 * TEST 10 - Image alt-text and asset checks.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { makeCrawl, makePage, makeStubClient } from "./helpers.mjs";
import { runImagesAudit } from "../audits/images.mjs";

function page(path, body) {
  return makePage({
    path,
    html: `<!doctype html><html><head><title>Title ${path}</title></head><body>${body}</body></html>`,
  });
}

function clientReturning(response) {
  return makeStubClient(async () => ({
    status: 200,
    ok: true,
    contentType: "image/jpeg",
    headers: {},
    bytesRead: 1024,
    ...response,
  }));
}

test("reports an image with no alt attribute as an error", async () => {
  const crawl = makeCrawl({
    pages: [page("/", '<img src="/projects/peb-shed-erection.jpg" width="800" height="600">')],
  });

  const result = await runImagesAudit({ crawl, client: clientReturning({}) });
  const finding = result.findings.find((entry) => entry.code === "image-missing-alt");

  assert.ok(finding, "an img without an alt attribute must be reported");
  assert.equal(finding.severity, "ERROR");
  assert.equal(result.summary.missingAlt, 1);
});

test("treats alt=\"\" as a deliberate decorative marker, not a defect", async () => {
  const crawl = makeCrawl({
    pages: [page("/", '<img src="/projects/peb-shed-erection.jpg" alt="" width="800" height="600">')],
  });

  const result = await runImagesAudit({ crawl, client: clientReturning({}) });

  assert.equal(
    result.findings.filter((entry) => entry.code === "image-missing-alt").length,
    0,
    "alt=\"\" is intentional and must not be reported as missing alt text",
  );

  const empty = result.findings.find((entry) => entry.code === "image-empty-alt");
  assert.ok(empty, "the decorative case should still be recorded");
  assert.equal(empty.severity, "INFO");
});

test("reports a generic alt value as a warning", async () => {
  const crawl = makeCrawl({
    pages: [page("/", '<img src="/projects/peb-shed-erection.jpg" alt="image" width="800" height="600">')],
  });

  const result = await runImagesAudit({ crawl, client: clientReturning({}) });
  const finding = result.findings.find((entry) => entry.code === "image-generic-alt");

  assert.ok(finding, "a generic alt describes nothing");
  assert.equal(finding.severity, "WARNING");
});

test("reports a missing image as an error", async () => {
  const crawl = makeCrawl({
    pages: [page("/", '<img src="/projects/deleted.jpg" alt="Deleted" width="800" height="600">')],
  });

  const result = await runImagesAudit({
    crawl,
    client: clientReturning({ status: 404, ok: false }),
  });

  const finding = result.findings.find((entry) => entry.code === "image-broken");
  assert.ok(finding, "a 404 image must be reported");
  assert.equal(finding.severity, "ERROR");
  assert.equal(finding.actual, 404);
});

test("reports an unverifiable image as UNVERIFIED, never as broken", async () => {
  const crawl = makeCrawl({
    pages: [page("/", '<img src="/projects/slow.jpg" alt="Slow" width="800" height="600">')],
  });

  const result = await runImagesAudit({
    crawl,
    client: clientReturning({ status: 0, ok: false, error: { code: "TIMEOUT", message: "timed out" } }),
  });

  const finding = result.findings.find((entry) => entry.code === "image-unverified");
  assert.ok(finding, "a timeout must be reported as unverified");
  assert.equal(finding.severity, "UNVERIFIED");
});

test("protects the official AKEN logo from alt-text findings", async () => {
  const crawl = makeCrawl({
    pages: [page("/", '<img src="/logo/aken-logo.png" width="180" height="40">')],
  });

  const result = await runImagesAudit({ crawl, client: clientReturning({}) });

  assert.equal(
    result.findings.filter((entry) => entry.code === "image-missing-alt").length,
    0,
    "the logo must never be reported as a missing-alt defect",
  );
  assert.equal(result.summary.protectedLogoUsages, 1);
});

test("warns when an image has neither dimensions nor lazy loading", async () => {
  const crawl = makeCrawl({
    pages: [page("/", '<img src="/projects/peb-shed-erection.jpg" alt="A shed">')],
  });

  const result = await runImagesAudit({ crawl, client: clientReturning({}) });
  const finding = result.findings.find((entry) => entry.code === "image-without-dimensions");

  assert.ok(finding, "an unconstrained image can shift the layout");
  assert.equal(finding.severity, "WARNING");
});

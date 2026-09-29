/**
 * TEST 12 - External link timeout handling.
 *
 * The core rule under test: a transient failure is never reported as a
 * broken link. A 404 is broken; a timeout, a DNS failure or a 5xx is
 * UNVERIFIED, because the auditor did not observe that the destination is
 * gone.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { makeCrawl, makeStubClient } from "./helpers.mjs";
import { runExternalLinksAudit } from "../audits/external-links.mjs";

function pageWithLink(href) {
  return {
    path: "/",
    html: `<!doctype html><html><head><title>Home</title></head><body><h1>H</h1><a href="${href}">Outbound</a></body></html>`,
  };
}

async function auditWith(response) {
  const { makePage } = await import("./helpers.mjs");
  const crawl = makeCrawl({
    pages: [makePage(pageWithLink("https://example.com/somewhere"))],
  });
  const client = makeStubClient(async () => response);
  return runExternalLinksAudit({ crawl, client });
}

test("reports a timeout as UNVERIFIED, never as a broken link", async () => {
  const result = await auditWith({
    status: 0,
    ok: false,
    error: { code: "TIMEOUT", message: "request timed out" },
  });

  const finding = result.findings.find((entry) => entry.code === "external-link-unverified");
  assert.ok(finding, "a timeout must be reported as unverified");
  assert.equal(finding.severity, "UNVERIFIED");

  assert.equal(
    result.findings.filter((entry) => entry.code === "external-link-broken").length,
    0,
    "a timeout must never be reported as broken",
  );
});

test("reports a DNS failure as UNVERIFIED", async () => {
  const result = await auditWith({
    status: 0,
    ok: false,
    error: { code: "DNS_FAILURE", message: "getaddrinfo ENOTFOUND" },
  });

  const finding = result.findings.find((entry) => entry.code === "external-link-unverified");
  assert.ok(finding, "a DNS failure must be reported as unverified");
  assert.equal(finding.severity, "UNVERIFIED");
});

test("reports a 404 as a broken link", async () => {
  const result = await auditWith({ status: 404, ok: false, headers: {}, contentType: "text/html" });

  const finding = result.findings.find((entry) => entry.code === "external-link-broken");
  assert.ok(finding, "a 404 is definitive");
  assert.equal(finding.severity, "ERROR");
  assert.equal(finding.actual, 404);
});

test("reports a 410 as a broken link", async () => {
  const result = await auditWith({ status: 410, ok: false, headers: {} });

  const finding = result.findings.find((entry) => entry.code === "external-link-broken");
  assert.ok(finding, "a 410 is definitive");
  assert.equal(finding.severity, "ERROR");
});

test("reports a 503 as UNVERIFIED, because server errors are often temporary", async () => {
  const result = await auditWith({ status: 503, ok: false, headers: {} });

  const finding = result.findings.find((entry) => entry.code === "external-link-server-error");
  assert.ok(finding, "a 503 must be reported as unverified");
  assert.equal(finding.severity, "UNVERIFIED");

  assert.equal(
    result.findings.filter((entry) => entry.code === "external-link-broken").length,
    0,
  );
});

test("reports a 403 as a warning rather than broken, because it may be bot protection", async () => {
  const result = await auditWith({ status: 403, ok: false, headers: {} });

  const finding = result.findings.find((entry) => entry.code === "external-link-refused");
  assert.ok(finding, "a 403 may be bot protection, not a dead link");
  assert.equal(finding.severity, "WARNING");
});

test("records a reachable outbound link as an observation, not a finding", async () => {
  const result = await auditWith({ status: 200, ok: true, headers: {}, contentType: "text/html" });

  assert.equal(result.findings.length, 0, "a 200 link produces no finding");
  assert.equal(result.observations.filter((entry) => entry.code === "external-link-pass").length, 1);
  assert.equal(result.summary.uniqueExternalTargets, 1);
  assert.equal(result.summary.uniqueExternalHosts, 1);
});

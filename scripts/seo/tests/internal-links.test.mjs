/**
 * TEST 8 - Broken internal link detection.
 *
 * The crawler never reaches a link target that does not exist, so the
 * audit probes it. A stub client supplies the response, which keeps the
 * test offline and makes the expected status explicit.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { makeCrawl, makeDiscovery, makePage, makeStubClient } from "./helpers.mjs";
import { runInternalLinksAudit } from "../audits/internal-links.mjs";

const HOME = `<!doctype html><html><head><title>Home</title></head><body>
<h1>Home</h1>
<a href="/about">About</a>
<a href="/missing-page">Missing</a>
</body></html>`;

test("reports an internal link whose target returns 404", async () => {
  const pages = [
    makePage({ path: "/", html: HOME }),
    makePage({ path: "/about", html: "<!doctype html><html><head><title>About</title></head><body><h1>About</h1></body></html>" }),
  ];

  const crawl = makeCrawl({ pages });
  const discovery = makeDiscovery({ candidates: [{ path: "/" }, { path: "/about" }] });

  const client = makeStubClient(async (url) => {
    if (url.pathname === "/missing-page") {
      return { status: 404, ok: false, statusText: "Not Found", contentType: "text/html", headers: {} };
    }
    return { status: 200, ok: true, contentType: "text/html", headers: {} };
  });

  const result = await runInternalLinksAudit({ crawl, client, discovery });

  const broken = result.findings.filter(
    (finding) => finding.code === "internal-link-broken" || finding.code === "internal-link-target-unknown",
  );

  assert.equal(broken.length, 1, "exactly one broken link should be reported");
  assert.equal(broken[0].severity, "ERROR");
  assert.equal(broken[0].code, "internal-link-target-unknown");
  assert.deepEqual(broken[0].evidence.linkedFrom, ["/"]);
});

test("classifies a failing target that does exist in source as a broken link", async () => {
  const pages = [makePage({ path: "/", html: HOME })];

  const crawl = makeCrawl({ pages });
  const discovery = makeDiscovery({
    candidates: [{ path: "/" }, { path: "/missing-page" }],
  });

  const client = makeStubClient(async () => ({
    status: 500,
    ok: false,
    statusText: "Internal Server Error",
    contentType: "text/html",
    headers: {},
  }));

  const result = await runInternalLinksAudit({ crawl, client, discovery });
  const broken = result.findings.find((finding) => finding.code === "internal-link-broken");

  assert.ok(broken, "a 500 on a known route must be reported as broken");
  assert.equal(broken.evidence.status, 500);
});

test("reports a transport failure as UNVERIFIED rather than broken", async () => {
  const withExternalOnly = `<!doctype html><html><head><title>Home</title></head><body>
<h1>Home</h1><a href="/unreachable">Unreachable</a></body></html>`;

  const crawl = makeCrawl({ pages: [makePage({ path: "/", html: withExternalOnly })] });
  const discovery = makeDiscovery({ candidates: [{ path: "/" }] });

  const client = makeStubClient(async () => ({
    status: 0,
    ok: false,
    error: { code: "TIMEOUT", message: "request timed out" },
    headers: {},
  }));

  const result = await runInternalLinksAudit({ crawl, client, discovery });
  const unverified = result.findings.find((finding) => finding.code === "internal-link-unverified");

  assert.ok(unverified, "a timeout must be reported as unverified");
  assert.equal(unverified.severity, "UNVERIFIED");
});

test("reports a redirecting internal link as a warning", async () => {
  const crawl = makeCrawl({
    pages: [
      makePage({
        path: "/",
        html: '<!doctype html><html><head><title>Home</title></head><body><h1>H</h1><a href="/old">Old</a></body></html>',
      }),
    ],
  });
  const discovery = makeDiscovery({ candidates: [{ path: "/" }] });

  const client = makeStubClient(async () => ({
    status: 301,
    ok: false,
    headers: { location: "/new" },
    contentType: "text/html",
  }));

  const result = await runInternalLinksAudit({ crawl, client, discovery });
  const redirect = result.findings.find((finding) => finding.code === "internal-link-redirects");

  assert.ok(redirect, "a redirect must be reported");
  assert.equal(redirect.severity, "WARNING");
});

test("reports an indexable page with no inbound links and no sitemap entry as an orphan", async () => {
  const crawl = makeCrawl({
    pages: [
      makePage({ path: "/", html: "<!doctype html><html><head><title>Home</title></head><body><h1>H</h1></body></html>" }),
      makePage({
        path: "/orphan",
        html: "<!doctype html><html><head><title>Orphan</title></head><body><h1>Orphan</h1></body></html>",
      }),
    ],
  });
  const discovery = makeDiscovery({ candidates: [{ path: "/" }, { path: "/orphan" }] });
  const client = makeStubClient(async () => ({ status: 200, ok: true, contentType: "text/html", headers: {} }));

  const result = await runInternalLinksAudit({ crawl, client, discovery });
  const orphan = result.findings.find((finding) => finding.code === "orphan-page");

  assert.ok(orphan, "a page with no inbound links and no sitemap entry is an orphan");
  assert.equal(orphan.url, "https://aken.firm.in/orphan");
  assert.equal(orphan.evidence.inSitemap, false);
});

test("does not call a page an orphan when it is listed in the sitemap", async () => {
  const crawl = makeCrawl({
    pages: [
      makePage({ path: "/", html: "<!doctype html><html><head><title>Home</title></head><body><h1>H</h1></body></html>" }),
      makePage({
        path: "/listed",
        html: "<!doctype html><html><head><title>Listed</title></head><body><h1>L</h1></body></html>",
      }),
    ],
    sitemapUrls: ["https://aken.firm.in/", "https://aken.firm.in/listed"],
  });
  const discovery = makeDiscovery({ candidates: [{ path: "/" }, { path: "/listed" }] });
  const client = makeStubClient(async () => ({ status: 200, ok: true, contentType: "text/html", headers: {} }));

  const result = await runInternalLinksAudit({ crawl, client, discovery });
  const orphan = result.findings.find((finding) => finding.code === "orphan-page");

  assert.equal(orphan, undefined, "a sitemap entry must prevent an orphan claim");
});

test("reports the same target linked with two different href spellings", async () => {
  const crawl = makeCrawl({
    pages: [
      makePage({
        path: "/",
        html: '<!doctype html><html><head><title>Home</title></head><body><h1>H</h1><a href="/about">A</a><a href="/about/">B</a></body></html>',
      }),
    ],
  });
  const discovery = makeDiscovery({ candidates: [{ path: "/" }] });
  const client = makeStubClient(async () => ({ status: 200, ok: true, contentType: "text/html", headers: {} }));

  const result = await runInternalLinksAudit({ crawl, client, discovery });
  const inconsistent = result.findings.find(
    (finding) => finding.code === "internal-link-inconsistent-form",
  );

  assert.ok(inconsistent, "two spellings of one target must be reported");
  assert.equal(inconsistent.evidence.forms.length, 2);
});

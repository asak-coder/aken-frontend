/**
 * Regression tests for two false positives that only appeared on the first
 * live run against https://aken.firm.in.
 *
 * Both were the kind of defect that is worse than a missed finding: they
 * told the site owner to change something that was already correct.
 *
 *   1. the structured-data audit flagged `sameAs` values as being on the
 *      wrong host, even though naming an external profile is precisely what
 *      `sameAs` is for. Following that advice would have deleted valid
 *      markup.
 *   2. the robots.txt audit suggested disallowing every excluded route
 *      prefix, including `/_next` (disallowing which stops crawlers
 *      rendering the site) and `/reports` (which is not a served path at
 *      all).
 *
 * These tests pin the corrected behaviour.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { makeCrawl, makePage } from "./helpers.mjs";
import { runStructuredDataAudit } from "../audits/structured-data.mjs";
import { runRobotsAudit } from "../audits/robots.mjs";

function pageWithJsonLd(path, node) {
  return makePage({
    path,
    html: `<!doctype html><html><head><title>Title ${path}</title></head><body>
      <main><h1>Heading</h1><p>AKEN is an engineering and fabrication contractor.</p></main>
      <script type="application/ld+json">${JSON.stringify(node)}</script>
    </body></html>`,
  });
}

test("does not flag sameAs pointing at an external profile", () => {
  const crawl = makeCrawl({
    pages: [
      pageWithJsonLd("/", {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "AKEN",
        url: "https://aken.firm.in",
        sameAs: ["https://wa.me/918280076864", "https://www.linkedin.com/company/aken"],
      }),
    ],
  });

  const result = runStructuredDataAudit({ crawl });
  const wrongHost = result.findings.filter(
    (finding) => finding.code === "structured-data-url-different-host",
  );

  assert.deepEqual(
    wrongHost,
    [],
    "sameAs exists to name external identities, so an off-host value is correct markup",
  );
});

test("still flags a genuinely off-host url property", () => {
  const crawl = makeCrawl({
    pages: [
      pageWithJsonLd("/", {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "AKEN",
        url: "https://somewhere-else.example/aken",
      }),
    ],
  });

  const result = runStructuredDataAudit({ crawl });
  const wrongHost = result.findings.find(
    (finding) => finding.code === "structured-data-url-different-host",
  );

  assert.ok(wrongHost, "a url property on another host is still a real finding");
  assert.equal(wrongHost.actual, "https://somewhere-else.example/aken");
});

test("accepts a same-host url property", () => {
  const crawl = makeCrawl({
    pages: [
      pageWithJsonLd("/", {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "AKEN",
        url: "https://aken.firm.in/about",
      }),
    ],
  });

  const result = runStructuredDataAudit({ crawl });
  const wrongHost = result.findings.filter(
    (finding) => finding.code === "structured-data-url-different-host",
  );

  assert.deepEqual(wrongHost, []);
});

test("does not suggest disallowing /_next or /reports in robots.txt", () => {
  const crawl = makeCrawl({
    pages: [],
    robotsText: [
      "User-agent: *",
      "Disallow: /admin",
      "Sitemap: https://aken.firm.in/sitemap.xml",
      "",
    ].join("\n"),
  });

  const result = runRobotsAudit({ crawl });

  const mentionsNext = result.findings.filter((finding) => finding.message.includes("/_next"));
  const mentionsReports = result.findings.filter((finding) => finding.message.includes("/reports"));

  assert.deepEqual(
    mentionsNext,
    [],
    "disallowing /_next would stop crawlers rendering the site, so it must never be recommended",
  );
  assert.deepEqual(
    mentionsReports,
    [],
    "/reports is not a served path, so recommending an exclusion for it is noise",
  );
});

test("still reports a private path that robots.txt does not exclude", () => {
  const crawl = makeCrawl({
    pages: [],
    robotsText: [
      "User-agent: *",
      "Disallow: /admin",
      "Sitemap: https://aken.firm.in/sitemap.xml",
      "",
    ].join("\n"),
  });

  const result = runRobotsAudit({ crawl });

  const notExcluded = result.findings.filter(
    (finding) => finding.code === "robots-does-not-exclude-private-path",
  );

  assert.equal(notExcluded.length, 1, "only /api is missing, because /admin is disallowed");
  assert.equal(notExcluded[0].evidence.prefix, "/api");
  assert.equal(notExcluded[0].severity, "INFO");
});

test("says nothing about excluded prefixes it should not recommend", () => {
  const crawl = makeCrawl({
    pages: [],
    robotsText: "User-agent: *\nAllow: /\nSitemap: https://aken.firm.in/sitemap.xml\n",
  });

  const result = runRobotsAudit({ crawl });

  const prefixes = result.findings
    .filter((finding) => finding.code === "robots-does-not-exclude-private-path")
    .map((finding) => finding.evidence.prefix);

  assert.deepEqual(prefixes.sort(), ["/admin", "/api"]);
});

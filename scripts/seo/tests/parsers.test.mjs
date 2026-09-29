/**
 * TESTS 5, 6 and 7 - sitemap parsing, robots.txt parsing and JSON-LD parsing.
 *
 * These three parsers sit under every audit, so they are tested directly
 * against the shapes a real site emits, including the malformed cases the
 * auditor must report rather than crash on.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { parseSitemapXml, sitemapLocations, groupByLastModified } from "../lib/sitemap-parse.mjs";
import { evaluateGroup, isPathAllowed, parseRobotsTxt, selectGroup } from "../lib/robots-parse.mjs";
import {
  flattenNodes,
  inferTypes,
  missingRequiredProperties,
  parseJsonLdBlocks,
  validateContexts,
} from "../lib/jsonld.mjs";

/* ---------------------------------------------------------------- sitemap */

const URLSET = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://aken.firm.in/</loc><lastmod>2026-09-01</lastmod><priority>1.0</priority></url>
  <url><loc>https://aken.firm.in/about</loc><lastmod>2026-09-01</lastmod><priority>0.5</priority></url>
</urlset>`;

test("parses a urlset sitemap and extracts every location", () => {
  const parsed = parseSitemapXml(URLSET);

  assert.equal(parsed.kind, "urlset");
  assert.equal(parsed.errors.length, 0);
  assert.deepEqual(sitemapLocations(parsed), [
    "https://aken.firm.in/",
    "https://aken.firm.in/about",
  ]);
  assert.equal(parsed.entries[0].lastModified, "2026-09-01");
});

test("groups sitemap entries by lastmod so a build-constant timestamp is visible", () => {
  const groups = groupByLastModified(parseSitemapXml(URLSET));

  assert.equal(groups.length, 1);
  assert.equal(groups[0].lastModified, "2026-09-01");
  assert.equal(groups[0].count, 2);
});

test("parses a sitemap index into nested sitemap URLs", () => {
  const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://aken.firm.in/sitemap-pages.xml</loc></sitemap>
</sitemapindex>`;

  const parsed = parseSitemapXml(index);

  assert.equal(parsed.kind, "sitemapindex");
  assert.equal(parsed.nestedSitemaps.length, 1);
  assert.equal(parsed.nestedSitemaps[0].loc, "https://aken.firm.in/sitemap-pages.xml");
});

test("reports an HTML error page served in place of a sitemap", () => {
  const parsed = parseSitemapXml("<!doctype html><html><body>404</body></html>");

  assert.equal(parsed.kind, "unknown");
  assert.equal(parsed.errors.length, 1);
  assert.match(parsed.errors[0], /HTML error page/);
});

test("reports an empty sitemap document rather than returning an empty set silently", () => {
  const parsed = parseSitemapXml("");

  assert.equal(parsed.errors.length, 1);
  assert.equal(parsed.errors[0], "empty document");
});

/* ----------------------------------------------------------------- robots */

const ROBOTS = `# AKEN robots
User-agent: *
Disallow: /admin/
Disallow: /api/
Allow: /admin/public
Sitemap: https://aken.firm.in/sitemap.xml

User-agent: GPTBot
Disallow: /
`;

test("parses robots.txt groups, rules and the declared sitemap", () => {
  const parsed = parseRobotsTxt(ROBOTS);

  assert.equal(parsed.groups.length, 2);
  assert.deepEqual(parsed.sitemaps, ["https://aken.firm.in/sitemap.xml"]);
  assert.equal(parsed.invalidLines.length, 0);
  assert.equal(parsed.unknownDirectives.length, 0);
});

test("disallows an admin path and allows a public route", () => {
  const parsed = parseRobotsTxt(ROBOTS);

  assert.equal(isPathAllowed(parsed, "/admin/login").allowed, false);
  assert.equal(isPathAllowed(parsed, "/about").allowed, true);
});

test("lets a more specific Allow win over a broader Disallow", () => {
  const parsed = parseRobotsTxt(ROBOTS);
  const verdict = isPathAllowed(parsed, "/admin/public");

  assert.equal(verdict.allowed, true);
  assert.equal(verdict.rule, "Allow: /admin/public");
});

test("selects a named user-agent group in preference to the wildcard group", () => {
  const parsed = parseRobotsTxt(ROBOTS);
  const group = selectGroup(parsed, "GPTBot");

  assert.deepEqual(group.agents, ["gptbot"]);
  assert.equal(evaluateGroup(group, "/").allowed, false);
});

test("reports a line that is not a valid directive", () => {
  const parsed = parseRobotsTxt("User-agent: *\nDisallow /admin\n");

  assert.equal(parsed.invalidLines.length, 1);
  assert.match(parsed.invalidLines[0].reason, /missing ':'/);
});

test("reports an unrecognised directive rather than treating it as an error", () => {
  const parsed = parseRobotsTxt("User-agent: *\nNoindex: /\n");

  assert.equal(parsed.unknownDirectives.length, 1);
  assert.equal(parsed.invalidLines.length, 0);
});

test("supports the `*` wildcard and `$` anchor in disallow patterns", () => {
  const parsed = parseRobotsTxt("User-agent: *\nDisallow: /*.pdf$\n");

  assert.equal(isPathAllowed(parsed, "/media/report.pdf").allowed, false);
  assert.equal(isPathAllowed(parsed, "/media/report.pdf.html").allowed, true);
});

/* ----------------------------------------------------------------- JSON-LD */

test("parses a valid JSON-LD block and flattens its @graph", () => {
  const raw = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "AKEN", url: "https://aken.firm.in" },
      { "@type": "Service", name: "Pre-Engineered Buildings (PEB)" },
    ],
  });

  const parsed = parseJsonLdBlocks([{ raw, viaSrc: null }]);
  assert.equal(parsed[0].ok, true);

  const nodes = flattenNodes(parsed);
  assert.equal(nodes.length, 2);
  assert.deepEqual(inferTypes(nodes[0].node), ["Organization"]);
});

test("reports invalid JSON without throwing", () => {
  const parsed = parseJsonLdBlocks([{ raw: "{ not json", viaSrc: null }]);

  assert.equal(parsed[0].ok, false);
  assert.ok(parsed[0].error);
});

test("reports a missing @context", () => {
  const problems = validateContexts(parseJsonLdBlocks([{ raw: '{"@type":"Organization"}', viaSrc: null }]));

  assert.equal(problems.length, 1);
  assert.match(problems[0].reason, /missing @context/);
});

test("lists required properties that a node is missing", () => {
  const missing = missingRequiredProperties({ "@type": "Service" });
  assert.deepEqual(missing, ["Service.name"]);

  const blogMissing = missingRequiredProperties({ "@type": "BlogPosting", headline: "H" });
  assert.deepEqual(blogMissing, ["BlogPosting.author"]);
});

test("does not require properties for a node type the auditor does not model", () => {
  assert.deepEqual(missingRequiredProperties({ "@type": "SomethingCustom" }), []);
});

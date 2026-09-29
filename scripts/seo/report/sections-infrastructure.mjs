/**
 * Markdown renderers for the infrastructure sections:
 * Robots, Sitemap, Structured Data.
 */

import { code, findingList, heading, table, truncate } from "./markdown-format.mjs";

export function renderRobotsSection({ audits }) {
  const lines = [heading(2, "Robots"), ""];
  const robots = audits.robots;

  lines.push(
    "Validation of /robots.txt: HTTP response, syntax, sitemap directive and accidental blocking of public routes.",
    "",
  );

  const summary = robots.summary || {};
  lines.push(
    table(
      ["Check", "Result"],
      [
        ["Retrieved", summary.retrieved ? "yes" : "no"],
        ["HTTP status", summary.status],
        ["Bytes read", summary.bytes],
        ["Declared sitemaps", (summary.declaredSitemaps || []).join(", ") || "(none)"],
        ["Disallowed patterns", (summary.disallowedPatterns || []).join(", ") || "(none)"],
        ["Public routes blocked", summary.publicRoutesBlocked],
        ["Source file present", summary.sourceFilePresent ? "yes" : "no"],
      ],
    ),
    "",
  );

  for (const observation of robots.observations || []) {
    lines.push(
      heading(3, observation.code === "robots-disallow-list" ? "Disallow list" : "Applicable rule group"),
      "",
      code(JSON.stringify(observation)),
      "",
    );
  }

  lines.push(findingList(robots.findings), "");
  return lines.join("\n");
}

export function renderSitemapSection({ audits }) {
  const lines = [heading(2, "Sitemap"), ""];
  const sitemap = audits.sitemap;

  lines.push(
    "Sitemap validity and coverage. Missing and unexpected URLs are derived by comparing the sitemap against the project's own route files and against what actually responded.",
    "",
  );

  const summary = sitemap.summary || {};
  lines.push(
    table(
      ["Metric", "Value"],
      [
        ["Sitemap URLs", summary.sitemapUrlCount],
        ["Unique sitemap URLs", summary.uniqueSitemapUrlCount],
        ["Discovered indexable URLs", summary.discoveredIndexableUrlCount],
        ["Discovered analysed pages", summary.discoveredAnalysedPageCount],
        ["Sitemap URLs not indexable", summary.sitemapUrlsNotIndexable],
        ["Duplicate sitemap URLs", summary.duplicateSitemapUrls],
        ["Canonical inconsistencies", summary.canonicalInconsistencies],
        ["Nested sitemaps", (summary.nestedSitemaps || []).join(", ") || "(none)"],
        [
          "Auditor had to fall back to /sitemap.xml",
          summary.usedDefaultSitemapPath
            ? "yes (nothing declared a sitemap)"
            : "no (a sitemap was declared)",
        ],
      ],
    ),
    "",
  );

  const missing = summary.missingFromSitemap || [];
  lines.push(heading(3, "Indexable pages missing from the sitemap"), "");
  lines.push(missing.length === 0 ? "_None._" : missing.map((path) => `- ${code(path)}`).join("\n"), "");

  for (const observation of sitemap.observations || []) {
    if (!observation.lastModifiedGroups || observation.lastModifiedGroups.length === 0) continue;
    lines.push(heading(3, "lastmod distribution"), "");
    lines.push(
      table(
        ["lastmod", "Entries"],
        observation.lastModifiedGroups.map((entry) => [entry.lastModified, entry.count]),
      ),
      "",
    );
    if (observation.lastModifiedGroups.length === 1) {
      lines.push(
        "Every entry shares one lastmod value, which usually means the timestamp is generated at build time rather than reflecting real edits. Search engines may disregard it.",
        "",
      );
    }
  }

  lines.push(findingList(sitemap.findings), "");
  return lines.join("\n");
}

export function renderStructuredDataSection({ audits }) {
  const lines = [heading(2, "Structured Data"), ""];
  const structuredData = audits.structuredData;

  lines.push(
    "JSON-LD validity, required properties, host consistency and duplicate nodes. The auditor validates and reports only: it never creates, completes or enriches structured data, and it never fabricates reviews, ratings, offers, prices, events, projects or locations.",
    "",
  );

  const summary = structuredData.summary || {};
  lines.push(
    table(
      ["Metric", "Value"],
      [
        ["Pages checked", summary.pagesChecked],
        ["Pages with JSON-LD", summary.pagesWithStructuredData],
        ["Pages without JSON-LD", summary.pagesWithoutStructuredData],
        ["Total blocks", summary.totalBlocks],
        ["Invalid blocks", summary.invalidBlocks],
        ["Total nodes", summary.totalNodes],
      ],
    ),
    "",
  );

  const types = summary.typesFound || [];
  if (types.length > 0) {
    lines.push(heading(3, "Types found"), "");
    lines.push(
      table(
        ["Type", "Occurrences"],
        types.map((entry) => [entry.type, entry.count]),
      ),
      "",
    );
  }

  const claims = summary.claimBearingTypesFound || [];
  lines.push(heading(3, "Claim-bearing types present"), "");
  lines.push(
    claims.length === 0
      ? "_None. No review, rating, price or event markup was found._"
      : claims
          .map((entry) => `- ${code(entry.type)} on ${code(entry.url)} - requires human confirmation`)
          .join("\n"),
    "",
  );

  const perPage = (structuredData.observations || []).filter((entry) => entry.blocks > 0);
  if (perPage.length > 0) {
    lines.push(heading(3, "Nodes per page"), "");
    lines.push(
      table(
        ["URL", "Blocks", "Types", "Nodes"],
        perPage.map((entry) => [
          entry.url,
          entry.blocks,
          (entry.types || []).join(", "),
          (entry.nodes || []).map((node) => node.label).join("; "),
        ]),
      ),
      "",
    );
  }

  lines.push(findingList(structuredData.findings), "");
  return lines.join("\n");
}

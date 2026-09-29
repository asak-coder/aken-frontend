/**
 * Markdown renderers for the content-facing sections:
 * URL Quality, Duplicate Content Signals, Blog Health, Service Page Health
 * and Recommended Actions.
 *
 * Recommended Actions is the only place in the report that suggests work.
 * Every entry is a recommendation derived from a measured finding. Nothing
 * listed there is executed by the auditor: there is no code path in this
 * repository that can act on it.
 */

import { code, findingList, heading, table, truncate } from "./markdown-format.mjs";

export function renderUrlQualitySection({ audits }) {
  const lines = [heading(2, "URL Quality"), ""];
  const urlQuality = audits.urlQuality;

  lines.push(
    "Malformed paths, accidental query parameters, case and slash variants, temporary-looking paths and internal-path exposure. The auditor never rewrites a URL.",
    "",
  );

  const summary = urlQuality.summary || {};
  lines.push(
    table(
      ["Metric", "Value"],
      [
        ["URLs checked", summary.urlsChecked],
        ["URLs carrying a query string", summary.urlsWithQuery],
        ["Paths with uppercase characters", summary.uppercasePaths],
        ["Temporary-looking paths", summary.temporaryLooking],
        ["Duplicate path variants", summary.duplicateVariants],
        ["Excluded paths reachable", summary.excludedPathsReachable],
      ],
    ),
    "",
  );

  const params = summary.queryParametersSeen || [];
  if (params.length > 0) {
    lines.push(heading(3, "Query parameters seen"), "");
    lines.push(
      table(
        ["Parameter", "URLs"],
        params.map((entry) => [entry.parameter, entry.count]),
      ),
      "",
    );
  }

  lines.push(findingList(urlQuality.findings), "");
  return lines.join("\n");
}

export function renderDuplicateSignalsSection({ audits }) {
  const lines = [heading(2, "Duplicate Content Signals"), ""];
  const duplicates = audits.duplicateSignals;

  lines.push(
    "Technical duplication the auditor can measure: identical title, description, canonical or H1, plus textual overlap. Every finding says \"Potential duplicate-content signal detected.\" The auditor cannot see any search index and does not assert that any page has been classified as duplicate.",
    "",
  );

  const summary = duplicates.summary || {};
  lines.push(
    table(
      ["Metric", "Value"],
      [
        ["Pages checked", summary.pagesChecked],
        ["Pages compared for text", summary.pagesComparedForText],
        ["Pairwise comparisons", summary.pairwiseComparisons],
        ["Similarity threshold", summary.similarityThreshold],
        ["Minimum shingles", summary.minimumShingles],
        ["Duplicate body-text pairs", summary.duplicateBodyTextPairs],
        ["Canonical convergence groups", summary.canonicalConvergenceGroups],
      ],
    ),
    "",
  );

  const highest = summary.highestSimilarityPairs || [];
  if (highest.length > 0) {
    lines.push(heading(3, "Most similar page pairs"), "");
    lines.push(
      table(
        ["Page A", "Page B", "Similarity"],
        highest.map((entry) => [entry.a, entry.b, entry.similarity]),
      ),
      "",
    );
  }

  lines.push(findingList(duplicates.findings), "");
  return lines.join("\n");
}

export function renderBlogSection({ audits }) {
  const lines = [heading(2, "Blog Health"), ""];
  const blog = audits.blog;

  lines.push(
    "Per-article metadata, canonical, H1, BlogPosting and BreadcrumbList schema, dates, links, indexability and sitemap inclusion. No article is generated and no article is edited.",
    "",
  );

  const summary = blog.summary || {};
  lines.push(
    table(
      ["Metric", "Value"],
      [
        ["Published articles found", summary.publishedArticlesFound],
        ["Slugs declared in source", summary.declaredSlugs],
        ["Articles in the sitemap", summary.articlesInSitemap],
        ["Articles indexable", summary.articlesIndexable],
        ["Articles with BlogPosting schema", summary.articlesWithPostingSchema],
        ["Articles with breadcrumbs", summary.articlesWithBreadcrumbs],
        ["Articles without datePublished", summary.articlesWithoutDatePublished],
        ["Articles without dateModified", summary.articlesWithoutDateModified],
        ["Blog listing reached", summary.listingReached ? "yes" : "no"],
      ],
    ),
    "",
  );

  const rows = (blog.observations || [])
    .filter((entry) => entry.code === "blog-article")
    .map((entry) => [
      entry.url,
      entry.title || "(none)",
      entry.h1Count,
      entry.hasPostingSchema ? "yes" : "no",
      entry.hasBreadcrumbs ? "yes" : "no",
      entry.datePublished || "",
      entry.indexability,
      entry.inSitemap ? "yes" : "no",
      entry.inboundInternalLinks,
      entry.wordCount,
    ]);

  lines.push(heading(3, "Articles"), "");
  lines.push(
    table(
      [
        "URL",
        "Title",
        "H1s",
        "BlogPosting",
        "Breadcrumbs",
        "Published",
        "Indexability",
        "In sitemap",
        "Inbound",
        "Words",
      ],
      rows,
    ) || "_No articles were found._",
  );
  lines.push("");

  const drafts = (blog.observations || []).filter((entry) => entry.code === "protected-draft");
  lines.push(heading(3, "Protected draft check"), "");
  lines.push(
    table(
      ["Draft slug", "In source", "Route reachable"],
      drafts.map((entry) => [
        entry.slug,
        entry.slugDeclaredInSource ? "yes" : "no",
        entry.routeReachable ? "YES - investigate" : "no",
      ]),
    ) || "_No protected drafts are configured._",
  );
  lines.push("");
  lines.push(
    `Policy: ${summary.policy || "No article is generated, edited or published by this auditor."}`,
    "",
  );

  lines.push(findingList(blog.findings), "");
  return lines.join("\n");
}

export function renderServicesSection({ audits }) {
  const lines = [heading(2, "Service Page Health"), ""];
  const services = audits.services;

  lines.push(
    "Per-service metadata, canonical, H1, structured data, links, indexability and sitemap presence. No service page and no location combination is created by this audit.",
    "",
  );

  const summary = services.summary || {};
  lines.push(
    table(
      ["Metric", "Value"],
      [
        ["Service pages found", summary.servicePagesFound],
        ["Non-listing service pages", summary.nonListingServicePages],
        ["Expected from source", summary.expectedFromSource],
        ["Without Service schema", summary.pagesWithoutServiceSchema],
        ["Without breadcrumbs", summary.pagesWithoutBreadcrumbs],
        ["Not indexable", summary.pagesNotIndexable],
        ["Not in sitemap", summary.pagesNotInSitemap],
      ],
    ),
    "",
  );

  const rows = (services.observations || []).map((entry) => [
    entry.url,
    entry.isListing ? "listing" : "service",
    entry.title || "(none)",
    entry.h1Count,
    entry.hasServiceSchema ? "yes" : "no",
    entry.hasBreadcrumbs ? "yes" : "no",
    entry.hasFaq ? "yes" : "no",
    entry.indexability,
    entry.inSitemap ? "yes" : "no",
    entry.inboundInternalLinks,
  ]);

  lines.push(
    table(
      [
        "URL",
        "Type",
        "Title",
        "H1s",
        "Service schema",
        "Breadcrumbs",
        "FAQ",
        "Indexability",
        "In sitemap",
        "Inbound",
      ],
      rows,
    ) || "_No service pages were found._",
  );
  lines.push("");
  lines.push(
    `Policy: ${summary.noNewPagesCreated || "This audit creates no new service page."}`,
    "",
  );

  lines.push(findingList(services.findings), "");
  return lines.join("\n");
}

/**
 * Recommendations derived from the measured findings, grouped by theme.
 * These are suggestions only. The auditor has no capability to execute
 * them, and nothing in this repository acts on this list.
 */
export function renderRecommendedActions({ audits }) {
  const lines = [heading(2, "Recommended Actions"), ""];

  lines.push(
    "These are recommendations only. They are derived from the findings above and are listed for a human to review. The auditor does not execute any of them: it does not edit content, metadata, canonicals, structured data, the sitemap, robots.txt, the admin area or the deployment configuration.",
    "",
  );

  const groups = [
    {
      title: "Metadata",
      auditKeys: ["titles", "descriptions"],
      codes: {
        "title-missing": "Write a descriptive <title> for this page.",
        "title-too-long": "Shorten the title so the distinguishing words survive truncation.",
        "title-too-short": "Expand the title so it describes the page rather than naming it.",
        "title-duplicate": "Give each indexable page a distinct title.",
        "description-missing": "Write a meta description for this page.",
        "description-too-long": "Shorten the meta description.",
        "description-too-short": "Expand the meta description.",
        "description-duplicate": "Make each indexable page's description distinct.",
      },
    },
    {
      title: "Canonicals and indexability",
      auditKeys: ["canonicals", "indexability"],
      codes: {
        "canonical-missing": "Declare an absolute, self-referencing canonical on this indexable page.",
        "canonical-not-absolute": "Make the canonical absolute.",
        "canonical-wrong-host": "Point the canonical at the canonical host, aken.firm.in.",
        "canonical-duplicated": "Keep exactly one canonical link element per page.",
        "canonical-insecure-scheme": "Use https in the canonical.",
        "canonical-trailing-slash": "Match the site's slash convention in the canonical.",
        "canonical-points-elsewhere": "Confirm the target is the URL that should be indexed, or make the canonical self-referencing.",
        "indexability-canonical-conflict": "Resolve the disagreement between the canonical and the robots directive.",
        "indexability-blocked-by-robots": "Remove the robots.txt rule that blocks this public route, or confirm the route is intentionally private.",
      },
    },
    {
      title: "Headings",
      auditKeys: ["h1", "headings"],
      codes: {
        "h1-missing": "Add an H1 stating the page's subject.",
        "h1-multiple": "Consolidate to a single H1 in the page content.",
        "h1-empty": "Give the H1 text.",
        "heading-repeated-within-page": "Check whether a section is rendered twice.",
      },
    },
    {
      title: "Crawl infrastructure",
      auditKeys: ["robots", "sitemap"],
      codes: {
        "sitemap-missing-indexable-page": "Add this indexable page to sitemap.xml.",
        "sitemap-lists-noindex-url": "Remove this noindex URL from the sitemap, or make it indexable.",
        "sitemap-lists-failing-url": "Remove or repair this failing URL in the sitemap.",
        "sitemap-duplicate-url": "De-duplicate the sitemap.",
        "sitemap-includes-excluded-path": "Remove admin, API or internal URLs from the sitemap.",
        "sitemap-invalid-xml": "Repair sitemap generation so it emits a valid document.",
        "robots-invalid-line": "Fix or remove the malformed directive.",
        "robots-sitemap-unreachable": "Point the Sitemap directive at a sitemap that actually resolves.",
        "robots-no-sitemap-directive": "Optionally declare the sitemap in robots.txt.",
        "route-missing-from-sitemap": "Add this route to sitemap.xml.",
      },
    },
    {
      title: "Structured data",
      auditKeys: ["structuredData"],
      codes: {
        "json-ld-parse-error": "Fix the JSON syntax so the block is readable.",
        "json-ld-missing-context": "Add the schema.org context.",
        "structured-data-missing-required": "Add the required properties listed in the finding.",
        "structured-data-url-different-host": "Point schema URLs at the canonical host.",
        "blog-missing-posting-schema": "Add BlogPosting structured data with a datePublished.",
        "service-missing-service-schema": "Add Service structured data describing the service.",
        "blog-missing-breadcrumbs": "Add BreadcrumbList structured data.",
        "service-missing-breadcrumbs": "Add BreadcrumbList structured data.",
        "structured-data-claim-bearing-type": "Confirm every rating, review or event value is genuine and documented before keeping it.",
      },
    },
    {
      title: "Links and assets",
      auditKeys: ["internalLinks", "externalLinks", "images"],
      codes: {
        "internal-link-broken": "Repair or remove the link.",
        "internal-link-target-unknown": "Repair this link: no route produces the target.",
        "internal-link-redirects": "Link directly to the destination.",
        "internal-link-inconsistent-form": "Standardise how this target is linked.",
        "orphan-page": "Add an internal link to this page or list it in the sitemap.",
        "external-link-broken": "Update or remove the outbound link.",
        "external-link-refused": "Check the destination manually; it may be blocking automated requests.",
        "image-missing-alt": "Add descriptive alt text, or alt=\"\" for a decorative image.",
        "image-generic-alt": "Replace the generic alt text with a description.",
        "image-broken": "Repair or remove the broken image reference.",
        "image-without-dimensions": "Set width and height, or lazy-load the image.",
      },
    },
    {
      title: "URLs and duplication",
      auditKeys: ["urlQuality", "duplicateSignals"],
      codes: {
        "url-trailing-slash": "Standardise the trailing-slash convention.",
        "url-uppercase-segment": "Use lower-case path segments.",
        "url-excluded-path-reachable": "Confirm the path is protected and excluded from crawling.",
        "url-tracking-parameters": "Link to the clean URL without tracking parameters.",
        "duplicate-title": "Differentiate the pages that share a title.",
        "duplicate-description": "Differentiate the pages that share a description.",
        "duplicate-body-text": "Differentiate or consolidate the overlapping pages.",
        "duplicate-h1": "Give each page its own H1.",
      },
    },
  ];

  /**
   * Every actionable finding is accounted for: either it has a mapped
   * recommendation, or it is surfaced explicitly. Silently dropping a
   * finding because no boilerplate line was written for its code would hide
   * real work from the reader.
   */
  const mappedCodes = new Set(groups.flatMap((group) => Object.keys(group.codes)));
  const actionableFindings = Object.values(audits).flatMap((audit) =>
    (audit.findings || []).filter(
      (finding) => finding.severity === "ERROR" || finding.severity === "WARNING",
    ),
  );
  const unmappedFindings = actionableFindings.filter((finding) => !mappedCodes.has(finding.code));

  let anyRecommendation = false;

  for (const group of groups) {
    const items = [];

    for (const key of group.auditKeys) {
      const audit = audits[key];
      if (!audit || !audit.findings) continue;
      for (const finding of audit.findings) {
        if (finding.severity !== "ERROR" && finding.severity !== "WARNING") continue;
        const recommendation = group.codes[finding.code];
        if (!recommendation) continue;
        items.push(
          `- ${recommendation}${finding.url ? ` Affected: ${code(finding.url)}` : ""} (${finding.code}, ${finding.severity})`,
        );
      }
    }

    const unique = [...new Set(items)];
    if (unique.length === 0) continue;

    anyRecommendation = true;
    lines.push(heading(3, group.title), "", unique.join("\n"), "");
  }

  if (!anyRecommendation) {
    lines.push(
      actionableFindings.length === 0
        ? "_No corrective action is recommended: no ERROR or WARNING findings were produced._"
        : `_No mapped corrective action exists for the ${actionableFindings.length} ERROR and WARNING finding(s) in this run. Each is listed in full above and in the JSON report, and each needs a human decision rather than a boilerplate action._`,
      "",
    );
  }

  if (unmappedFindings.length > 0) {
    lines.push(heading(3, "Findings that need a human decision"), "");
    lines.push(
      unmappedFindings
        .map(
          (finding) =>
            `- ${code(finding.code)} (${finding.severity})${finding.url ? ` ${code(finding.url)}` : ""}: ${truncate(finding.message, 200)}`,
        )
        .join("\n"),
      "",
    );
  }

  lines.push(
    heading(3, "Explicitly out of scope for Phase 1"),
    "",
    [
      "- No keyword research is performed.",
      "- No local SEO opportunity generation is performed.",
      "- No AI blog generation is performed.",
      "- No automatic publication or automatic fixing is performed.",
      "- The reserved draft article stays unpublished and is treated as a future content-validation fixture only.",
    ].join("\n"),
    "",
  );

  return lines.join("\n");
}

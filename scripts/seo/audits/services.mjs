/**
 * AUDIT 17 - Service page health.
 *
 * For every service page the project actually defines, reports metadata,
 * canonical, H1, structured data, breadcrumbs, indexability, internal
 * links and sitemap presence in one row, so the service set can be
 * reviewed as a whole rather than page by page.
 *
 * This audit creates nothing. It does not add service pages, does not add
 * location variants, and does not generate any location/service
 * combination. Its whole purpose is to describe the pages that already
 * exist.
 *
 * Severity mapping:
 *   ERROR      - a service page is missing a title, description, H1 or
 *                canonical, or is not indexable
 *   WARNING    - missing Service or BreadcrumbList structured data, no
 *                inbound internal links, or not present in the sitemap
 *   INFO       - extra structured data, or a page reachable only by link
 *   UNVERIFIED - the page could not be retrieved
 */

import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages } from "./shared.mjs";
import { canonicalForm } from "../lib/url-utils.mjs";
import { flattenNodes, inferTypes } from "../lib/jsonld.mjs";

const AUDIT = "services";

export function runServicesAudit({ crawl, discovery }) {
  const findings = [];
  const observations = [];

  const servicePaths = new Set(discovery.serviceSlugs.map((slug) => `/services/${slug}`));
  const servicePages = crawl.pages.filter(
    (page) => page.path === "/services" || servicePaths.has(page.path),
  );

  if (servicePages.length === 0) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.UNVERIFIED,
        code: "services-none-found",
        url: `${crawl.origin}/services`,
        message: "No service pages were reached during the crawl, so service page health could not be assessed.",
        evidence: { expectedFromSource: [...servicePaths] },
      }),
    );
    return buildAuditResult({
      id: AUDIT,
      name: "Service page health",
      description: "Per-service metadata, canonical, H1, structured data, links, indexability and sitemap presence.",
      findings,
      summary: { servicePagesFound: 0, expectedFromSource: servicePaths.size },
    });
  }

  const sitemapKeys = new Set(
    crawl.sitemap.urls.map((raw) => {
      try {
        return canonicalForm(new URL(raw, crawl.origin));
      } catch {
        return raw;
      }
    }),
  );

  for (const page of servicePages) {
    const isListing = page.path === "/services";
    const head = page.headInfo;
    const h1s = page.contentHeadings.filter((heading) => heading.level === 1);
    const types = structuredDataTypes(page);
    const hasServiceSchema = types.includes("Service");
    const hasBreadcrumbs = types.includes("BreadcrumbList");
    const hasFaq = types.includes("FAQPage");
    const inSitemap = sitemapKeys.has(canonicalForm(new URL(page.url)));

    if (!page.ok) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.UNVERIFIED,
          code: "service-page-unverified",
          url: page.url,
          message: `This service page could not be verified (HTTP ${page.status}).`,
          evidence: { error: page.error, blocked: page.blocked },
        }),
      );

      observations.push({
        code: "service-page",
        url: page.url,
        path: page.path,
        isListing,
        verified: false,
        indexability: "UNVERIFIED",
        inSitemap,
        httpStatus: page.status,
      });

      continue;
    }

    if (!head || !head.title) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "service-missing-title",
          url: page.url,
          message: "This service page has no title.",
        }),
      );
    }

    if (!head || !head.description) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "service-missing-description",
          url: page.url,
          message: "This service page has no meta description.",
        }),
      );
    }

    if (h1s.length === 0) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "service-missing-h1",
          url: page.url,
          message: "This service page has no H1 in its content.",
        }),
      );
    }

    if (!head || head.canonicalHrefs.length === 0) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "service-missing-canonical",
          url: page.url,
          message: "This service page declares no canonical URL.",
        }),
      );
    }

    const state = page.indexability ? page.indexability.state : "UNKNOWN";

    if (!isListing && state !== "INDEXABLE") {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "service-not-indexable",
          url: page.url,
          message: `This service page is not indexable (state ${state}), so it cannot appear in search results.`,
          evidence: { indexability: state, reasons: page.indexability ? page.indexability.reasons : [] },
        }),
      );
    }

    if (!isListing && !hasServiceSchema) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "service-missing-service-schema",
          url: page.url,
          message: "This service page has no Service structured data, so the service it describes is not machine-readable.",
          evidence: { typesFound: types },
        }),
      );
    }

    if (!isListing && !hasBreadcrumbs) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "service-missing-breadcrumbs",
          url: page.url,
          message: "This service page has no BreadcrumbList structured data.",
        }),
      );
    }

    if (!inSitemap) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "service-not-in-sitemap",
          url: page.url,
          message: "This service page is not listed in sitemap.xml.",
        }),
      );
    }

    if (page.inboundLinkCount === 0 && !isListing) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "service-no-inbound-links",
          url: page.url,
          message: "No crawled page links to this service page, so it depends on the sitemap alone to be discovered.",
          evidence: { path: page.path, inSitemap },
        }),
      );
    }

    observations.push({
      code: "service-page",
      url: page.url,
      path: page.path,
      isListing,
      title: head ? head.title : null,
      titleLength: head ? head.titleLength : 0,
      descriptionLength: head ? head.descriptionLength : 0,
      canonical: page.indexability ? page.indexability.canonicalTarget : null,
      h1Count: h1s.length,
      h1Text: h1s.length > 0 ? h1s[0].text : null,
      indexability: state,
      inSitemap,
      inboundInternalLinks: page.inboundLinkCount,
      outboundInternalLinks: new Set(
        page.anchors.filter((anchor) => anchor.kind === "internal" && anchor.resolvedUrl).map((anchor) => anchor.resolvedUrl),
      ).size,
      structuredDataTypes: types,
      hasServiceSchema,
      hasBreadcrumbs,
      hasFaq,
      wordCount: page.wordCount,
      httpStatus: page.status,
    });
  }

  const missingPages = [...servicePaths].filter((path) => !crawl.pages.some((page) => page.path === path));

  for (const path of missingPages) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.WARNING,
        code: "service-route-not-reached",
        url: `${crawl.origin}${path}`,
        message:
          "This service slug is declared in the project's service data but no page was reached for it, so the declared and served service sets differ.",
        evidence: { path },
      }),
    );
  }

  return buildAuditResult({
    id: AUDIT,
    name: "Service page health",
    description: "Per-service metadata, canonical, H1, structured data, links, indexability and sitemap presence.",
    findings,
    summary: {
      servicePagesFound: servicePages.length,
      nonListingServicePages: servicePages.filter((page) => page.path !== "/services").length,
      expectedFromSource: servicePaths.size,
      missingFromCrawl: missingPages,
      pagesWithoutServiceSchema: observations.filter((entry) => !entry.isListing && !entry.hasServiceSchema).length,
      pagesWithoutBreadcrumbs: observations.filter((entry) => !entry.isListing && !entry.hasBreadcrumbs).length,
      pagesNotIndexable: observations.filter((entry) => !entry.isListing && entry.indexability !== "INDEXABLE").length,
      pagesNotInSitemap: observations.filter((entry) => !entry.inSitemap).length,
      noNewPagesCreated:
        "This audit only describes the service pages that already exist. It creates no service page and no location/service combination.",
    },
    observations,
  });
}

function structuredDataTypes(page) {
  const blocks = (page.jsonLdBlocks || []).map((block, index) => ({
    index,
    viaSrc: block.viaSrc || null,
    ok: true,
    raw: block.raw,
    data: safeParse(block.raw),
  }));
  const nodes = flattenNodes(blocks);
  return [...new Set(nodes.flatMap((entry) => inferTypes(entry.node)))].sort();
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

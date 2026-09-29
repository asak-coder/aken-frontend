/**
 * AUDIT 16 - Blog health.
 *
 * For every published article: title, description, canonical, H1,
 * BlogPosting schema, BreadcrumbList, publication date, modified date,
 * internal links, indexability and sitemap inclusion, reported as one row
 * per article.
 *
 * This audit WRITES NOTHING. It never generates an article, never edits an
 * existing article, and never publishes a draft.
 *
 * It also performs one specific negative check required by the Phase 1
 * brief: the draft
 *   the-ultimate-guide-peb-vs-conventional-steel-fabrication-eastern-india.md
 * must not exist as a public blog route. That file is a future Phase 4
 * content-validation fixture, and the auditor's only job is to confirm it
 * has not been published by accident.
 *
 * Severity mapping:
 *   ERROR      - a published article is missing a title, description, H1,
 *                canonical or BlogPosting schema, or is not indexable, or a
 *                known draft has become reachable
 *   WARNING    - missing publication date, missing BreadcrumbList, not in
 *                the sitemap, or no inbound internal links
 *   INFO       - a modified date is absent (normal), or extra schema types
 *   UNVERIFIED - the article could not be retrieved
 */

import fs from "node:fs";
import path from "node:path";

import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult } from "./shared.mjs";
import { canonicalForm } from "../lib/url-utils.mjs";
import { flattenNodes, inferTypes } from "../lib/jsonld.mjs";
import { LIB_DIR } from "../lib/paths.mjs";

const AUDIT = "blog";
const BLOG_DIRECTORY = path.join(LIB_DIR, "blog-data", "posts");

/**
 * Draft files that must never become public routes. Listed explicitly
 * rather than pattern-matched, so this check stays a precise assertion.
 */
const PROTECTED_DRAFTS = Object.freeze([
  "the-ultimate-guide-peb-vs-conventional-steel-fabrication-eastern-india",
]);

export function runBlogAudit({ crawl, discovery }) {
  const findings = [];
  const observations = [];

  /**
   * An "article" is a URL the blog data actually declares. A route that merely
   * looks like an article path - for example a duplicated listing kept so old
   * links do not break - is reported separately instead of being counted as a
   * published article, because calling it one would overstate the blog.
   */
  const declaredArticlePaths = new Set(discovery.blogSlugs.map((slug) => `/blog/${slug}`));

  const articles = crawl.pages.filter((page) => declaredArticlePaths.has(page.path));
  const undeclaredBlogRoutes = crawl.pages.filter(
    (page) => page.kind === "blog-post" && !declaredArticlePaths.has(page.path),
  );
  const listing = crawl.pages.find((page) => page.kind === "blog-listing") || null;

  const sitemapKeys = new Set(
    crawl.sitemap.urls.map((raw) => {
      try {
        return canonicalForm(new URL(raw, crawl.origin));
      } catch {
        return raw;
      }
    }),
  );

  for (const slug of PROTECTED_DRAFTS) {
    const expectedPath = `/blog/${slug}`;
    const routeExists = crawl.pages.some((page) => page.path === expectedPath);
    const slugDeclaredInSource = discovery.blogSlugs.includes(slug);
    const fileOnDisk = fs.existsSync(path.join(BLOG_DIRECTORY, `${slug}.ts`));
    const markdownOnDisk = fs.existsSync(path.join(BLOG_DIRECTORY, `${slug}.md`));

    observations.push({
      code: "protected-draft",
      slug,
      expectedPath,
      slugDeclaredInSource,
      fileOnDisk,
      markdownOnDisk,
      routeReachable: routeExists,
    });

    if (routeExists) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "protected-draft-published",
          url: `${crawl.origin}${expectedPath}`,
          message:
            "A draft that must not be public is reachable as a live blog route. This draft is reserved as a future content-validation fixture and must not be published.",
          evidence: { slug, expectedPath },
        }),
      );
    }

    if (slugDeclaredInSource) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "protected-draft-in-blog-data",
          url: null,
          message:
            "A reserved draft slug is present in the blog data source, which would publish it on the next build even if it is not reachable right now.",
          evidence: { slug, directory: "src/lib/blog-data/posts" },
        }),
      );
    }
  }

  if (!listing) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.WARNING,
        code: "blog-listing-not-reached",
        url: `${crawl.origin}/blog`,
        message: "The blog listing page was not reached during the crawl.",
      }),
    );
  }

  for (const route of undeclaredBlogRoutes) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.INFO,
        code: "blog-route-not-in-source-data",
        url: route.url,
        message: `${route.path} lives under /blog but no blog data declares it, so it is not a published article. If it is a deliberate duplicate retained for old links, it should remain noindex with its canonical pointing at /blog.`,
        evidence: {
          path: route.path,
          noindex: Boolean(route.indexability && route.indexability.noindex),
          canonical: route.indexability ? route.indexability.canonicalTarget : null,
        },
      }),
    );
  }

  for (const article of articles) {
    const head = article.headInfo;
    const h1s = article.contentHeadings.filter((heading) => heading.level === 1);
    const types = structuredDataTypes(article);
    const schemaNodes = jsonLdNodes(article);
    const inSitemap = sitemapKeys.has(canonicalForm(new URL(article.url)));

    const posting = schemaNodes.find((entry) => {
      const nodeTypes = inferTypes(entry.node);
      return nodeTypes.includes("BlogPosting") || nodeTypes.includes("Article");
    });

    const hasPosting = Boolean(posting);
    const hasBreadcrumbs = types.includes("BreadcrumbList");
    const published = posting ? posting.node.datePublished || null : null;
    const modified = posting ? posting.node.dateModified || null : null;

    if (!article.ok) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.UNVERIFIED,
          code: "blog-article-unverified",
          url: article.url,
          message: `This article could not be verified (HTTP ${article.status}).`,
          evidence: { error: article.error, blocked: article.blocked },
        }),
      );

      observations.push({
        code: "blog-article",
        url: article.url,
        path: article.path,
        slug: article.path.replace("/blog/", ""),
        verified: false,
        indexability: "UNVERIFIED",
        httpStatus: article.status,
      });

      continue;
    }

    if (!head || !head.title) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "blog-missing-title",
          url: article.url,
          message: "This article has no title.",
        }),
      );
    }

    if (!head || !head.description) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "blog-missing-description",
          url: article.url,
          message: "This article has no meta description.",
        }),
      );
    }

    if (h1s.length === 0) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "blog-missing-h1",
          url: article.url,
          message: "This article has no H1 in its content.",
        }),
      );
    }

    if (!head || head.canonicalHrefs.length === 0) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "blog-missing-canonical",
          url: article.url,
          message: "This article declares no canonical URL.",
        }),
      );
    }

    if (!hasPosting) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "blog-missing-posting-schema",
          url: article.url,
          message: "This article has no BlogPosting (or Article) structured data.",
          evidence: { typesFound: types },
        }),
      );
    }

    if (hasPosting && !published) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "blog-missing-date-published",
          url: article.url,
          message: "The BlogPosting node has no datePublished, so the article has no declared publication date.",
        }),
      );
    }

    if (hasPosting && !modified) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.INFO,
          code: "blog-missing-date-modified",
          url: article.url,
          message:
            "The BlogPosting node has no dateModified. That is normal for an article that has not been revised.",
        }),
      );
    }

    if (!hasBreadcrumbs) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "blog-missing-breadcrumbs",
          url: article.url,
          message: "This article has no BreadcrumbList structured data.",
        }),
      );
    }

    const state = article.indexability ? article.indexability.state : "UNKNOWN";

    if (state !== "INDEXABLE") {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "blog-not-indexable",
          url: article.url,
          message: `This published article is not indexable (state ${state}).`,
          evidence: { indexability: state, reasons: article.indexability ? article.indexability.reasons : [] },
        }),
      );
    }

    if (!inSitemap) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "blog-not-in-sitemap",
          url: article.url,
          message: "This article is not listed in sitemap.xml.",
        }),
      );
    }

    if (article.inboundLinkCount === 0) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "blog-no-inbound-links",
          url: article.url,
          message: "No crawled page links to this article, so it is only discoverable through the sitemap.",
        }),
      );
    }

    const outboundInternal = new Set(
      article.anchors
        .filter((anchor) => anchor.kind === "internal" && anchor.resolvedUrl && !anchor.isAsset)
        .map((anchor) => anchor.resolvedUrl),
    );

    const outboundExternal = article.anchors.filter((anchor) => anchor.kind === "external");

    observations.push({
      code: "blog-article",
      url: article.url,
      path: article.path,
      slug: article.path.replace("/blog/", ""),
      title: head ? head.title : null,
      titleLength: head ? head.titleLength : 0,
      descriptionLength: head ? head.descriptionLength : 0,
      canonical: article.indexability ? article.indexability.canonicalTarget : null,
      h1Count: h1s.length,
      h1Text: h1s.length > 0 ? h1s[0].text : null,
      hasPostingSchema: hasPosting,
      hasBreadcrumbs,
      datePublished: published,
      dateModified: modified,
      indexability: state,
      inSitemap,
      inboundInternalLinks: article.inboundLinkCount,
      outboundInternalLinks: outboundInternal.size,
      outboundExternalLinks: outboundExternal.length,
      wordCount: article.wordCount,
      structuredDataTypes: types,
      httpStatus: article.status,
    });
  }

  const declaredButNotCrawled = discovery.blogSlugs.filter(
    (slug) => !crawl.pages.some((page) => page.path === `/blog/${slug}`),
  );

  for (const slug of declaredButNotCrawled) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.WARNING,
        code: "blog-slug-not-reached",
        url: `${crawl.origin}/blog/${slug}`,
        message:
          "This slug is declared in the blog data but no page was reached for it, so the declared and served article sets differ.",
        evidence: { slug },
      }),
    );
  }

  const undatedArticles = observations.filter((entry) => entry.hasPostingSchema && !entry.datePublished);

  return buildAuditResult({
    id: AUDIT,
    name: "Blog health",
    description:
      "Per-article metadata, canonical, H1, BlogPosting and BreadcrumbList schema, dates, links, indexability and sitemap inclusion. No article is ever generated or edited.",
    findings,
    summary: {
      publishedArticlesFound: articles.length,
      declaredSlugs: discovery.blogSlugs.length,
      declaredButNotReached: declaredButNotCrawled,
      articlesInSitemap: observations.filter((entry) => entry.inSitemap).length,
      articlesIndexable: observations.filter((entry) => entry.indexability === "INDEXABLE").length,
      articlesWithPostingSchema: observations.filter((entry) => entry.hasPostingSchema).length,
      articlesWithBreadcrumbs: observations.filter((entry) => entry.hasBreadcrumbs).length,
      articlesWithoutDatePublished: undatedArticles.length,
      articlesWithoutDateModified: observations.filter((entry) => entry.hasPostingSchema && !entry.dateModified).length,
      protectedDraftSlugs: [...PROTECTED_DRAFTS],
      listingReached: Boolean(listing),
      policy:
        "This audit reads the existing blog only. It generates no article, edits no article, and publishes no draft.",
    },
    observations,
  });
}

function jsonLdNodes(page) {
  const blocks = (page.jsonLdBlocks || []).map((block, index) => ({
    index,
    viaSrc: block.viaSrc || null,
    ok: true,
    raw: block.raw,
    data: safeParse(block.raw),
  }));
  return flattenNodes(blocks);
}

function structuredDataTypes(page) {
  return [...new Set(jsonLdNodes(page).flatMap((entry) => inferTypes(entry.node)))].sort();
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

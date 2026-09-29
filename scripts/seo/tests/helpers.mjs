/**
 * Test fixtures for the SEO auditor.
 *
 * Every test runs completely offline. Pages are constructed from synthetic
 * HTML through the same `createPageRecord` path the crawler uses, so a test
 * exercises the real extraction and classification code rather than a
 * hand-built object that could drift away from it.
 *
 * The HTTP client is never used directly: where a test needs a response,
 * a stub client is injected, so no test can touch the network.
 */

import { createPageRecord } from "../lib/page-model.mjs";
import { classifyIndexability } from "../lib/indexability.mjs";
import { parseRobotsTxt } from "../lib/robots-parse.mjs";
import { classifyRouteKind } from "../lib/url-utils.mjs";

export const TEST_ORIGIN = "https://aken.firm.in";

export function makePage(options = {}) {
  const {
    path = "/",
    html = "<!doctype html><html><head><title>Test</title></head><body><h1>Test</h1></body></html>",
    status = 200,
    headers = {},
    contentType = "text/html; charset=utf-8",
    robots = null,
    fromSource = true,
    fromSitemap = false,
    source = "app-filesystem",
    kind = null,
    body = null,
    error = null,
    blocked = null,
  } = options;

  const url = new URL(path, TEST_ORIGIN);
  const response = {
    status,
    ok: status >= 200 && status < 300,
    statusText: String(status),
    contentType,
    bytesRead: (body !== null ? body : html).length,
    bodyTruncated: false,
    headers,
    redirects: [],
    finalUrl: url.toString(),
    error,
    blocked,
    body: body !== null ? body : html,
  };

  const record = createPageRecord({
    url,
    path,
    kind: kind || classifyRouteKind(path),
    source,
    origin: null,
    response,
    referrers: [],
  });

  record.fromSource = fromSource;
  record.fromSitemap = fromSitemap;
  record.inboundLinkCount = 0;
  record.indexability = classifyIndexability({ page: record, robots });

  return record;
}

export function makeRobots(robotsText, origin = TEST_ORIGIN) {
  if (!robotsText) {
    return {
      url: `${origin}/robots.txt`,
      status: 404,
      ok: false,
      reached: true,
      error: null,
      blocked: null,
      contentType: "text/plain",
      bytes: 0,
      raw: "",
      parsed: null,
      sitemapsDeclared: [],
    };
  }

  const parsed = parseRobotsTxt(robotsText);
  return {
    url: `${origin}/robots.txt`,
    status: 200,
    ok: true,
    reached: true,
    error: null,
    blocked: null,
    contentType: "text/plain",
    bytes: robotsText.length,
    raw: robotsText,
    parsed,
    sitemapsDeclared: [...parsed.sitemaps],
  };
}

export function makeSitemap(sitemapUrls = [], options = {}) {
  const origin = options.origin || TEST_ORIGIN;
  return {
    primary: {
      url: `${origin}/sitemap.xml`,
      status: options.status ?? 200,
      ok: (options.status ?? 200) < 300,
      error: options.error || null,
      blocked: null,
      contentType: "application/xml",
      bytes: 0,
      bodyTruncated: false,
      raw: options.raw || "",
      parsed: options.parsed || null,
    },
    documents: [],
    urls: sitemapUrls,
    nested: [],
    errors: [],
    networkEnabled: true,
    usedDefaultPath: true,
    capped: false,
  };
}

export function makeCrawl(options = {}) {
  const origin = options.origin || TEST_ORIGIN;
  const robots = options.robots || makeRobots(options.robotsText || "", origin);
  const pages = options.pages || [];

  return {
    origin,
    baseUrl: `${origin}/`,
    networkEnabled: options.networkEnabled !== false,
    robots,
    sitemap: options.sitemap || makeSitemap(options.sitemapUrls || [], { origin }),
    pages,
    skipped: options.skipped || [],
    capReached: Boolean(options.capReached),
    stats: {
      seedCount: pages.length,
      pagesFetched: pages.length,
      htmlPages: pages.filter((page) => page.doc !== null).length,
      linkOnlyPages: pages.filter((page) => page.source === "link").length,
      sitemapOnlyPaths: [],
      sourceOnlyPaths: [],
      skippedCount: (options.skipped || []).length,
    },
  };
}

export function makeDiscovery(options = {}) {
  const candidates = options.candidates || [];
  return {
    candidates,
    excluded: options.excluded || [],
    blogSlugs: options.blogSlugs || [],
    serviceSlugs: options.serviceSlugs || [],
    projectSlugs: options.projectSlugs || [],
    sitemapDeclaredPaths: options.sitemapDeclaredPaths || [],
    warnings: options.warnings || [],
    counts: {
      pageFiles: candidates.length,
      candidateRoutes: candidates.length,
      excludedRoutes: (options.excluded || []).length,
      blogPosts: (options.blogSlugs || []).length,
      servicePages: (options.serviceSlugs || []).length,
      publishedProjects: (options.projectSlugs || []).length,
    },
  };
}

/** A stub HTTP client. Never opens a socket. */
export function makeStubClient(handler, options = {}) {
  const counters = { requests: 0, retries: 0, blocked: 0, bytes: 0 };
  const config = {
    allowNetwork: options.allowNetwork !== false,
    concurrency: options.concurrency || 4,
    timeoutMs: 10_000,
    retries: 0,
    minHostDelayMs: 0,
    maxRedirects: 5,
    maxResponseBytes: 1024 * 1024,
    userAgent: "test",
  };

  const respond = async (url) => {
    counters.requests += 1;
    const result = await handler(url);
    return {
      url,
      finalUrl: url,
      status: 0,
      ok: false,
      statusText: "",
      headers: {},
      contentType: "",
      body: "",
      bytesRead: 0,
      bodyTruncated: false,
      redirects: [],
      blocked: null,
      error: null,
      ...result,
    };
  };

  return {
    get: (url) => respond(url),
    head: (url) => respond(url),
    counters,
    config,
  };
}

/**
 * Crawl orchestration.
 *
 * Retrieves robots.txt and the sitemap, seeds the frontier from the
 * project's own route files plus the live sitemap, then walks the site
 * breadth-first following internal links.
 *
 * Two rules keep this safe and bounded:
 *   - every URL goes through the HTTP client, which re-checks the SSRF
 *     guard on every hop and enforces the concurrency, timeout, retry and
 *     byte ceilings
 *   - the frontier only ever grows with same-host, non-asset URLs, so a
 *     single page cannot cause the auditor to leave the site
 *
 * Nothing is written back to the site. This module only reads.
 */

import { createPageRecord } from "./page-model.mjs";
import { buildSeedFrontier, classifyDiscoveredUrl } from "./crawl-seeds.mjs";
import { fetchRobotsTxt } from "./robots-fetch.mjs";
import { fetchSitemaps } from "./sitemap-fetch.mjs";
import { classifyIndexability } from "./indexability.mjs";
import { LINK_KIND } from "./extract/links.mjs";
import { classifyRouteKind, normalizePathname, pageKey } from "./url-utils.mjs";
import { EXCLUDED_ROUTE_PREFIXES } from "./paths.mjs";

const DEFAULT_LIMITS = { maxPages: 60, maxSitemaps: 5, includeLinkedPages: true };

export async function crawlSite({ baseUrl, client, discovery, limits = {} }) {
  const settings = { ...DEFAULT_LIMITS, ...limits };
  const origin = baseUrl.origin;
  const networkEnabled = client.config.allowNetwork !== false;

  const robots = await fetchRobotsTxt(client, origin, { networkEnabled });
  const sitemap = await fetchSitemaps(client, origin, {
    declaredUrls: robots.sitemapsDeclared,
    networkEnabled,
    maxSitemaps: settings.maxSitemaps,
  });

  const knownPaths = new Set(discovery.candidates.map((candidate) => normalizePathname(candidate.path)));
  const frontier = buildSeedFrontier({
    origin,
    candidates: discovery.candidates,
    sitemapUrls: sitemap.urls,
    excludedPrefixes: EXCLUDED_ROUTE_PREFIXES,
    knownPaths,
  });

  const queue = [...frontier.seeds];
  const queued = new Set(queue.map((seed) => pageKey(seed.url)));
  const records = new Map();
  const referrers = new Map();
  const skipped = [...frontier.skipped];
  let cursor = 0;
  let capReached = false;

  async function worker() {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= queue.length) return;

      const seed = queue[index];
      const key = pageKey(seed.url);
      if (records.has(key)) continue;

      if (records.size >= settings.maxPages) {
        capReached = true;
        skipped.push({ url: seed.url.toString(), reason: `page cap of ${settings.maxPages} reached` });
        continue;
      }

      const response = await fetchPage(client, seed.url, networkEnabled);
      const record = createPageRecord({
        url: seed.url,
        path: seed.path,
        kind: seed.kind,
        source: seed.source,
        origin: seed.origin,
        response,
        referrers: [...(referrers.get(key) || [])],
      });

      record.fromSitemap = Boolean(seed.fromSitemap);
      record.fromSource = Boolean(seed.fromSource);
      record.inboundLinkCount = 0;
      record.indexability = classifyIndexability({ page: record, robots: robots.parsed });

      records.set(key, record);
      enqueueLinkedPages(record);
    }
  }

  function enqueueLinkedPages(record) {
    if (!settings.includeLinkedPages || !record.doc) return;

    for (const anchor of record.anchors) {
      if (anchor.kind !== LINK_KIND.INTERNAL || !anchor.url) continue;

      const verdict = classifyDiscoveredUrl(anchor.url, {
        origin,
        excludedPrefixes: EXCLUDED_ROUTE_PREFIXES,
      });
      if (!verdict.crawl) continue;

      const targetUrl = new URL(verdict.path, origin);
      const targetKey = pageKey(targetUrl);

      if (!referrers.has(targetKey)) referrers.set(targetKey, new Set());
      referrers.get(targetKey).add(record.path);

      const existing = records.get(targetKey);
      if (existing) {
        existing.inboundLinkCount += 1;
        continue;
      }

      if (queued.has(targetKey)) continue;
      queued.add(targetKey);
      queue.push({
        url: targetUrl,
        path: verdict.path,
        kind: classifyRouteKind(verdict.path),
        source: "link",
        origin: `linked from ${record.path}`,
        fromSitemap: false,
        fromSource: false,
      });
    }
  }

  const workerCount = Math.max(1, Math.min(client.config.concurrency, queue.length || 1));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  const pages = [...records.values()].sort((left, right) => left.path.localeCompare(right.path));
  for (const page of pages) {
    page.inboundLinkCount = (referrers.get(pageKey(new URL(page.url))) || new Set()).size;
  }

  return {
    origin,
    baseUrl: baseUrl.toString(),
    networkEnabled,
    robots,
    sitemap,
    pages,
    skipped,
    capReached,
    stats: {
      seedCount: frontier.seeds.length,
      pagesFetched: pages.length,
      htmlPages: pages.filter((page) => page.doc !== null).length,
      linkOnlyPages: pages.filter((page) => page.source === "link").length,
      sitemapOnlyPaths: pages.filter((page) => page.fromSitemap && !page.fromSource).map((page) => page.path),
      sourceOnlyPaths: pages.filter((page) => page.fromSource && !page.fromSitemap).map((page) => page.path),
      skippedCount: skipped.length,
    },
  };
}

async function fetchPage(client, url, networkEnabled) {
  if (!networkEnabled) {
    return {
      status: 0,
      ok: false,
      contentType: "",
      bytesRead: 0,
      bodyTruncated: false,
      headers: {},
      redirects: [],
      error: { code: "NETWORK_DISABLED", message: "network access is disabled for this run" },
      blocked: null,
      body: "",
    };
  }
  return client.get(url);
}

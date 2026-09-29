/**
 * Builds the crawl frontier.
 *
 * Three independent sources feed the frontier, and each is tagged so the
 * report can say where a URL came from:
 *
 *   source       - derived from the project's own route files
 *   sitemap      - present in the live sitemap.xml
 *   link         - discovered only by following an internal link
 *
 * The distinction is what makes the sitemap audit meaningful: a URL known
 * only from the sitemap is a page the site claims to publish but that no
 * source route produces, and a URL known only from source is a page that
 * exists but was left out of the sitemap.
 */

import { classifyRouteKind, isAssetPath, normalizePathname, pageKey } from "./url-utils.mjs";

/**
 * @param {object} input
 * @param {string} input.origin
 * @param {Array<{path: string, kind: string, source: string, origin: string}>} input.candidates
 * @param {Array<string>} input.sitemapUrls   absolute URLs from sitemap.xml
 * @param {Array<string>} input.excludedPrefixes
 * @param {Set<string>} [input.knownPaths]
 */
export function buildSeedFrontier({ origin, candidates, sitemapUrls, excludedPrefixes, knownPaths }) {
  const seeds = new Map();
  const skipped = [];
  const known = knownPaths || new Set(candidates.map((candidate) => normalizePathname(candidate.path)));

  for (const candidate of candidates) {
    const path = normalizePathname(candidate.path);
    const url = new URL(path, origin);
    const key = pageKey(url);
    if (seeds.has(key)) continue;
    seeds.set(key, {
      url,
      path,
      kind: candidate.kind || classifyRouteKind(path),
      source: candidate.source || "source",
      origin: candidate.origin || null,
      fromSitemap: false,
      fromSource: true,
    });
  }

  for (const rawUrl of sitemapUrls) {
    let url;
    try {
      url = new URL(rawUrl, origin);
    } catch {
      skipped.push({ url: rawUrl, reason: "sitemap URL could not be parsed" });
      continue;
    }

    if (url.hostname !== new URL(origin).hostname) {
      skipped.push({ url: rawUrl, reason: "sitemap URL is on a different host" });
      continue;
    }

    if (isAssetPath(url.pathname)) {
      skipped.push({ url: rawUrl, reason: "sitemap URL points at a static asset" });
      continue;
    }

    const path = normalizePathname(url.pathname);
    if (excludedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      skipped.push({ url: rawUrl, reason: "sitemap URL is under an excluded prefix" });
      continue;
    }

    const key = pageKey(url);
    const existing = seeds.get(key);
    if (existing) {
      existing.fromSitemap = true;
      continue;
    }

    seeds.set(key, {
      url,
      path,
      kind: classifyRouteKind(path),
      source: "sitemap",
      origin: "sitemap.xml",
      fromSitemap: true,
      fromSource: known.has(path),
    });
  }

  return { seeds: [...seeds.values()], skipped };
}

/**
 * A URL reached by following a link. Returns null when the URL should not
 * be crawled at all (off-site, asset, excluded prefix, non-HTML scheme).
 */
export function classifyDiscoveredUrl(url, { origin, excludedPrefixes }) {
  if (!url) return { crawl: false, reason: "no URL" };
  if (url.hostname !== new URL(origin).hostname) return { crawl: false, reason: "off-site" };
  if (isAssetPath(url.pathname)) return { crawl: false, reason: "static asset" };

  const path = normalizePathname(url.pathname);
  if (excludedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return { crawl: false, reason: "excluded prefix" };
  }

  return { crawl: true, path };
}

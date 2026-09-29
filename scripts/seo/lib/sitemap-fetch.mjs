/**
 * Fetches every sitemap the site declares and flattens it into one URL set.
 *
 * Both sitemap shapes are handled: a flat <urlset> and a <sitemapindex>
 * whose children are fetched too. Child fetching is bounded by
 * `maxSitemaps` so a site cannot make the auditor issue an unbounded
 * number of requests by declaring a large index.
 *
 * Nested sitemaps are only followed when they resolve to the same host,
 * which keeps the auditor from being pointed at a third party via a
 * sitemap index entry.
 */

import { parseSitemapXml } from "./sitemap-parse.mjs";

const MAX_SITEMAP_BYTES = 8 * 1024 * 1024;

export async function fetchSitemaps(client, origin, options = {}) {
  const {
    declaredUrls = [],
    networkEnabled = true,
    maxSitemaps = 5,
    defaultPath = "/sitemap.xml",
  } = options;

  const originHost = new URL(origin).hostname;
  const result = {
    primary: null,
    documents: [],
    urls: [],
    nested: [],
    errors: [],
    networkEnabled,
    /**
     * True only when nothing declared a sitemap and the auditor had to fall
     * back to /sitemap.xml. This is NOT the same as "the sitemap lives at the
     * conventional path": a site whose robots.txt declares
     * https://example.com/sitemap.xml has a conventional sitemap but needs no
     * fallback. Conflating the two produced a misleading report line, so both
     * facts are recorded separately.
     */
    usedDefaultPath: false,
    atConventionalPath: false,
    capped: false,
  };

  const queue = [];
  for (const declared of declaredUrls) {
    try {
      const url = new URL(declared, origin);
      if (url.hostname === originHost) queue.push(url);
      else result.errors.push({ url: String(declared), message: "declared sitemap is on a different host" });
    } catch {
      result.errors.push({ url: String(declared), message: "declared sitemap URL could not be parsed" });
    }
  }

  if (queue.length === 0) {
    queue.push(new URL(defaultPath, origin));
    result.usedDefaultPath = true;
  }

  if (!networkEnabled) {
    result.primary = blankDocument(queue[0].toString(), "NETWORK_DISABLED");
    return result;
  }

  const seen = new Set();
  let fetched = 0;

  while (queue.length > 0) {
    const url = queue.shift();
    const key = url.toString();
    if (seen.has(key)) continue;
    seen.add(key);

    if (fetched >= maxSitemaps) {
      result.capped = true;
      result.errors.push({ url: key, message: `sitemap limit of ${maxSitemaps} reached; not fetched` });
      continue;
    }
    fetched += 1;

    const document = await fetchOne(client, url);
    result.documents.push(document);
    if (!result.primary) result.primary = document;

    if (document.parsed) {
      for (const entry of document.parsed.entries) {
        if (entry.loc) result.urls.push(entry.loc);
      }
      for (const nested of document.parsed.nestedSitemaps) {
        if (!nested.loc) continue;
        try {
          const nestedUrl = new URL(nested.loc, origin);
          if (nestedUrl.hostname !== originHost) {
            result.errors.push({ url: nested.loc, message: "nested sitemap is on a different host" });
            continue;
          }
          result.nested.push(nested.loc);
          queue.push(nestedUrl);
        } catch {
          result.errors.push({ url: nested.loc, message: "nested sitemap URL could not be parsed" });
        }
      }
    }
  }

  result.urls = [...new Set(result.urls)];

  if (result.primary) {
    try {
      result.atConventionalPath = new URL(result.primary.url).pathname === defaultPath;
    } catch {
      result.atConventionalPath = false;
    }
  }

  return result;
}

async function fetchOne(client, url) {
  const document = {
    url: url.toString(),
    status: 0,
    ok: false,
    error: null,
    blocked: null,
    contentType: "",
    bytes: 0,
    bodyTruncated: false,
    raw: "",
    parsed: null,
  };

  const response = await client.get(url, { maxBytes: MAX_SITEMAP_BYTES });
  document.status = response.status;
  document.ok = response.ok;
  document.contentType = response.contentType || "";
  document.bytes = response.bytesRead || 0;
  document.bodyTruncated = Boolean(response.bodyTruncated);
  document.blocked = response.blocked || null;
  document.error = response.error || null;

  if (response.ok && typeof response.body === "string") {
    document.raw = response.body;
    document.parsed = parseSitemapXml(response.body);
  }

  return document;
}

function blankDocument(url, code) {
  return {
    url,
    status: 0,
    ok: false,
    error: { code, message: "network access is disabled for this run" },
    blocked: null,
    contentType: "",
    bytes: 0,
    bodyTruncated: false,
    raw: "",
    parsed: null,
  };
}

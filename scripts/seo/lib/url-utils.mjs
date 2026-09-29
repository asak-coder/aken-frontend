/**
 * URL normalisation and classification.
 *
 * Two different ideas are kept deliberately separate:
 *
 *  1. `normalizePathname` - a *display/normalisation* helper. It collapses
 *     duplicate slashes and removes a trailing slash (except on the root)
 *     so two spellings of the same path can be compared.
 *  2. `pageKey` - the identity used to de-duplicate the crawl. It is
 *     origin + normalised path with the query string preserved, because
 *     `?utm_source=` variants are still the same page for crawling but a
 *     *different* finding for the URL-quality audit.
 *
 * Nothing here rewrites a live URL. It only decides how the auditor
 * compares them.
 */

import { SITE } from "./config.mjs";

const ASSET_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".svg",
  ".ico",
  ".bmp",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".xml",
  ".txt",
  ".pdf",
  ".zip",
  ".gz",
  ".mp4",
  ".webm",
  ".mov",
  ".mp3",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".map",
  ".csv",
  ".xlsx",
  ".doc",
  ".docx",
]);

const NON_HTTP_SCHEMES = new Set([
  "mailto:",
  "tel:",
  "sms:",
  "javascript:",
  "data:",
  "blob:",
  "ftp:",
  "file:",
  "whatsapp:",
  "intent:",
  "geo:",
  "callto:",
]);

export function parseUrl(value, base) {
  try {
    return base ? new URL(value, base) : new URL(value);
  } catch {
    return null;
  }
}

export function isHttpUrl(url) {
  return url instanceof URL && (url.protocol === "http:" || url.protocol === "https:");
}

export function isNonHttpHref(href) {
  const value = String(href || "").trim().toLowerCase();
  if (!value) return true;
  if (value.startsWith("#")) return true;
  for (const scheme of NON_HTTP_SCHEMES) {
    if (value.startsWith(scheme)) return true;
  }
  return false;
}

export function isHashOnlyHref(href) {
  return String(href || "").trim().startsWith("#");
}

export function isAssetPath(pathname) {
  const lower = String(pathname || "").toLowerCase();
  const dotIndex = lower.lastIndexOf(".");
  if (dotIndex <= -1) return false;
  const extension = lower.slice(dotIndex);
  return ASSET_EXTENSIONS.has(extension);
}

/** Collapse duplicate slashes; drop a trailing slash except on the root. */
export function normalizePathname(pathname) {
  let value = String(pathname || "/");
  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/\/{2,}/g, "/");
  if (value.length > 1 && value.endsWith("/")) {
    value = value.replace(/\/+$/, "");
  }
  return value === "" ? "/" : value;
}

export function hasTrailingSlash(url) {
  return url instanceof URL && url.pathname.length > 1 && url.pathname.endsWith("/");
}

/** True for `/Path` style URLs, ignoring the query string. */
export function hasUppercasePathSegment(url) {
  if (!(url instanceof URL)) return false;
  return /[A-Z]/.test(url.pathname);
}

export function isSameSite(url) {
  if (!(url instanceof URL)) return false;
  const host = url.hostname.toLowerCase();
  return host === SITE.productionHost || host === SITE.alternateHost;
}

export function isPrimaryHost(url) {
  return url instanceof URL && url.hostname.toLowerCase() === SITE.productionHost;
}

/** Origin + normalised path + existing query, used as crawl identity. */
export function pageKey(url) {
  if (!(url instanceof URL)) return "";
  const origin = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`;
  return `${origin}${normalizePathname(url.pathname)}${url.search || ""}`;
}

/**
 * Identity without the query string. Used when asking "is this the same
 * document?" rather than "is this the same request?".
 */
export function pageKeyWithoutQuery(url) {
  if (!(url instanceof URL)) return "";
  return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}${normalizePathname(url.pathname)}`;
}

export function absoluteUrlToString(url) {
  if (!(url instanceof URL)) return "";
  return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}${url.search}`;
}

/** Absolute, query-free, fragment-free form. The canonical comparison form. */
export function canonicalForm(url) {
  if (!(url instanceof URL)) return "";
  return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}${normalizePathname(url.pathname)}`;
}

export function relativePath(url) {
  if (!(url instanceof URL)) return "";
  return normalizePathname(url.pathname);
}

/** Unwrap Next.js image optimiser URLs back to the underlying asset. */
export function unwrapNextImageUrl(src) {
  const value = String(src || "");
  const marker = "/_next/image";
  if (!value.includes(marker)) return value;
  try {
    const parsed = new URL(value, SITE.productionOrigin);
    const inner = parsed.searchParams.get("url");
    return inner ? decodeURIComponent(inner) : value;
  } catch {
    return value;
  }
}

/** Paths the auditor must never treat as public indexable pages. */
export function isExcludedPath(pathname, excludedPrefixes) {
  const value = normalizePathname(pathname);
  return excludedPrefixes.some(
    (prefix) => value === prefix || value.startsWith(`${prefix}/`),
  );
}

/** A short, stable label for grouping, e.g. "services-page" or "blog-post". */
export function classifyRouteKind(pathname) {
  const value = normalizePathname(pathname);
  if (value === "/") return "home";
  if (value === "/blog") return "blog-listing";
  if (value.startsWith("/blog/")) return "blog-post";
  if (value === "/projects") return "project-listing";
  if (value.startsWith("/projects/")) return "project-case-study";
  if (value === "/services") return "services-listing";
  if (value.startsWith("/services/")) return "service-page";
  if (value === "/enquiry") return "enquiry";
  if (value === "/contact") return "contact";
  if (value === "/about") return "about";
  if (value.startsWith("/admin")) return "admin";
  if (value.startsWith("/api")) return "api";
  return "static-page";
}

/** Query parameters that never change page identity. */
export const TRACKING_QUERY_PARAMS = Object.freeze([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
  "ref",
  "source",
]);

export function trackingParamsPresent(url) {
  if (!(url instanceof URL)) return [];
  const found = [];
  for (const key of url.searchParams.keys()) {
    if (TRACKING_QUERY_PARAMS.includes(key.toLowerCase())) found.push(key);
  }
  return found;
}

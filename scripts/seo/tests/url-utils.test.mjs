/**
 * TEST 11 - URL normalisation and classification.
 *
 * The distinction these tests protect: `normalizePathname` is for display
 * and comparison, while `pageKey` is the crawl identity and keeps the query
 * string. Collapsing the two would either lose tracking-parameter findings
 * or treat two spellings of one page as two pages.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  canonicalForm,
  classifyRouteKind,
  hasTrailingSlash,
  hasUppercasePathSegment,
  isAssetPath,
  isExcludedPath,
  isHashOnlyHref,
  isHttpUrl,
  isNonHttpHref,
  isPrimaryHost,
  isSameSite,
  normalizePathname,
  pageKey,
  pageKeyWithoutQuery,
  parseUrl,
  trackingParamsPresent,
  unwrapNextImageUrl,
} from "../lib/url-utils.mjs";

const ORIGIN = "https://aken.firm.in";

test("collapses duplicate slashes in a pathname", () => {
  assert.equal(normalizePathname("//services///peb//"), "/services/peb");
});

test("drops a trailing slash except on the root", () => {
  assert.equal(normalizePathname("/about/"), "/about");
  assert.equal(normalizePathname("/"), "/");
});

test("adds a leading slash to a bare path", () => {
  assert.equal(normalizePathname("about"), "/about");
});

test("never returns an empty string for a pathname", () => {
  assert.equal(normalizePathname(""), "/");
});

test("keeps the query string in the crawl identity but drops it from the document identity", () => {
  const url = new URL(`${ORIGIN}/services/peb?utm_source=newsletter`);

  assert.equal(pageKey(url), `${ORIGIN}/services/peb?utm_source=newsletter`);
  assert.equal(pageKeyWithoutQuery(url), `${ORIGIN}/services/peb`);
});

test("treats two spellings of one path as the same crawl identity", () => {
  assert.equal(pageKey(new URL(`${ORIGIN}/about/`)), pageKey(new URL(`${ORIGIN}//about`)));
});

test("builds an absolute query-free canonical form", () => {
  assert.equal(
    canonicalForm(new URL(`${ORIGIN}/blog/?utm_campaign=x#top`)),
    `${ORIGIN}/blog`,
  );
});

test("identifies tracking parameters without flagging real ones", () => {
  const url = new URL(`${ORIGIN}/?utm_source=a&gclid=b&page=2&q=steel`);

  assert.deepEqual(trackingParamsPresent(url).sort(), ["gclid", "utm_source"]);
});

test("recognises asset paths by extension", () => {
  assert.ok(isAssetPath("/projects/peb-shed-erection.jpg"));
  assert.ok(isAssetPath("/_next/static/css/app.css"));
  assert.ok(isAssetPath("/sitemap.xml"));
  assert.equal(isAssetPath("/services/peb"), false);
  assert.equal(isAssetPath("/blog/peb-cost-per-sq-ft-india"), false);
});

test("unwraps a Next.js image optimiser URL back to the underlying asset", () => {
  const wrapped = "/_next/image?url=%2Fprojects%2Fpeb-shed-erection.jpg&w=1920&q=75";
  assert.equal(unwrapNextImageUrl(wrapped), "/projects/peb-shed-erection.jpg");
  assert.equal(unwrapNextImageUrl("/projects/peb-shed-erection.jpg"), "/projects/peb-shed-erection.jpg");
});

test("classifies the site's own hosts as same-site and foreign hosts as not", () => {
  assert.ok(isSameSite(new URL(`${ORIGIN}/about`)));
  assert.ok(isSameSite(new URL("https://www.aken.firm.in/about")));
  assert.equal(isSameSite(new URL("https://example.com/about")), false);
  assert.ok(isPrimaryHost(new URL(`${ORIGIN}/about`)));
  assert.equal(isPrimaryHost(new URL("https://www.aken.firm.in/about")), false);
});

test("rejects non-http hrefs and accepts real ones", () => {
  for (const href of ["mailto:info@aken.firm.in", "tel:+911234567890", "javascript:void(0)", "data:text/plain,x", "ftp://x"]) {
    assert.ok(isNonHttpHref(href), `${href} must be treated as non-http`);
  }
  assert.equal(isNonHttpHref("/about"), false);
  assert.equal(isNonHttpHref("https://aken.firm.in/about"), false);
  assert.ok(isHashOnlyHref("#section"));
  assert.equal(isHashOnlyHref("/about#section"), false);
});

test("recognises only http and https URLs", () => {
  assert.ok(isHttpUrl(new URL("https://aken.firm.in")));
  assert.ok(isHttpUrl(new URL("http://aken.firm.in")));
  assert.equal(isHttpUrl(new URL("mailto:a@b.c")), false);
});

test("excludes admin, API and report prefixes without over-matching", () => {
  const prefixes = ["/admin", "/api", "/reports"];

  assert.ok(isExcludedPath("/admin", prefixes));
  assert.ok(isExcludedPath("/admin/login", prefixes));
  assert.ok(isExcludedPath("/api/leads", prefixes));
  assert.equal(isExcludedPath("/administrator", prefixes), false, "a prefix must not match a longer word");
  assert.equal(isExcludedPath("/about", prefixes), false);
});

test("classifies route kinds from the path alone", () => {
  assert.equal(classifyRouteKind("/"), "home");
  assert.equal(classifyRouteKind("/blog"), "blog-listing");
  assert.equal(classifyRouteKind("/blog/peb-cost-per-sq-ft-india"), "blog-post");
  assert.equal(classifyRouteKind("/services"), "services-listing");
  assert.equal(classifyRouteKind("/services/peb"), "service-page");
  assert.equal(classifyRouteKind("/projects"), "project-listing");
  assert.equal(classifyRouteKind("/projects/any"), "project-case-study");
  assert.equal(classifyRouteKind("/privacy-policy"), "static-page");
  assert.equal(classifyRouteKind("/admin/login"), "admin");
});

test("detects a trailing slash and an uppercase segment on a live URL", () => {
  assert.ok(hasTrailingSlash(new URL(`${ORIGIN}/about/`)));
  assert.equal(hasTrailingSlash(new URL(`${ORIGIN}/about`)), false);
  assert.ok(hasUppercasePathSegment(new URL(`${ORIGIN}/About`)));
  assert.equal(hasUppercasePathSegment(new URL(`${ORIGIN}/about`)), false);
});

test("returns null rather than throwing for an unparseable URL", () => {
  assert.equal(parseUrl("not a url"), null);
  assert.equal(parseUrl("/relative", ORIGIN).toString(), `${ORIGIN}/relative`);
  assert.equal(pageKey("not a url"), "");
  assert.equal(canonicalForm(null), "");
});

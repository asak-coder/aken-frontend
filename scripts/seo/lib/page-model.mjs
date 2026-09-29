/**
 * Turns one HTTP result into the page record every audit reads.
 *
 * Extraction happens exactly once per page here, so no audit has to parse
 * HTML itself. Each audit then works on plain data, which keeps the audits
 * pure and independently testable.
 *
 * Non-HTML responses (images, XML, PDFs, redirects) intentionally produce
 * a record with no DOM: parsing a JPEG as HTML would generate nonsense
 * findings about "missing title tags".
 */

import { parseDocument } from "./html-dom.mjs";
import { extractHeadInfo } from "./extract/meta.mjs";
import { analyseHeadingStructure, extractHeadings } from "./extract/headings.mjs";
import { extractAnchors } from "./extract/links.mjs";
import { extractImages } from "./extract/images.mjs";
import { extractJsonLdScripts } from "./extract/jsonld-blocks.mjs";
import { bodyText, countWords, mainContentText } from "./extract/text.mjs";
import { normalizePathname } from "./url-utils.mjs";

const HEADERS_KEPT = new Set([
  "x-robots-tag",
  "content-type",
  "cache-control",
  "last-modified",
  "etag",
  "location",
  "server",
]);

export function createPageRecord({ url, path, kind, source, origin, response, referrers }) {
  const record = {
    url: url.toString(),
    path: normalizePathname(path),
    kind,
    source,
    origin: origin || null,
    referrers: [...(referrers || [])],

    status: response && Number.isFinite(response.status) ? response.status : 0,
    ok: Boolean(response && response.ok),
    statusText: response ? response.statusText || "" : "",
    contentType: response ? response.contentType || "" : "",
    contentTypeShort: shortContentType(response ? response.contentType : ""),
    bytesRead: response ? response.bytesRead || 0 : 0,
    bodyTruncated: Boolean(response && response.bodyTruncated),
    finalUrl: response && response.finalUrl ? response.finalUrl.toString() : url.toString(),
    redirects: response && response.redirects ? response.redirects : [],

    error: response ? response.error || null : { code: "NOT_FETCHED", message: "page was not fetched" },
    blocked: response ? response.blocked || null : null,

    headers: pickHeaders(response ? response.headers : null),

    doc: null,
    headInfo: null,
    headings: [],
    contentHeadings: [],
    headingStructure: null,
    anchors: [],
    images: [],
    jsonLdBlocks: [],
    bodyText: "",
    mainText: "",
    wordCount: 0,
  };

  if (!record.ok || !isHtml(record.contentType)) {
    return record;
  }

  const html = response.body || "";
  if (!html) {
    record.error = { code: "EMPTY_BODY", message: "HTML response had an empty body" };
    return record;
  }

  const doc = parseDocument(html);
  record.doc = doc;
  record.headInfo = extractHeadInfo(doc);
  record.headings = extractHeadings(doc);
  record.contentHeadings = record.headings.filter((heading) => !heading.inChrome);
  record.headingStructure = analyseHeadingStructure(record.contentHeadings);
  record.anchors = extractAnchors(doc, url);
  record.images = extractImages(doc);
  record.jsonLdBlocks = extractJsonLdScripts(doc);
  record.bodyText = bodyText(doc);
  record.mainText = mainContentText(doc);
  record.wordCount = countWords(record.bodyText);

  return record;
}

function isHtml(contentType) {
  const value = String(contentType || "").toLowerCase();
  if (!value) return true;
  return value.includes("text/html") || value.includes("application/xhtml+xml");
}

function shortContentType(contentType) {
  return String(contentType || "").split(";")[0].trim().toLowerCase();
}

function pickHeaders(headers) {
  const result = {};
  if (!headers) return result;
  for (const [key, value] of Object.entries(headers)) {
    if (HEADERS_KEPT.has(key)) result[key] = value;
  }
  return result;
}

/**
 * A stub record used when the run has no network access. It keeps the
 * report shape identical, so every downstream audit reports UNVERIFIED
 * instead of silently disappearing.
 */
export function createUnfetchedRecord({ url, path, kind, source, origin, reason }) {
  return createPageRecord({
    url,
    path,
    kind,
    source,
    origin,
    response: {
      status: 0,
      ok: false,
      error: { code: "NETWORK_DISABLED", message: reason },
      headers: {},
      redirects: [],
    },
    referrers: [],
  });
}

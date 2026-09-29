/**
 * AUDIT 2 - Title tags.
 *
 * Severity mapping, using the documented bands in config.mjs:
 *   ERROR      - the title is absent or blank
 *   WARNING    - the title is longer than 60 characters, or shorter than 15
 *   INFO       - the title is duplicated on another indexable page
 *
 * The auditor never rewrites a title. Length bands are advisory: they
 * describe how a title is likely to be displayed, not how a search engine
 * will rank it, and the report says so.
 */

import { THRESHOLDS } from "../lib/config.mjs";
import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages, countBy, duplicatesOf, indexablePages } from "./shared.mjs";
import { excerpt } from "../lib/extract/text.mjs";

const AUDIT = "titles";
const BAND = THRESHOLDS.title;

export function runTitlesAudit({ crawl }) {
  const findings = [];
  const observations = [];
  const pages = analysedPages(crawl);
  const indexable = indexablePages(crawl);
  const indexableUrls = new Set(indexable.map((page) => page.url));

  for (const page of pages) {
    const title = page.headInfo ? page.headInfo.title : null;
    const length = page.headInfo ? page.headInfo.titleLength : 0;

    if (!title || title.trim() === "") {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "title-missing",
          url: page.url,
          message: "This page has no non-empty <title>, so search results and browser tabs have nothing to display.",
          evidence: { titleNodeCount: page.headInfo ? page.headInfo.titleNodeCount : 0 },
        }),
      );
      continue;
    }

    if (length > BAND.hardMax) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "title-far-too-long",
          url: page.url,
          message: `Title is ${length} characters, well beyond the ${BAND.hardMax}-character limit at which a title is essentially always truncated.`,
          expected: `<= ${BAND.max}`,
          actual: length,
          evidence: { title: excerpt(title, 200) },
        }),
      );
    } else if (length > BAND.max || length < BAND.min) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: length > BAND.max ? "title-too-long" : "title-too-short",
          url: page.url,
          message:
            length > BAND.max
              ? `Title is ${length} characters; the advisory band is ${BAND.min}-${BAND.max}, so it may be truncated in search results.`
              : `Title is only ${length} characters; the advisory band is ${BAND.min}-${BAND.max}, so it may not describe the page well enough.`,
          expected: `${BAND.min}-${BAND.max}`,
          actual: length,
          evidence: { title: excerpt(title, 200) },
        }),
      );
    }

    if (page.headInfo && page.headInfo.titleNodeCount > 1) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "multiple-title-elements",
          url: page.url,
          message: `${page.headInfo.titleNodeCount} <title> elements were found; only the first is used, which makes the intended title ambiguous.`,
          actual: page.headInfo.titleNodeCount,
        }),
      );
    }

    observations.push({
      code: "title",
      url: page.url,
      title,
      length,
      indexability: page.indexability ? page.indexability.state : "UNKNOWN",
    });
  }

  const titleCounts = countBy(
    pages.filter((page) => page.headInfo && page.headInfo.title),
    (page) => page.headInfo.title.trim().toLowerCase(),
  );

  for (const [normalised, count] of duplicatesOf(titleCounts)) {
    const group = pages.filter(
      (page) => page.headInfo && page.headInfo.title && page.headInfo.title.trim().toLowerCase() === normalised,
    );
    const indexableMembers = group.filter((page) => indexableUrls.has(page.url));

    findings.push(
      createFinding({
        audit: AUDIT,
        severity: indexableMembers.length >= 2 ? SEVERITY.ERROR : SEVERITY.INFO,
        code: "title-duplicate",
        url: group[0].url,
        message:
          indexableMembers.length >= 2
            ? `Identical title used on ${indexableMembers.length} indexable pages, so those pages compete for the same search result.`
            : `Identical title used on ${group.length} pages, but fewer than two of them are indexable, so the practical impact is limited.`,
        actual: count,
        evidence: {
          title: excerpt(group[0].headInfo.title, 200),
          pages: group.map((page) => page.path),
          indexablePages: indexableMembers.map((page) => page.path),
        },
      }),
    );
  }

  return buildAuditResult({
    id: AUDIT,
    name: "Title tags",
    description: "Presence, length and uniqueness of <title> across crawled pages.",
    findings,
    summary: {
      pagesChecked: pages.length,
      indexablePages: indexable.length,
      missingTitles: pages.filter((page) => !page.headInfo || !page.headInfo.title).length,
      duplicateTitleGroups: duplicatesOf(titleCounts).length,
      advisoryBand: `${BAND.min}-${BAND.max} characters`,
      tooLong: pages.filter((page) => page.headInfo && page.headInfo.titleLength > BAND.max).length,
      tooShort: pages.filter(
        (page) => page.headInfo && page.headInfo.title && page.headInfo.titleLength < BAND.min,
      ).length,
    },
    observations,
  });
}

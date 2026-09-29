/**
 * AUDIT 3 - Meta descriptions.
 *
 * Severity mapping:
 *   ERROR   - no description at all
 *   WARNING - outside the advisory 70-160 character band
 *   INFO    - duplicated on more than one indexable page
 *
 * A missing description is an ERROR even though it does not block
 * indexing. It is the one metadata field the page owner fully controls,
 * and leaving it out hands that control to the search engine. The report
 * states this rather than implying a ranking penalty.
 */

import { THRESHOLDS } from "../lib/config.mjs";
import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages, countBy, duplicatesOf, indexablePages } from "./shared.mjs";
import { excerpt } from "../lib/extract/text.mjs";

const AUDIT = "descriptions";
const BAND = THRESHOLDS.description;

export function runDescriptionsAudit({ crawl }) {
  const findings = [];
  const observations = [];
  const pages = analysedPages(crawl);
  const indexable = indexablePages(crawl);
  const indexableUrls = new Set(indexable.map((page) => page.url));

  for (const page of pages) {
    const description = page.headInfo ? page.headInfo.description : null;
    const length = page.headInfo ? page.headInfo.descriptionLength : 0;

    if (!description || description.trim() === "") {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "description-missing",
          url: page.url,
          message:
            "This page has no meta description, so the search engine will generate its own snippet from page text.",
          evidence: { descriptionTagCount: page.headInfo ? page.headInfo.descriptionTagCount : 0 },
        }),
      );
      if (page.headInfo && page.headInfo.descriptionTagCount > 1) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.WARNING,
            code: "multiple-description-tags",
            url: page.url,
            message: `${page.headInfo.descriptionTagCount} description meta tags were found; only the first is used.`,
            actual: page.headInfo.descriptionTagCount,
          }),
        );
      }
      continue;
    }

    if (length > BAND.hardMax) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "description-far-too-long",
          url: page.url,
          message: `Description is ${length} characters; beyond roughly ${BAND.max} it is truncated in search results, so the important part may never be shown.`,
          expected: `<= ${BAND.max}`,
          actual: length,
          evidence: { description: excerpt(description, 260) },
        }),
      );
    } else if (length > BAND.max || length < BAND.min) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: length > BAND.max ? "description-too-long" : "description-too-short",
          url: page.url,
          message:
            length > BAND.max
              ? `Description is ${length} characters; the advisory band is ${BAND.min}-${BAND.max}.`
              : `Description is only ${length} characters; the advisory band is ${BAND.min}-${BAND.max}, so it carries little information.`,
          expected: `${BAND.min}-${BAND.max}`,
          actual: length,
          evidence: { description: excerpt(description, 260) },
        }),
      );
    }

    if (page.headInfo && page.headInfo.descriptionTagCount > 1) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "multiple-description-tags",
          url: page.url,
          message: `${page.headInfo.descriptionTagCount} description meta tags were found; only the first is used, which makes the intended description ambiguous.`,
          actual: page.headInfo.descriptionTagCount,
        }),
      );
    }

    observations.push({
      code: "description",
      url: page.url,
      description: excerpt(description, 200),
      length,
      indexability: page.indexability ? page.indexability.state : "UNKNOWN",
    });
  }

  const descriptionCounts = countBy(
    pages.filter((page) => page.headInfo && page.headInfo.description),
    (page) => page.headInfo.description.trim().toLowerCase(),
  );

  for (const [normalised] of duplicatesOf(descriptionCounts)) {
    const group = pages.filter(
      (page) =>
        page.headInfo &&
        page.headInfo.description &&
        page.headInfo.description.trim().toLowerCase() === normalised,
    );
    const indexableMembers = group.filter((page) => indexableUrls.has(page.url));

    findings.push(
      createFinding({
        audit: AUDIT,
        severity: indexableMembers.length >= 2 ? SEVERITY.WARNING : SEVERITY.INFO,
        code: "description-duplicate",
        url: group[0].url,
        message:
          indexableMembers.length >= 2
            ? `Identical meta description used on ${indexableMembers.length} indexable pages, so those snippets do not distinguish the pages.`
            : `Identical meta description used on ${group.length} pages, but fewer than two are indexable.`,
        actual: group.length,
        evidence: {
          description: excerpt(group[0].headInfo.description, 260),
          pages: group.map((page) => page.path),
          indexablePages: indexableMembers.map((page) => page.path),
        },
      }),
    );
  }

  return buildAuditResult({
    id: AUDIT,
    name: "Meta descriptions",
    description: "Presence, length and uniqueness of the meta description.",
    findings,
    summary: {
      pagesChecked: pages.length,
      indexablePages: indexable.length,
      missingDescriptions: pages.filter((page) => !page.headInfo || !page.headInfo.description).length,
      duplicateDescriptionGroups: duplicatesOf(descriptionCounts).length,
      advisoryBand: `${BAND.min}-${BAND.max} characters`,
      tooLong: pages.filter((page) => page.headInfo && page.headInfo.descriptionLength > BAND.max).length,
      tooShort: pages.filter(
        (page) => page.headInfo && page.headInfo.description && page.headInfo.descriptionLength < BAND.min,
      ).length,
    },
    observations,
  });
}

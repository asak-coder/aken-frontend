/**
 * AUDIT 5 - H1 tags.
 *
 * Severity mapping:
 *   ERROR   - no H1 in the page's own content
 *   WARNING - more than one H1 in the page's own content
 *   INFO    - the H1 text is identical to another page's H1
 *
 * Only headings outside site chrome (header/nav/footer/aside) are counted.
 * The AKEN footer contains three <h3> column labels, and counting chrome
 * headings would make every page look like it has a heading problem.
 */

import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages, countBy, duplicatesOf, indexablePages } from "./shared.mjs";
import { excerpt } from "../lib/extract/text.mjs";

const AUDIT = "h1";

export function runH1Audit({ crawl }) {
  const findings = [];
  const observations = [];
  const pages = analysedPages(crawl);
  const indexable = indexablePages(crawl);
  const indexableUrls = new Set(indexable.map((page) => page.url));

  for (const page of pages) {
    const contentH1s = page.contentHeadings.filter((heading) => heading.level === 1);
    const chromeH1s = page.headings.filter((heading) => heading.inChrome && heading.level === 1);

    if (contentH1s.length === 0) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "h1-missing",
          url: page.url,
          message:
            "No H1 was found in the page's own content, so the page's primary subject is not stated in its markup.",
          evidence: {
            chromeH1Count: chromeH1s.length,
            contentHeadingLevels: page.contentHeadings.map((heading) => heading.level),
          },
        }),
      );
    } else if (contentH1s.length > 1) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "h1-multiple",
          url: page.url,
          message: `${contentH1s.length} H1 elements were found in the page content. Multiple H1s are not automatically harmful, but they make the page's main subject ambiguous.`,
          actual: contentH1s.length,
          evidence: { h1Texts: contentH1s.map((heading) => excerpt(heading.text, 120)) },
        }),
      );
    }

    if (contentH1s.length > 0 && contentH1s[0].text.trim() === "") {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "h1-empty",
          url: page.url,
          message: "The H1 element contains no text.",
        }),
      );
    }

    observations.push({
      code: "h1",
      url: page.url,
      h1Count: contentH1s.length,
      chromeH1Count: chromeH1s.length,
      h1Texts: contentH1s.map((heading) => excerpt(heading.text, 200)),
      indexability: page.indexability ? page.indexability.state : "UNKNOWN",
    });
  }

  const h1Counts = countBy(
    pages
      .map((page) => {
        const h1 = page.contentHeadings.find((heading) => heading.level === 1);
        return h1 ? { page, h1 } : null;
      })
      .filter(Boolean),
    (entry) => entry.h1.text.trim().toLowerCase(),
  );

  for (const [normalised] of duplicatesOf(h1Counts)) {
    const group = pages.filter((page) => {
      const h1 = page.contentHeadings.find((heading) => heading.level === 1);
      return h1 && h1.text.trim().toLowerCase() === normalised;
    });
    const indexableMembers = group.filter((page) => indexableUrls.has(page.url));

    findings.push(
      createFinding({
        audit: AUDIT,
        severity: indexableMembers.length >= 2 ? SEVERITY.WARNING : SEVERITY.INFO,
        code: "h1-duplicate",
        url: group[0].url,
        message:
          indexableMembers.length >= 2
            ? `Identical H1 on ${indexableMembers.length} indexable pages, so those pages assert the same primary subject.`
            : `Identical H1 on ${group.length} pages, but fewer than two are indexable.`,
        actual: group.length,
        evidence: {
          h1: excerpt(String(normalised), 200),
          pages: group.map((page) => page.path),
        },
      }),
    );
  }

  return buildAuditResult({
    id: AUDIT,
    name: "H1 headings",
    description: "Presence, count and uniqueness of the H1 inside page content.",
    findings,
    summary: {
      pagesChecked: pages.length,
      indexablePages: indexable.length,
      missingH1: pages.filter((page) => page.contentHeadings.every((heading) => heading.level !== 1)).length,
      multipleH1: pages.filter(
        (page) => page.contentHeadings.filter((heading) => heading.level === 1).length > 1,
      ).length,
      duplicateH1Groups: duplicatesOf(h1Counts).length,
      pagesWithChromeOnlyH1: pages.filter(
        (page) =>
          page.contentHeadings.every((heading) => heading.level !== 1) &&
          page.headings.some((heading) => heading.inChrome && heading.level === 1),
      ).length,
    },
    observations,
  });
}

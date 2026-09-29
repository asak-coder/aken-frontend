/**
 * AUDIT 6 - Heading structure.
 *
 * This audit is advisory by design. A skipped heading level (H2 -> H4) is
 * reported as INFO, never as an error, because:
 *
 *   - heading levels are an authoring decision, not a validity rule
 *   - search engines build their own outline and tolerate gaps
 *   - reporting every jump as a defect would drown the real findings
 *
 * What is reported, and at what severity:
 *   INFO   - a level was skipped, an empty heading exists, an outline
 *            starts below H1
 *   WARNING- a heading duplicated verbatim inside the same page, which
 *            usually means a template repeated a section
 *   ERROR  - never. Missing H1 is covered by AUDIT 5, where it belongs.
 */

import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages } from "./shared.mjs";

const AUDIT = "headings";

export function runHeadingsAudit({ crawl }) {
  const findings = [];
  const observations = [];
  const pages = analysedPages(crawl);

  let pagesWithJumps = 0;
  let pagesWithEmptyHeadings = 0;
  let pagesWithRepeatedHeadings = 0;

  for (const page of pages) {
    const structure = page.headingStructure;
    const headings = page.contentHeadings;

    if (!structure || headings.length === 0) {
      observations.push({
        code: "headings",
        url: page.url,
        headingCount: 0,
        outline: [],
        note: "No headings were found in the page content.",
      });
      continue;
    }

    if (structure.jumps.length > 0) {
      pagesWithJumps += 1;
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.INFO,
          code: "heading-level-skipped",
          url: page.url,
          message: `The content outline skips ${structure.jumps.length} heading level${structure.jumps.length === 1 ? "" : "s"} (e.g. H${structure.jumps[0].from} followed by H${structure.jumps[0].to}). This is advisory: it does not prevent indexing.`,
          evidence: { jumps: structure.jumps },
        }),
      );
    }

    if (structure.emptyHeadings.length > 0) {
      pagesWithEmptyHeadings += 1;
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.INFO,
          code: "heading-empty",
          url: page.url,
          message: `${structure.emptyHeadings.length} heading element${structure.emptyHeadings.length === 1 ? " is" : "s are"} present but contain no text.`,
          evidence: { emptyHeadings: structure.emptyHeadings.map((entry) => `h${entry.level}`) },
        }),
      );
    }

    if (structure.duplicateHeadings.length > 0) {
      pagesWithRepeatedHeadings += 1;
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "heading-repeated-within-page",
          url: page.url,
          message: `${structure.duplicateHeadings.length} heading text${structure.duplicateHeadings.length === 1 ? " is" : "s are"} repeated verbatim within this page, which usually indicates a section rendered twice.`,
          evidence: { duplicates: structure.duplicateHeadings },
        }),
      );
    }

    if (!structure.missingH1 && structure.h2BeforeH1) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.INFO,
          code: "heading-h2-before-h1",
          url: page.url,
          message: "An H2 appears before the first H1 in the content outline.",
          evidence: { firstHeadingLevel: structure.firstHeadingLevel },
        }),
      );
    }

    observations.push({
      code: "headings",
      url: page.url,
      headingCount: headings.length,
      h1Count: structure.h1Count,
      jumps: structure.jumps.length,
      outline: headings.slice(0, 40).map((heading) => ({ level: heading.level, text: heading.text.slice(0, 120) })),
    });
  }

  return buildAuditResult({
    id: AUDIT,
    name: "Heading structure",
    description:
      "Advisory outline check across content headings. Skipped levels and empty headings are informational, not defects.",
    findings,
    summary: {
      pagesChecked: pages.length,
      pagesWithSkippedLevels: pagesWithJumps,
      pagesWithEmptyHeadings,
      pagesWithRepeatedHeadings,
      totalContentHeadings: pages.reduce((total, page) => total + page.contentHeadings.length, 0),
      note: "Skipped heading levels are reported as INFO. Heading levels are an authoring decision, not a validity requirement.",
    },
    observations,
  });
}

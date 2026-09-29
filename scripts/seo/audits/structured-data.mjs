/**
 * AUDIT 9 - Structured data (JSON-LD).
 *
 * Validates what exists. It generates nothing.
 *
 * Hard boundary enforced by this module: the auditor will never emit,
 * complete or enrich structured data. Types that require AKEN to assert
 * something a third party cannot verify here - AggregateRating, Review,
 * Rating, Event, and any Offer carrying a price - are reported for human
 * confirmation, never created. That is why a rating found on the page is a
 * WARNING and not a silent pass: a fabricated rating is a manual-action
 * risk, and only a human can confirm whether the underlying reviews are
 * genuine.
 *
 * Severity mapping:
 *   ERROR      - a JSON-LD block that does not parse, or a recognised node
 *                missing a required property
 *   WARNING    - a claim-bearing type present, a URL on the wrong host,
 *                conflicting nodes of the same type, or a node whose name
 *                does not appear in the visible page text
 *   INFO       - a node whose values differ only in phrasing, or schema
 *                that is unrecognised but harmless
 */

import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages } from "./shared.mjs";
import {
  CLAIM_BEARING_TYPES,
  claimTexts,
  flattenNodes,
  inferTypes,
  isPrimaryHostString,
  missingRequiredProperties,
  nodeLabel,
  nodeUrls,
  parseJsonLdBlocks,
  validateContexts,
} from "../lib/jsonld.mjs";
import { normalizeForComparison } from "../lib/extract/text.mjs";

const AUDIT = "structured-data";

/**
 * Properties whose entire purpose is to name an identity that lives
 * somewhere else. A `sameAs` pointing at a WhatsApp link, a LinkedIn page
 * or a Wikipedia article is correct markup, so reporting it as a
 * wrong-host URL would be a false positive that pushes an owner to break
 * valid data. Only properties describing this site's own resources are
 * host-checked.
 */
const EXTERNAL_BY_DESIGN_PROPERTIES = new Set([
  "sameas",
  "isbasedon",
  "citation",
  "mentions",
  "subjectof",
]);

export function runStructuredDataAudit({ crawl }) {
  const findings = [];
  const observations = [];
  const pages = analysedPages(crawl);

  let totalBlocks = 0;
  let invalidBlocks = 0;
  let totalNodes = 0;
  const typeFrequency = new Map();
  const claimBearingFound = [];

  for (const page of pages) {
    const blocks = page.jsonLdBlocks || [];
    if (blocks.length === 0) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: page.kind === "blog-post" || page.kind === "service-page" ? SEVERITY.WARNING : SEVERITY.INFO,
          code: "structured-data-absent",
          url: page.url,
          message:
            page.kind === "blog-post" || page.kind === "service-page"
              ? "This page has no JSON-LD. Article and Service pages benefit most from structured data, so this is likely an omission rather than a choice."
              : "This page has no JSON-LD. That is acceptable for a simple page but leaves the entity description to inference.",
          evidence: { kind: page.kind },
        }),
      );
      observations.push({ code: "structured-data", url: page.url, blocks: 0, nodes: [], types: [] });
      continue;
    }

    totalBlocks += blocks.length;

    const parsed = parseJsonLdBlocks(blocks);
    const failed = parsed.filter((block) => !block.ok);
    invalidBlocks += failed.length;

    for (const block of failed) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "json-ld-parse-error",
          url: page.url,
          message: `JSON-LD block ${block.index + 1} is not valid JSON (${block.error}), so search engines will ignore it entirely.`,
          evidence: { rawLength: block.rawLength, viaSrc: block.viaSrc },
        }),
      );
    }

    for (const problem of validateContexts(parsed)) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: problem.reason.startsWith("missing") ? SEVERITY.WARNING : SEVERITY.ERROR,
          code: problem.reason.startsWith("missing") ? "json-ld-missing-context" : "json-ld-unexpected-context",
          url: page.url,
          message: `JSON-LD block ${problem.blockIndex + 1}: ${problem.reason}. Without the schema.org context the vocabulary is undefined.`,
        }),
      );
    }

    const nodes = flattenNodes(parsed);
    totalNodes += nodes.length;

    const pageText = normalizeForComparison(page.bodyText);
    const typesOnPage = new Map();

    for (const entry of nodes) {
      const types = inferTypes(entry.node);
      for (const type of types) {
        typeFrequency.set(type, (typeFrequency.get(type) || 0) + 1);
        if (!typesOnPage.has(type)) typesOnPage.set(type, []);
        typesOnPage.get(type).push(entry);
      }

      for (const type of types) {
        if (CLAIM_BEARING_TYPES.includes(type)) {
          claimBearingFound.push({ url: page.url, type, label: nodeLabel(entry) });
        }
      }

      const missing = missingRequiredProperties(entry.node);
      if (missing.length > 0) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.ERROR,
            code: "structured-data-missing-required",
            url: page.url,
            message: `${nodeLabel(entry)} is missing required propert${missing.length === 1 ? "y" : "ies"}: ${missing.join(", ")}.`,
            evidence: {
              missing,
              presentKeys: Object.keys(entry.node).slice(0, 40),
            },
          }),
        );
      }

      for (const candidate of nodeUrls(entry.node)) {
        const key = String(candidate.key || "").toLowerCase();
        if (EXTERNAL_BY_DESIGN_PROPERTIES.has(key)) continue;

        const value = candidate.value;
        if (value.startsWith("http") && !isPrimaryHostString(value)) {
          findings.push(
            createFinding({
              audit: AUDIT,
              severity: SEVERITY.WARNING,
              code: "structured-data-url-different-host",
              url: page.url,
              message: `${nodeLabel(entry)} sets ${candidate.key} to ${value}, which is not on the site's canonical host. This can make the entity resolve to a different site.`,
              actual: value,
            }),
          );
        }
      }

      for (const claim of claimTexts(entry.node)) {
        const needle = normalizeForComparison(claim.value);
        if (needle.length < 4) continue;
        if (!pageText.includes(needle)) {
          findings.push(
            createFinding({
              audit: AUDIT,
              severity: SEVERITY.INFO,
              code: "structured-data-name-not-in-visible-text",
              url: page.url,
              message: `${nodeLabel(entry)} declares ${claim.key} "${claim.value}", which was not found verbatim in the page's visible text. This is advisory: markup and copy legitimately differ in punctuation and phrasing, and only a human can confirm the claim matches the page.`,
              evidence: { key: claim.key, value: claim.value },
            }),
          );
        }
      }
    }

    for (const [type, entries] of typesOnPage) {
      if (entries.length < 2) continue;
      const identifiers = entries.map((entry) => nodeLabel(entry));
      const unique = new Set(identifiers);
      if (unique.size === entries.length) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.INFO,
            code: "structured-data-repeated-type",
            url: page.url,
            message: `${entries.length} separate ${type} nodes appear on this page with distinct identifiers. That is valid, but confirm each describes a genuinely different entity.`,
            evidence: { labels: identifiers },
          }),
        );
      } else {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.WARNING,
            code: "structured-data-conflicting-nodes",
            url: page.url,
            message: `${entries.length} ${type} nodes share an identifier or are otherwise indistinguishable, which makes the entity ambiguous.`,
            evidence: { labels: identifiers },
          }),
        );
      }
    }

    observations.push({
      code: "structured-data",
      url: page.url,
      blocks: blocks.length,
      nodes: nodes.map((entry) => ({
        label: nodeLabel(entry),
        types: inferTypes(entry.node),
        requiredMissing: missingRequiredProperties(entry.node),
      })),
      types: [...typesOnPage.keys()],
    });
  }

  for (const entry of claimBearingFound) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.WARNING,
        code: "structured-data-claim-bearing-type",
        url: entry.url,
        message: `${entry.type} structured data is present. The auditor cannot verify ratings, reviews or events, and it never generates them. Confirm every value is genuine, documented and visible on the page before keeping it.`,
        evidence: { type: entry.type, label: entry.label, directive: "REPORT_ONLY - not created by this auditor" },
      }),
    );
  }

  return buildAuditResult({
    id: AUDIT,
    name: "Structured data",
    description:
      "JSON-LD validity, required properties, host consistency and duplicate/conflicting nodes. Report only - nothing is generated.",
    findings,
    summary: {
      pagesChecked: pages.length,
      pagesWithStructuredData: observations.filter((entry) => entry.blocks > 0).length,
      pagesWithoutStructuredData: observations.filter((entry) => entry.blocks === 0).length,
      totalBlocks,
      invalidBlocks,
      totalNodes,
      typesFound: summariseTypeFrequency(typeFrequency),
      claimBearingTypesFound: claimBearingFound.map((entry) => ({ url: entry.url, type: entry.type })),
      policy:
        "The auditor validates and reports structured data. It never creates, completes or enriches it, and it never fabricates reviews, ratings, offers, prices, events, projects or locations.",
    },
    observations,
  });
}

function summariseTypeFrequency(map) {
  return [...map.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((left, right) => right.count - left.count || left.type.localeCompare(right.type));
}

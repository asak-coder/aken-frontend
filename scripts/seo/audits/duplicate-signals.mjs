/**
 * AUDIT 14 - Duplicate content signals.
 *
 * Detects technical duplication the auditor can actually prove:
 *   - identical title, description, canonical or H1 across two pages
 *   - substantially identical visible text, measured with 5-word shingles
 *     and the Jaccard threshold from THRESHOLDS.duplicateSimilarity
 *
 * Wording rule, enforced deliberately: the report says
 * "Potential duplicate-content signal detected."
 *
 * It never says that any search engine has classified anything as
 * duplicate. The auditor cannot see an index and must not imply that it
 * can. Even at high similarity the finding states what was measured and
 * leaves the interpretation to a human.
 */

import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages, countBy, duplicatesOf, indexablePages } from "./shared.mjs";
import { THRESHOLDS } from "../lib/config.mjs";
import { jaccardSimilarity, shingles } from "../lib/extract/text.mjs";
import { canonicalForm } from "../lib/url-utils.mjs";

const AUDIT = "duplicate-signals";

const SIGNALS = [
  { name: "title", extract: (page) => (page.headInfo ? page.headInfo.title : null) },
  { name: "description", extract: (page) => (page.headInfo ? page.headInfo.description : null) },
  { name: "canonical", extract: (page) => (page.indexability ? page.indexability.canonicalTarget : null) },
  {
    name: "h1",
    extract: (page) => {
      const h1 = page.contentHeadings.find((heading) => heading.level === 1);
      return h1 ? h1.text : null;
    },
  },
];

export function runDuplicateSignalsAudit({ crawl }) {
  const findings = [];
  const observations = [];
  const pages = analysedPages(crawl);
  const indexable = indexablePages(crawl);
  const indexableUrls = new Set(indexable.map((page) => page.url));

  for (const signal of SIGNALS) {
    const counts = countBy(
      pages.filter((page) => signal.extract(page)),
      (page) => signal.extract(page).trim().toLowerCase(),
    );

    for (const [normalised] of duplicatesOf(counts)) {
      const group = pages.filter((page) => {
        const value = signal.extract(page);
        return Boolean(value) && value.trim().toLowerCase() === normalised;
      });
      const indexableMembers = group.filter((page) => indexableUrls.has(page.url));

      /**
       * Severity follows the same rule as the title audit: two or more
       * indexable pages sharing a value is a real duplication risk, while a
       * value shared only with noindexed pages is worth recording but is not
       * actionable on its own. Neither case is dropped, because hiding a
       * measured overlap would be worse than reporting it quietly.
       */
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: indexableMembers.length >= 2 ? SEVERITY.WARNING : SEVERITY.INFO,
          code: `duplicate-${signal.name}`,
          url: group[0].url,
          message:
            indexableMembers.length >= 2
              ? `Potential duplicate-content signal detected: ${indexableMembers.length} indexable pages share the same ${signal.name}. The auditor measured an identical value and makes no claim about how any search engine has classified these pages.`
              : `Potential duplicate-content signal detected: ${group.length} pages share the same ${signal.name}, but only ${indexableMembers.length} of them ${indexableMembers.length === 1 ? "is" : "are"} indexable, so the practical impact is limited.`,
          actual: group.length,
          evidence: {
            signal: signal.name,
            value: normalised.slice(0, 200),
            pages: group.map((page) => page.path),
            indexablePages: indexableMembers.map((page) => page.path),
          },
        }),
      );
    }
  }

  const shingleEntries = [];

  for (const page of pages) {
    const text = page.mainText || page.bodyText;
    if (!text) continue;
    const set = shingles(text, 5);
    if (set.size < THRESHOLDS.duplicateMinShingles) continue;
    shingleEntries.push({ page, set });
  }

  const compared = [];

  for (let left = 0; left < shingleEntries.length; left += 1) {
    for (let right = left + 1; right < shingleEntries.length; right += 1) {
      const a = shingleEntries[left];
      const b = shingleEntries[right];
      const similarity = jaccardSimilarity(a.set, b.set);
      compared.push({ a: a.page.path, b: b.page.path, similarity });

      if (similarity < THRESHOLDS.duplicateSimilarity) continue;

      const bothIndexable = indexableUrls.has(a.page.url) && indexableUrls.has(b.page.url);

      findings.push(
        createFinding({
          audit: AUDIT,
          severity: bothIndexable ? SEVERITY.WARNING : SEVERITY.INFO,
          code: "duplicate-body-text",
          url: a.page.url,
          message: `Potential duplicate-content signal detected: this page and ${b.page.path} share ${(similarity * 100).toFixed(1)} percent of their five-word phrasing sequences, above the ${(THRESHOLDS.duplicateSimilarity * 100).toFixed(0)} percent threshold. The auditor measured textual overlap; it does not claim any search engine has deduplicated these pages.`,
          actual: Number(similarity.toFixed(4)),
          evidence: {
            otherPage: b.page.path,
            bothIndexable,
            shingleCountLeft: a.set.size,
            shingleCountRight: b.set.size,
            method: "Jaccard similarity over 5-word shingles of main content text",
          },
        }),
      );
    }
  }

  const canonicalCounts = countBy(
    pages.filter((page) => page.indexability && page.indexability.canonicalTarget),
    (page) => {
      try {
        return canonicalForm(new URL(page.indexability.canonicalTarget));
      } catch {
        return page.indexability.canonicalTarget;
      }
    },
  );

  const manyToOne = duplicatesOf(canonicalCounts)
    .map(([target, count]) => ({ target, count }))
    .filter((entry) => entry.count > 1);

  for (const entry of manyToOne) {
    observations.push({
      code: "canonical-convergence",
      canonical: entry.target,
      pagesPointingHere: entry.count,
      note: "Several pages declare the same canonical. When those pages also carry noindex this is a deliberate consolidation; when they do not, it is a signal to review.",
    });
  }

  const highest = [...compared]
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, 20)
    .map((entry) => ({
      a: entry.a,
      b: entry.b,
      similarity: Number(entry.similarity.toFixed(4)),
    }));

  return buildAuditResult({
    id: AUDIT,
    name: "Duplicate content signals",
    description:
      "Identical title, description, canonical and H1, plus measured textual overlap. Reports signals only, never a classification by any search engine.",
    findings,
    summary: {
      pagesChecked: pages.length,
      pagesComparedForText: shingleEntries.length,
      pairwiseComparisons: compared.length,
      similarityThreshold: THRESHOLDS.duplicateSimilarity,
      minimumShingles: THRESHOLDS.duplicateMinShingles,
      duplicateBodyTextPairs: findings.filter((finding) => finding.code === "duplicate-body-text").length,
      canonicalConvergenceGroups: manyToOne.length,
      highestSimilarityPairs: highest,
      wordingNote:
        "Findings use the phrase Potential duplicate-content signal detected. The auditor cannot see any search index and does not assert that any page has been classified as duplicate.",
    },
    observations,
  });
}

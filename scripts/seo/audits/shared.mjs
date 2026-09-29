/**
 * Helpers shared by every audit.
 *
 * The most important decision encoded here is which pages an audit is
 * allowed to complain about. Three sets are used, and they are not
 * interchangeable:
 *
 *   analysedPages   - every page that returned 200 HTML and was parsed.
 *                     Per-page value checks (title length, H1 count) run
 *                     against this set, because a page that is currently
 *                     noindexed still needs correct metadata the moment
 *                     someone removes the directive.
 *   indexablePages  - analysedPages minus anything suppressed by noindex,
 *                     robots.txt or a conflicting canonical. Counts and
 *                     duplicate detection are scoped to this set.
 *   missingPages    - routes that exist in the project's source but did
 *                     not return a usable response.
 */

import { INDEXABILITY } from "../lib/indexability.mjs";
import { SEVERITY, tallyBySeverity } from "../lib/severity.mjs";

export function analysedPages(crawl) {
  return crawl.pages.filter((page) => page.doc !== null);
}

export function indexablePages(crawl) {
  return analysedPages(crawl).filter(
    (page) => page.indexability && page.indexability.state === INDEXABILITY.INDEXABLE,
  );
}

export function pagesByState(crawl, state) {
  return crawl.pages.filter((page) => page.indexability && page.indexability.state === state);
}

export function unreachablePages(crawl) {
  return crawl.pages.filter((page) => !page.ok || page.error || page.blocked);
}

export function pageRef(page) {
  return {
    url: page.url,
    path: page.path,
    kind: page.kind,
    indexability: page.indexability ? page.indexability.state : "UNKNOWN",
  };
}

export function buildAuditResult({ id, name, description, findings = [], summary = {}, observations = [] }) {
  const sorted = [...findings].sort((left, right) => {
    const bySeverity = severityOrder(left.severity) - severityOrder(right.severity);
    if (bySeverity !== 0) return bySeverity;
    return String(left.url || "").localeCompare(String(right.url || ""));
  });

  return {
    id,
    name,
    description,
    tally: tallyBySeverity(sorted),
    summary,
    findings: sorted,
    observations,
  };
}

function severityOrder(severity) {
  const order = [SEVERITY.ERROR, SEVERITY.WARNING, SEVERITY.INFO, SEVERITY.UNVERIFIED, SEVERITY.PASS];
  const index = order.indexOf(severity);
  return index === -1 ? order.length : index;
}

export function passOrNothing() {
  return [];
}

/**
 * Every per-page audit starts by separating pages it can judge from pages
 * it cannot. A page the auditor failed to fetch produces UNVERIFIED, never
 * a fabricated defect.
 */
export function partitionPages(crawl) {
  return {
    analysed: analysedPages(crawl),
    indexable: indexablePages(crawl),
    unreachable: unreachablePages(crawl),
  };
}

export function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (key === null || key === undefined || key === "") continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

export function duplicatesOf(counts) {
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((left, right) => right[1] - left[1] || String(left[0]).localeCompare(String(right[0])));
}

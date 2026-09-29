/**
 * The severity model for every audit finding.
 *
 *   ERROR      - a technical defect that damages indexability or metadata
 *                integrity and should be fixed.
 *   WARNING    - a probable defect or a value outside the advisory band.
 *   INFO       - an observation worth recording that is not a defect.
 *   UNVERIFIED - the auditor could not determine the answer (network
 *                failure, timeout, blocked probe, network disabled).
 *   PASS       - the check ran and the value is inside the advisory band.
 *
 * Only ERROR makes `npm run seo:audit` exit non-zero. UNVERIFIED never
 * does: the auditor must not report a site as broken because the auditor
 * itself could not see it.
 */

export const SEVERITY = Object.freeze({
  ERROR: "ERROR",
  WARNING: "WARNING",
  INFO: "INFO",
  UNVERIFIED: "UNVERIFIED",
  PASS: "PASS",
});

export const ALL_SEVERITIES = Object.freeze([
  SEVERITY.ERROR,
  SEVERITY.WARNING,
  SEVERITY.INFO,
  SEVERITY.UNVERIFIED,
  SEVERITY.PASS,
]);

const RANK = Object.freeze({
  [SEVERITY.ERROR]: 0,
  [SEVERITY.WARNING]: 1,
  [SEVERITY.INFO]: 2,
  [SEVERITY.UNVERIFIED]: 3,
  [SEVERITY.PASS]: 4,
});

export function isSeverity(value) {
  return typeof value === "string" && Object.hasOwn(RANK, value);
}

export function severityRank(severity) {
  return Object.hasOwn(RANK, severity) ? RANK[severity] : 99;
}

/** Sort findings most severe first, then by URL, then by code. */
export function compareFindings(left, right) {
  const bySeverity = severityRank(left.severity) - severityRank(right.severity);
  if (bySeverity !== 0) return bySeverity;
  const byUrl = String(left.url || "").localeCompare(String(right.url || ""));
  if (byUrl !== 0) return byUrl;
  return String(left.code || "").localeCompare(String(right.code || ""));
}

/** Tally findings by severity. Always returns every key. */
export function tallyBySeverity(findings) {
  const tally = { ERROR: 0, WARNING: 0, INFO: 0, UNVERIFIED: 0, PASS: 0 };
  for (const finding of findings) {
    if (Object.hasOwn(tally, finding.severity)) {
      tally[finding.severity] += 1;
    }
  }
  return tally;
}

export function hasErrors(findings) {
  return findings.some((finding) => finding.severity === SEVERITY.ERROR);
}

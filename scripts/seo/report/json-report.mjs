/**
 * Builds the machine-readable audit report.
 *
 * The top-level shape is fixed by the Phase 1 brief: runId, timestamp,
 * environment, baseUrl, summary and audits. Everything else is additive and
 * clearly named, so a consumer written against the brief keeps working.
 *
 * The report carries an explicit `limitations` block. An audit artefact
 * that only states what it found is half a report: the reader also needs to
 * know what the auditor could not see.
 */

import { AUDIT_ORDER, buildRunSummary, collectUnverified, indexAudits } from "./summary.mjs";
import { SITE, THRESHOLDS, FETCH_POLICY, RUN_LIMITS, EXIT_CODES } from "../lib/config.mjs";

export const AUDIT_VERSION = "1.0.0";

export function buildJsonReport({ runId, timestamp, baseUrl, crawl, discovery, auditResults, options }) {
  const summary = buildRunSummary({ crawl, discovery, auditResults });
  const audits = indexAudits(auditResults);

  return {
    runId,
    timestamp,
    environment: {
      auditor: "AKEN SEO Autopilot (Phase 1, read-only)",
      auditorVersion: AUDIT_VERSION,
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      productionOrigin: SITE.productionOrigin,
      productionHost: SITE.productionHost,
      alternateHost: SITE.alternateHost,
      networkEnabled: crawl.networkEnabled,
      phase: "phase-1-read-only",
    },
    baseUrl,
    mode: {
      readOnly: true,
      writes: "reports only (JSON + Markdown under reports/seo)",
      websiteModified: false,
      contentGenerated: false,
      deploymentTriggered: false,
    },
    summary,
    audits,
    unverified: collectUnverified(auditResults),
    policies: {
      thresholds: THRESHOLDS,
      fetch: {
        concurrency: FETCH_POLICY.concurrency,
        timeoutMs: FETCH_POLICY.timeoutMs,
        retries: FETCH_POLICY.retries,
        minHostDelayMs: FETCH_POLICY.minHostDelayMs,
        maxRedirects: FETCH_POLICY.maxRedirects,
        maxResponseBytes: FETCH_POLICY.maxResponseBytes,
        userAgent: FETCH_POLICY.userAgent,
      },
      runLimits: RUN_LIMITS,
      exitCodes: EXIT_CODES,
      ssrfProtection: {
        blockedHostnames: ["localhost", "*.localhost", "*.local", "*.internal", "cloud metadata endpoints"],
        blockedIpv4Ranges:
          "0.0.0.0/8, 10/8, 100.64/10, 127/8, 169.254/16, 172.16/12, 192.0.0/24, 192.0.2/24, 192.88.99/24, 192.168/16, 198.18/15, 198.51.100/24, 203.0.113/24, 224/4, 240/4",
        blockedIpv6Ranges:
          "::1/128, ::/128, fc00::/7, fe80::/10, fec0::/10, ff00::/8, 2001:db8::/32, 2001::/32, 2002::/16, 100::/64, IPv4-mapped and NAT64 forms",
        checkedPerRedirectHop: true,
        secretsUsed: "none",
      },
    },
    limitations: buildLimitations({ crawl, options }),
    recommendedActionsPolicy:
      "Recommended actions in the Markdown report are recommendations only. The auditor never executes them, never edits the website, and never publishes content.",
  };
}

function buildLimitations({ crawl, options }) {
  const limitations = [
    "The auditor reads public HTML only. It cannot see any search index, any ranking position, any analytics data or any Search Console report.",
    "Structured-data findings describe what is present and whether it parses. The auditor cannot validate a claim against the real world and never generates structured data.",
    "Duplicate-content findings are textual-similarity measurements. They are not, and must not be read as, a classification by any search engine.",
    "Heading-level jumps are advisory. They are reported as informational because heading levels are an authoring decision, not a validity rule.",
    "Metadata length bands describe how a title or description is likely to be displayed. They are not ranking factors.",
  ];

  if (!crawl.networkEnabled) {
    limitations.push(
      "NETWORK ACCESS WAS DISABLED for this run. Every page-level result is UNVERIFIED: nothing about the live site was actually observed.",
    );
  }

  if (crawl.capReached) {
    limitations.push(
      "The crawl stopped at its page cap, so the page inventory is incomplete and link-graph conclusions may be partial.",
    );
  }

  if (crawl.skipped.length > 0) {
    limitations.push(
      `${crawl.skipped.length} discovered URL(s) were not crawled, for the reasons listed in summary.crawl and the discovery audit.`,
    );
  }

  if (options && options.includeLinkedPages === false) {
    limitations.push(
      "Linked-page discovery was disabled for this run, so only source-derived and sitemap URLs were visited.",
    );
  }

  return limitations;
}

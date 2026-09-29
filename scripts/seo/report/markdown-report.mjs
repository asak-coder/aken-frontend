/**
 * Assembles the human-readable audit report.
 *
 * Section order follows the Phase 1 brief exactly:
 *   title, timestamp, Executive Summary, Page Inventory, Critical Errors,
 *   Warnings, Metadata, Canonicals, Heading Structure, Robots, Sitemap,
 *   Structured Data, Internal Links, External Links, Images, Indexability,
 *   Blog Health, Service Page Health, Recommended Actions.
 *
 * Two additional sections are present because two audits produce findings
 * that would otherwise be hidden: URL Quality and Duplicate Content
 * Signals. Hiding a measurement is worse than a longer report.
 */

import { SEVERITY } from "../lib/severity.mjs";
import {
  bulletList,
  code,
  findingList,
  heading,
  table,
} from "./markdown-format.mjs";
import { buildRunSummary, indexAudits } from "./summary.mjs";
import {
  renderCanonicalsSection,
  renderHeadingStructureSection,
  renderMetadataSection,
} from "./sections-metadata.mjs";
import {
  renderRobotsSection,
  renderSitemapSection,
  renderStructuredDataSection,
} from "./sections-infrastructure.mjs";
import {
  renderExternalLinksSection,
  renderImagesSection,
  renderIndexabilitySection,
  renderInternalLinksSection,
} from "./sections-links.mjs";
import {
  renderBlogSection,
  renderDuplicateSignalsSection,
  renderRecommendedActions,
  renderServicesSection,
  renderUrlQualitySection,
} from "./sections-content.mjs";

export function buildMarkdownReport({
  runId,
  timestamp,
  baseUrl,
  crawl,
  discovery,
  auditResults,
  durationMs,
}) {
  const summary = buildRunSummary({ crawl, discovery, auditResults });
  const audits = indexAudits(auditResults);
  const findings = auditResults.flatMap((result) => result.findings);

  const errors = findings
    .filter((finding) => finding.severity === SEVERITY.ERROR)
    .sort(sortFindings);
  const warnings = findings
    .filter((finding) => finding.severity === SEVERITY.WARNING)
    .sort(sortFindings);

  const parts = [];

  parts.push(heading(1, "AKEN SEO AUDIT"), "");
  parts.push(`Run timestamp: ${timestamp}`);
  parts.push("");
  parts.push(`Run ID: ${code(runId)}`);
  parts.push(`Base URL: ${code(baseUrl)}`);
  parts.push(`Auditor: Phase 1 read-only technical SEO auditor (v1.0.0)`);
  parts.push(
    `Duration: ${(durationMs / 1000).toFixed(1)} seconds`,
    "",
  );
  parts.push(
    "This is a private, read-only artefact. The auditor inspected the live site and wrote this file plus a JSON companion under reports/seo. It did not modify the website, did not generate or publish any content, and did not deploy anything.",
    "",
  );
  parts.push("---", "");

  parts.push(renderExecutiveSummary({ summary, auditResults, crawl, discovery }), "");
  parts.push(renderPageInventory({ crawl, discovery, audits }), "");
  parts.push(renderCriticalErrors({ errors }), "");
  parts.push(renderWarnings({ warnings }), "");
  parts.push(renderMetadataSection({ audits }), "");
  parts.push(renderCanonicalsSection({ audits }), "");
  parts.push(renderHeadingStructureSection({ audits }), "");
  parts.push(renderRobotsSection({ audits }), "");
  parts.push(renderSitemapSection({ audits }), "");
  parts.push(renderStructuredDataSection({ audits }), "");
  parts.push(renderInternalLinksSection({ audits }), "");
  parts.push(renderExternalLinksSection({ audits }), "");
  parts.push(renderImagesSection({ audits }), "");
  parts.push(renderIndexabilitySection({ audits }), "");
  parts.push(renderUrlQualitySection({ audits }), "");
  parts.push(renderDuplicateSignalsSection({ audits }), "");
  parts.push(renderBlogSection({ audits }), "");
  parts.push(renderServicesSection({ audits }), "");
  parts.push(renderRecommendedActions({ audits }), "");

  return `${parts.join("\n").replace(/\n{4,}/g, "\n\n\n").trimEnd()}\n`;
}

function renderExecutiveSummary({ summary, auditResults, crawl, discovery }) {
  const lines = [heading(2, "Executive Summary"), ""];

  lines.push(
    table(
      ["Metric", "Value"],
      [
        ["Public pages discovered", summary.totalPages],
        ["Indexable pages", summary.indexablePages],
        ["Noindex pages", summary.noindexPages],
        ["Excluded pages (admin, API, internal)", summary.excludedPages],
        ["ERROR findings", summary.errors],
        ["WARNING findings", summary.warnings],
        ["INFO findings", summary.infos],
        ["UNVERIFIED checks", summary.unverified],
        ["Total findings", summary.totalFindings],
      ],
    ),
    "",
  );

  if (!crawl.networkEnabled) {
    lines.push(
      "**No network access was used for this run.** Every page-level result is UNVERIFIED. Nothing about the live site was actually observed, so this report describes the auditor's configuration rather than the website.",
      "",
    );
  } else if (summary.errors === 0 && summary.warnings === 0) {
    lines.push(
      "No ERROR or WARNING findings were produced. The UNVERIFIED count, if non-zero, lists checks the auditor could not complete rather than problems found.",
      "",
    );
  } else {
    lines.push(
      `The auditor produced ${summary.errors} ERROR and ${summary.warnings} WARNING findings across ${summary.auditsRun} audits. Errors are listed in full below; every finding is also present in the JSON report with its evidence.`,
      "",
    );
  }

  lines.push(heading(3, "Findings by audit"), "");
  lines.push(
    table(
      ["Audit", "ERROR", "WARNING", "INFO", "UNVERIFIED"],
      summary.auditsByTally.map((entry) => [
        entry.name,
        entry.errors,
        entry.warnings,
        entry.infos,
        entry.unverified,
      ]),
    ),
    "",
  );

  lines.push(heading(3, "What the auditor cannot see"), "");
  lines.push(
    bulletList([
      "No search index, ranking position, impressions or click data.",
      "No Search Console or analytics reports.",
      "No rendering of JavaScript-only content beyond what the HTML itself contains.",
      "No real-world verification of any structured-data claim.",
      `${discovery.counts.candidateRoutes} routes were derived from the project's own source files; ${crawl.pages.length} URLs were actually fetched.`,
    ]),
    "",
  );

  return lines.join("\n");
}

function renderPageInventory({ crawl, discovery, audits }) {
  const lines = [heading(2, "Page Inventory"), ""];

  lines.push(
    "Every URL the auditor considered, with how it was discovered and its indexability verdict.",
    "",
  );

  const rows = crawl.pages.map((page) => [
    page.path,
    page.source,
    page.kind,
    page.status,
    page.indexability ? page.indexability.state : "UNKNOWN",
    page.fromSitemap ? "yes" : "no",
    page.fromSource ? "yes" : "no",
    page.inboundLinkCount,
  ]);

  lines.push(
    table(
      ["Path", "Discovered via", "Kind", "HTTP", "Indexability", "In sitemap", "From source", "Inbound links"],
      rows,
    ) || "_No pages were crawled._",
  );
  lines.push("");

  const discoverySummary = audits.discovery ? audits.discovery.summary : {};
  lines.push(heading(3, "Inventory totals"), "");
  lines.push(
    table(
      ["Item", "Count"],
      [
        ["Public pages crawled", crawl.pages.length],
        ["Indexable", discoverySummary.indexablePages],
        ["Noindex", discoverySummary.noindexPages],
        ["Blocked by robots.txt", discoverySummary.blockedPages],
        ["Canonical/noindex conflicts", discoverySummary.conflictingPages],
        ["Unverified", discoverySummary.unverifiedPages],
        ["Routes derived from source", discovery.counts.candidateRoutes],
        ["Route files found", discovery.counts.pageFiles],
        ["Blog articles in source", discovery.counts.blogPosts],
        ["Service pages in source", discovery.counts.servicePages],
        ["Published project records", discovery.counts.publishedProjects],
        ["Excluded routes", discovery.counts.excludedRoutes],
        ["Sitemap URLs", crawl.sitemap.urls.length],
      ],
    ),
    "",
  );

  if (crawl.skipped.length > 0) {
    lines.push(heading(3, "URLs not crawled"), "");
    lines.push(
      table(
        ["URL", "Reason"],
        crawl.skipped.map((entry) => [entry.url, entry.reason]),
      ),
      "",
    );
  }

  if (discovery.excluded.length > 0) {
    lines.push(heading(3, "Excluded routes"), "");
    lines.push(
      table(
        ["Path", "Reason", "Origin"],
        discovery.excluded.map((entry) => [entry.path, entry.reason, entry.origin || ""]),
      ),
      "",
    );
  }

  return lines.join("\n");
}

function renderCriticalErrors({ errors }) {
  const lines = [heading(2, "Critical Errors"), ""];
  lines.push(
    "Defects that damage indexability or metadata integrity. These are listed in full, never summarised away.",
    "",
  );
  lines.push(findingList(errors, { limit: 500 }), "");
  return lines.join("\n");
}

function renderWarnings({ warnings }) {
  const lines = [heading(2, "Warnings"), ""];
  lines.push(
    "Probable defects or values outside an advisory band. A warning is worth reviewing, not necessarily a mistake.",
    "",
  );
  lines.push(findingList(warnings, { limit: 500 }), "");
  return lines.join("\n");
}

function sortFindings(left, right) {
  const byAudit = String(left.audit).localeCompare(String(right.audit));
  if (byAudit !== 0) return byAudit;
  return String(left.url || "").localeCompare(String(right.url || ""));
}

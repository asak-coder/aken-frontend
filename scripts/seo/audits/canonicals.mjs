/**
 * AUDIT 4 - Canonical URLs.
 *
 * Severity mapping, with the reasoning stated so the thresholds are not
 * arbitrary:
 *
 *   ERROR   - no canonical on an indexable page, a relative canonical, a
 *             canonical on the wrong hostname, or more than one canonical
 *             is ambiguous and defeats the whole point of declaring one.
 *   WARNING - the canonical points at a different URL than the page being
 *             viewed while the page is still indexable
 *   INFO    - noindex together with a canonical to another URL. This is
 *             the documented, intentional consolidation pattern (a
 *             duplicate URL consolidating into its primary), not a defect.
 *
 * The auditor never writes a canonical.
 */

import { SITE } from "../lib/config.mjs";
import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages, indexablePages } from "./shared.mjs";
import { canonicalForm, normalizePathname } from "../lib/url-utils.mjs";

const AUDIT = "canonicals";

export function runCanonicalsAudit({ crawl }) {
  const findings = [];
  const observations = [];
  const pages = analysedPages(crawl);
  const indexable = indexablePages(crawl);
  const expectedHost = SITE.productionHost;

  for (const page of pages) {
    const head = page.headInfo;
    const hrefs = head ? head.canonicalHrefs : [];
    const isIndexable = page.indexability && page.indexability.state === "INDEXABLE";
    const selfForm = canonicalForm(new URL(page.url));

    if (hrefs.length === 0) {
      const severity = isIndexable ? SEVERITY.ERROR : SEVERITY.INFO;
      findings.push(
        createFinding({
          audit: AUDIT,
          severity,
          code: "canonical-missing",
          url: page.url,
          message: isIndexable
            ? "This page is indexable but declares no canonical URL, so any parameter or duplicate variant of it competes as a separate page."
            : "This page declares no canonical URL. It is not currently indexable, so the immediate impact is limited.",
          evidence: { indexability: page.indexability ? page.indexability.state : "UNKNOWN" },
        }),
      );
      observations.push({ code: "canonical", url: page.url, canonical: null, status: "MISSING" });
      continue;
    }

    if (hrefs.length > 1) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "canonical-duplicated",
          url: page.url,
          message: `${hrefs.length} canonical link elements were found. Multiple canonicals are ignored or resolved unpredictably, which is worse than declaring a single one.`,
          actual: hrefs.length,
          evidence: { canonicals: hrefs },
        }),
      );
    }

    const raw = hrefs[0];
    if (!isAbsolute(raw)) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "canonical-not-absolute",
          url: page.url,
          message: `The canonical URL "${raw}" is relative. Canonicals must be absolute so their meaning cannot change with the page or the context they are read in.`,
          actual: raw,
          evidence: { expectedForm: selfForm },
        }),
      );
    }

    let parsed = null;
    try {
      parsed = new URL(raw, page.url);
    } catch {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "canonical-unparseable",
          url: page.url,
          message: `The canonical value "${raw}" could not be parsed as a URL.`,
          actual: raw,
        }),
      );
      observations.push({ code: "canonical", url: page.url, canonical: raw, status: "UNPARSEABLE" });
      continue;
    }

    const host = parsed.hostname.toLowerCase();
    if (host !== expectedHost) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "canonical-wrong-host",
          url: page.url,
          message: `The canonical points at "${host}" but this site's canonical host is "${expectedHost}". A canonical on a different (or redirecting) host is ignored or splits signals.`,
          expected: `${SITE.productionOrigin}${parsed.pathname}`,
          actual: raw,
          evidence: { alternateHost: SITE.alternateHost, protocol: parsed.protocol },
        }),
      );
    }

    if (parsed.protocol !== "https:") {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "canonical-insecure-scheme",
          url: page.url,
          message: `The canonical uses "${parsed.protocol}" instead of https.`,
          expected: "https:",
          actual: parsed.protocol,
        }),
      );
    }

    const canonicalTarget = canonicalForm(parsed);
    const pointsElsewhere = canonicalTarget !== selfForm;

    if (pointsElsewhere) {
      const noindex = page.indexability && page.indexability.noindex;
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: noindex ? SEVERITY.INFO : SEVERITY.WARNING,
          code: noindex ? "canonical-consolidation-with-noindex" : "canonical-points-elsewhere",
          url: page.url,
          message: noindex
            ? `This page is noindexed and its canonical points at ${canonicalTarget}. This is a deliberate consolidation pattern; the target must itself be indexable and must return 200.`
            : `This page is indexable but declares ${canonicalTarget} as its canonical, so the search engine is being told to index a different URL.`,
          expected: selfForm,
          actual: canonicalTarget,
          evidence: { pagePath: page.path, canonicalPath: normalizePathname(parsed.pathname) },
        }),
      );
    }

    if (page.headers && page.redirects && page.redirects.length > 0) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "canonical-after-redirect",
          url: page.url,
          message:
            "This URL redirected before its content was reached, so the canonical that was read describes the destination, not the URL that was requested.",
          evidence: { redirects: page.redirects.map((hop) => hop.to) },
        }),
      );
    }

    observations.push({
      code: "canonical",
      url: page.url,
      canonical: raw,
      canonicalTarget,
      self: selfForm,
      pointsElsewhere,
      host,
      indexability: page.indexability ? page.indexability.state : "UNKNOWN",
      status: pointsElsewhere ? "POINTS_ELSEWHERE" : "SELF",
    });
  }

  const hostCounts = new Map();
  for (const observation of observations) {
    if (!observation.canonicalTarget) continue;
    const key = String(observation.canonicalTarget).split("/")[2] || "(unparsed)";
    hostCounts.set(key, (hostCounts.get(key) || 0) + 1);
  }

  const trailingSlashMismatch = observations.filter((observation) => {
    if (!observation.canonical) return false;
    const raw = String(observation.canonical);
    try {
      const url = new URL(raw);
      return url.pathname.length > 1 && url.pathname.endsWith("/");
    } catch {
      return false;
    }
  });

  for (const observation of trailingSlashMismatch) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.WARNING,
        code: "canonical-trailing-slash",
        url: observation.url,
        message: `The canonical "${observation.canonical}" ends with a trailing slash, but this site's own routes are served without one. Inconsistent slash usage creates two spellings of the same URL.`,
        expected: String(observation.canonical).replace(/\/+$/, ""),
        actual: observation.canonical,
      }),
    );
  }

  return buildAuditResult({
    id: AUDIT,
    name: "Canonical URLs",
    description: "Presence, format, hostname and target of rel=canonical on every crawled page.",
    findings,
    summary: {
      pagesChecked: pages.length,
      indexablePages: indexable.length,
      missingCanonical: observations.filter((observation) => observation.status === "MISSING").length,
      canonicalSelf: observations.filter((observation) => observation.status === "SELF").length,
      canonicalPointsElsewhere: observations.filter((observation) => observation.status === "POINTS_ELSEWHERE").length,
      canonicalUnparseable: observations.filter((observation) => observation.status === "UNPARSEABLE").length,
      expectedHost,
      hostsSeen: [...hostCounts.entries()].map(([host, count]) => ({ host, count })),
    },
    observations,
  });
}

function isAbsolute(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

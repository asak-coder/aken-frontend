/**
 * AUDIT 11 - External links.
 *
 * Probes outbound links discovered in public page content, bounded by
 * RUN_LIMITS.maxExternalLinkProbes. Every probe goes through the same HTTP
 * client as everything else, so the SSRF guard, timeout, redirect cap and
 * byte ceiling all apply.
 *
 * Severity mapping deliberately avoids calling a transient failure broken:
 *   ERROR      - 404, 410 or 451: the resource is definitively gone
 *   WARNING    - 401, 403, 429 or a permanent redirect chain: reachable
 *                but refusing this client, which may be bot protection
 *   UNVERIFIED - timeout, DNS failure, 5xx or a blocked probe. The
 *                auditor says it could not tell, rather than guessing.
 *   INFO       - an http:// link on a host that also answers on https
 *
 * This is why the report uses UNVERIFIED rather than "broken" for a 503:
 * a slow origin server is not evidence that a link is dead.
 */

import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages } from "./shared.mjs";
import { LINK_KIND } from "../lib/extract/links.mjs";
import { RUN_LIMITS } from "../lib/config.mjs";
import { mapWithConcurrency } from "../lib/rate-limiter.mjs";

const AUDIT = "external-links";
const PROBE_CONCURRENCY = 3;

export async function runExternalLinksAudit({ crawl, client }) {
  const findings = [];
  const observations = [];
  const pages = analysedPages(crawl);

  const targets = new Map();

  for (const page of pages) {
    for (const anchor of page.anchors) {
      if (anchor.kind !== LINK_KIND.EXTERNAL || !anchor.url) continue;
      const key = `${anchor.url.protocol}//${anchor.url.host}${anchor.url.pathname}${anchor.url.search}`;
      const target = targets.get(key) || {
        key,
        url: anchor.url,
        links: [],
        rel: new Set(),
        insecure: anchor.usesHttp === true,
      };
      target.links.push({ from: page.path, text: anchor.text, rel: anchor.rel });
      if (anchor.rel) {
        for (const token of anchor.rel.split(/\s+/).filter(Boolean)) target.rel.add(token);
      }
      targets.set(key, target);
    }

    const malformed = page.anchors.filter((anchor) => anchor.kind === LINK_KIND.MALFORMED);
    for (const anchor of malformed) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "link-malformed-href",
          url: page.url,
          message: `An anchor has an href that cannot be parsed as a URL: "${anchor.rawHref}".`,
          actual: anchor.rawHref,
        }),
      );
    }
  }

  const allTargets = [...targets.values()];
  const probeList = allTargets.slice(0, RUN_LIMITS.maxExternalLinkProbes);
  const skipped = allTargets.slice(RUN_LIMITS.maxExternalLinkProbes);

  const probes = await mapWithConcurrency(probeList, PROBE_CONCURRENCY, async (target) => {
    try {
      const response = await client.head(target.url, { accept: "*/*" });
      return { target, response };
    } catch (error) {
      return {
        target,
        response: {
          status: 0,
          ok: false,
          error: {
            code: "PROBE_FAILED",
            message: error instanceof Error ? error.message : String(error),
          },
        },
      };
    }
  });

  for (const { target, response } of probes) {
    const linkedFrom = target.links.map((link) => link.from);
    const anchorTexts = target.links.map((link) => link.text).filter(Boolean).slice(0, 5);

    if (target.insecure) {
      const httpsUrl = new URL(target.url.toString());
      httpsUrl.protocol = "https:";
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.INFO,
          code: "external-link-http-not-https",
          url: target.url.toString(),
          message: `This outbound link uses http:// rather than https://. If the destination supports TLS, link to the https form.`,
          evidence: { httpsForm: httpsUrl.toString(), linkedFrom },
        }),
      );
    }

    if (response.blocked) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "external-link-probe-blocked",
          url: target.url.toString(),
          message: `This outbound target was refused by the auditor's safety guard: ${response.blocked.reason}. It was not contacted.`,
          evidence: { linkedFrom },
        }),
      );
      continue;
    }

    if (response.error) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.UNVERIFIED,
          code: "external-link-unverified",
          url: target.url.toString(),
          message: `This outbound link could not be verified (${response.error.code}: ${response.error.message}). A transport failure is not evidence that the destination is gone.`,
          evidence: { linkedFrom },
        }),
      );
      continue;
    }

    const status = response.status;

    if (status >= 200 && status < 300) {
      observations.push({
        code: "external-link-pass",
        url: target.url.toString(),
        status,
        linkedFrom,
        anchorTexts,
        rel: [...target.rel],
      });
      continue;
    }

    if (status === 404 || status === 410 || status === 451) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "external-link-broken",
          url: target.url.toString(),
          message: `This outbound link returns HTTP ${status}, so the destination no longer exists.`,
          actual: status,
          evidence: { linkedFrom, anchorTexts },
        }),
      );
      continue;
    }

    if (status === 401 || status === 403 || status === 429) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "external-link-refused",
          url: target.url.toString(),
          message: `This outbound link returns HTTP ${status}. The destination exists but refused this automated request, which is common bot protection and does not necessarily mean the link is broken for a visitor.`,
          actual: status,
          evidence: { linkedFrom, anchorTexts },
        }),
      );
      continue;
    }

    if (status >= 300 && status < 400) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.INFO,
          code: "external-link-permanent-redirect",
          url: target.url.toString(),
          message: `This outbound link permanently redirects (HTTP ${status}). Consider updating the href to the destination.`,
          evidence: { location: response.headers ? response.headers.location : null, linkedFrom },
        }),
      );
      continue;
    }

    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.UNVERIFIED,
        code: "external-link-server-error",
        url: target.url.toString(),
        message: `This outbound link returned HTTP ${status}. Server errors are frequently temporary, so this is reported as unverified rather than broken.`,
        actual: status,
        evidence: { linkedFrom, anchorTexts },
      }),
    );
  }

  for (const target of skipped) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.UNVERIFIED,
        code: "external-link-probe-limit-reached",
        url: target.url.toString(),
        message: `The external-link probe limit of ${RUN_LIMITS.maxExternalLinkProbes} was reached before this target could be checked.`,
        evidence: { linkedFrom: target.links.map((link) => link.from) },
      }),
    );
  }

  const hosts = new Set(allTargets.map((target) => target.url.hostname));

  return buildAuditResult({
    id: AUDIT,
    name: "External links",
    description:
      "Outbound link reachability, http/https usage and malformed hrefs. Transient failures are reported as UNVERIFIED, never as broken.",
    findings,
    summary: {
      pagesChecked: pages.length,
      uniqueExternalTargets: allTargets.length,
      uniqueExternalHosts: hosts.size,
      probedTargets: probeList.length,
      skippedByProbeLimit: skipped.length,
      reachable: findings.length === 0 ? allTargets.length : undefined,
      hosts: [...hosts].sort(),
    },
    observations,
  });
}

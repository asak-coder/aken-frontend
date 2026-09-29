/**
 * AUDIT 10 - Internal links.
 *
 * Works from the link graph the crawl already built, then probes only the
 * internal targets the crawl never fetched (a link to a page nobody links
 * to from anywhere crawlable, or a typo'd href).
 *
 * Probing is bounded by RUN_LIMITS.maxInternalLinkProbes and uses HEAD,
 * so a link audit can never turn into a full second crawl.
 *
 * Severity mapping:
 *   ERROR      - a link resolves to a 4xx/5xx, or to a path that exists
 *                nowhere in the project and is not served
 *   WARNING    - inconsistent URL spelling for the same target, or a page
 *                with no inbound internal links and no sitemap entry
 *   INFO       - a target linked an unusual number of times from one page
 *   UNVERIFIED - a probe did not complete reliably
 *
 * Deliberately absent: "this page has few links, call it an orphan". A
 * page is only called an orphan here when the crawl can show it has zero
 * inbound internal links AND no sitemap entry. Everything else is
 * reported as an observation.
 */

import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages } from "./shared.mjs";
import { LINK_KIND } from "../lib/extract/links.mjs";
import { RUN_LIMITS } from "../lib/config.mjs";
import { mapWithConcurrency } from "../lib/rate-limiter.mjs";
import { canonicalForm, pageKey, trackingParamsPresent } from "../lib/url-utils.mjs";

const AUDIT = "internal-links";
const REPEAT_THRESHOLD = 10;

export async function runInternalLinksAudit({ crawl, client, discovery }) {
  const findings = [];
  const observations = [];
  const pages = analysedPages(crawl);
  const knownPaths = new Set(discovery.candidates.map((candidate) => canonicalForm(new URL(candidate.path, crawl.origin))));

  const pageByKey = new Map();
  for (const page of crawl.pages) {
    pageByKey.set(pageKey(new URL(page.url)), page);
  }

  const targetInfo = new Map();
  const inbound = new Map();
  const linkSources = [];

  for (const page of pages) {
    const perTargetCounts = new Map();

    for (const anchor of page.anchors) {
      if (anchor.kind !== LINK_KIND.INTERNAL || !anchor.url) continue;
      if (anchor.isAsset) continue;

      const key = canonicalForm(anchor.url);
      const target = targetInfo.get(key) || {
        key,
        url: anchor.url,
        rawForms: new Set(),
        links: [],
        trackingParams: new Set(),
      };

      target.rawForms.add(anchor.rawHref || "");
      target.links.push({ from: page.path, fromUrl: page.url, text: anchor.text, rawHref: anchor.rawHref });
      for (const param of trackingParamsPresent(anchor.url)) target.trackingParams.add(param);
      targetInfo.set(key, target);

      perTargetCounts.set(key, (perTargetCounts.get(key) || 0) + 1);
      if (!inbound.has(key)) inbound.set(key, new Set());
      inbound.get(key).add(page.path);

      linkSources.push({ from: page.path, to: key, rawHref: anchor.rawHref });
    }

    for (const [key, count] of perTargetCounts) {
      if (count > REPEAT_THRESHOLD) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.INFO,
            code: "internal-link-repeated",
            url: page.url,
            message: `This page links to ${key} ${count} times. Repeated identical links add no signal and lengthen the page; consider consolidating them.`,
            actual: count,
            evidence: { target: key },
          }),
        );
      }
    }
  }

  const uncrawled = [...targetInfo.values()].filter(
    (target) => !pageByKey.has(pageKey(target.url)),
  );

  const probeTargets = uncrawled.slice(0, RUN_LIMITS.maxInternalLinkProbes);
  const skippedTargets = uncrawled.slice(RUN_LIMITS.maxInternalLinkProbes);

  const probes = await mapWithConcurrency(probeTargets, 4, async (target) => {
    try {
      const response = await client.head(target.url);
      return { target, response };
    } catch (error) {
      return {
        target,
        response: {
          status: 0,
          ok: false,
          error: { code: "PROBE_FAILED", message: error instanceof Error ? error.message : String(error) },
        },
      };
    }
  });

  const probedByKey = new Map(probes.map((entry) => [entry.target.key, entry.response]));

  for (const target of targetInfo.values()) {
    const crawled = pageByKey.get(pageKey(target.url));
    const probe = probedByKey.get(target.key);

    if (crawled) {
      if (!crawled.ok) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.ERROR,
            code: "internal-link-broken",
            url: target.url.toString(),
            message: `A crawled page returns HTTP ${crawled.status}, so every internal link pointing at it is broken.`,
            evidence: {
              status: crawled.status,
              linkedFrom: [...(inbound.get(target.key) || [])],
              anchorTexts: target.links.map((link) => link.text).slice(0, 10),
            },
          }),
        );
      }
      continue;
    }

    if (probe) {
      if (probe.blocked) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.WARNING,
            code: "internal-link-probe-blocked",
            url: target.url.toString(),
            message: `This internal link target was refused by the auditor's safety guard: ${probe.blocked.reason}`,
            evidence: { linkedFrom: [...(inbound.get(target.key) || [])] },
          }),
        );
        continue;
      }

      if (probe.error) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.UNVERIFIED,
            code: "internal-link-unverified",
            url: target.url.toString(),
            message: `This internal link target could not be verified (${probe.error.code}: ${probe.error.message}).`,
            evidence: { linkedFrom: [...(inbound.get(target.key) || [])] },
          }),
        );
        continue;
      }

      if (probe.status === 405 || probe.status === 501) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.UNVERIFIED,
            code: "internal-link-head-not-allowed",
            url: target.url.toString(),
            message: `The server answered HTTP ${probe.status} to a HEAD request, so this link could not be verified with a cheap probe.`,
            evidence: { linkedFrom: [...(inbound.get(target.key) || [])] },
          }),
        );
        continue;
      }

      if (probe.status >= 400) {
        const pathKnown = knownPaths.has(target.key);
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.ERROR,
            code: pathKnown ? "internal-link-broken" : "internal-link-target-unknown",
            url: target.url.toString(),
            message: pathKnown
              ? `This internal link returns HTTP ${probe.status}. The linked page exists in the project but does not respond successfully.`
              : `This internal link returns HTTP ${probe.status} and no route file in the project produces it, so the link references a page that does not exist.`,
            evidence: {
              status: probe.status,
              linkedFrom: [...(inbound.get(target.key) || [])],
              anchorTexts: target.links.map((link) => link.text).slice(0, 10),
              rawHrefs: [...target.rawForms].slice(0, 10),
            },
          }),
        );
        continue;
      }

      if (probe.status >= 300) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.WARNING,
            code: "internal-link-redirects",
            url: target.url.toString(),
            message: `This internal link redirects (HTTP ${probe.status}). Link directly to the destination so the redirect is not on every navigation.`,
            evidence: {
              location: probe.headers ? probe.headers.location : null,
              linkedFrom: [...(inbound.get(target.key) || [])],
            },
          }),
        );
      }
    }

    if (target.rawForms.size > 1) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "internal-link-inconsistent-form",
          url: target.url.toString(),
          message: `The same target is linked with ${target.rawForms.size} different href spellings. Inconsistent spelling makes the link graph harder to reason about and can create duplicate URL variants.`,
          evidence: { forms: [...target.rawForms] },
        }),
      );
    }

    if (target.trackingParams.size > 0) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.INFO,
          code: "internal-link-tracking-parameters",
          url: target.url.toString(),
          message: `Internal links to this page carry tracking parameters (${[...target.trackingParams].join(", ")}). Internal links should point at the clean URL.`,
          evidence: { parameters: [...target.trackingParams], linkedFrom: [...(inbound.get(target.key) || [])] },
        }),
      );
    }
  }

  for (const entry of skippedTargets) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.UNVERIFIED,
        code: "internal-link-probe-limit-reached",
        url: entry.url.toString(),
        message: `The internal-link probe limit of ${RUN_LIMITS.maxInternalLinkProbes} was reached before this target could be checked.`,
        evidence: { linkedFrom: [...(inbound.get(entry.key) || [])] },
      }),
    );
  }

  const sitemapKeys = new Set(crawl.sitemap.urls.map((raw) => {
    try {
      return canonicalForm(new URL(raw, crawl.origin));
    } catch {
      return raw;
    }
  }));

  const orphanCandidates = crawl.pages.filter((page) => {
    const key = canonicalForm(new URL(page.url));
    const hasInbound = (inbound.get(key) || new Set()).size > 0;
    const inSitemap = sitemapKeys.has(key);
    const isRoot = page.path === "/";
    return page.doc !== null && !hasInbound && !inSitemap && !isRoot;
  });

  const nonIndexableOrphans = [];

  for (const page of orphanCandidates) {
    const key = canonicalForm(new URL(page.url));
    const state = page.indexability ? page.indexability.state : "UNKNOWN";

    if (state !== "INDEXABLE") {
      nonIndexableOrphans.push({ url: page.url, path: page.path, indexability: state });
      continue;
    }

    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.WARNING,
        code: "orphan-page",
        url: page.url,
        message:
          "This page has no inbound internal links anywhere in the crawl and is not listed in the sitemap, so only an external link or a search engine guess could reach it.",
        evidence: {
          path: page.path,
          kind: page.kind,
          inSitemap: false,
          inboundInternalLinks: 0,
          indexability: state,
        },
      }),
    );
  }

  const outboundCounts = {};
  for (const page of pages) {
    const targets = new Set(
      page.anchors
        .filter((anchor) => anchor.kind === LINK_KIND.INTERNAL && anchor.url && !anchor.isAsset)
        .map((anchor) => canonicalForm(anchor.url)),
    );
    outboundCounts[page.path] = targets.size;
  }

  observations.push({
    code: "internal-link-graph",
    uniqueTargets: targetInfo.size,
    probedTargets: probeTargets.length,
    uncrawledTargets: uncrawled.length,
    pagesWithZeroInbound: orphanCandidates.length,
    nonIndexableZeroInbound: nonIndexableOrphans,
    outboundUniqueTargetsPerPage: outboundCounts,
  });

  return buildAuditResult({
    id: AUDIT,
    name: "Internal links",
    description:
      "Broken internal links, orphan pages, repeated links and inconsistent URL forms. Evidence is recorded for every claim.",
    findings,
    summary: {
      pagesChecked: pages.length,
      uniqueInternalTargets: targetInfo.size,
      probedTargets: probeTargets.length,
      skippedByProbeLimit: skippedTargets.length,
      brokenLinks: findings.filter((finding) => finding.code.startsWith("internal-link-broken") || finding.code === "internal-link-target-unknown").length,
      orphanPages: findings.filter((finding) => finding.code === "orphan-page").length,
      redirectingLinks: findings.filter((finding) => finding.code === "internal-link-redirects").length,
      inconsistentForms: findings.filter((finding) => finding.code === "internal-link-inconsistent-form").length,
    },
    observations,
  });
}

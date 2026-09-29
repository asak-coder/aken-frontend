/**
 * AUDIT 12 - Image SEO and accessibility.
 *
 * Severity mapping, and why an empty alt is not treated as a defect:
 *
 *   ERROR      - no alt attribute at all. This is a real accessibility and
 *                indexing defect: assistive technology has nothing to read.
 *   WARNING    - a generic alt ("image", "photo", "img1"), which describes
 *                nothing, or an image with neither width/height nor lazy
 *                loading, which causes layout shift.
 *   INFO       - alt="" on a decorative image, or alt that mirrors the
 *                filename. Both are legitimate; they are recorded so a
 *                human can confirm the intent.
 *   UNVERIFIED - an image URL could not be probed.
 *
 * The auditor NEVER rewrites alt text and NEVER touches the AKEN logo. The
 * official logo is identified by path and reported under its own code so
 * that it appears in the report as a protected asset rather than an issue.
 */

import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages } from "./shared.mjs";
import { RUN_LIMITS } from "../lib/config.mjs";
import { mapWithConcurrency } from "../lib/rate-limiter.mjs";
import { imageSummary } from "../lib/extract/images.mjs";

const AUDIT = "images";
const PROBE_CONCURRENCY = 4;
const LOGO_PATH_PATTERN = /\/logo\/aken-logo\.(png|svg|webp)$/i;

export async function runImagesAudit({ crawl, client }) {
  const findings = [];
  const observations = [];
  const pages = analysedPages(crawl);

  const assetIndex = new Map();
  const logoUsages = [];

  for (const page of pages) {
    for (const image of page.images) {
      const src = image.resolvedAsset || image.rawSrc;
      if (!src) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.ERROR,
            code: "image-missing-src",
            url: page.url,
            message: "An <img> element has neither a src nor a data-src attribute, so it can never render.",
          }),
        );
        continue;
      }

      let resolved = null;
      try {
        resolved = new URL(src, page.url);
      } catch {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.ERROR,
            code: "image-unparseable-src",
            url: page.url,
            message: `An <img> element has a src that cannot be parsed as a URL: "${src}".`,
            actual: src,
          }),
        );
        continue;
      }

      const isLogo = LOGO_PATH_PATTERN.test(resolved.pathname);
      if (isLogo) {
        logoUsages.push({ page: page.path, src: resolved.pathname, alt: image.alt });
        continue;
      }

      if (!image.altAttributePresent) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.ERROR,
            code: "image-missing-alt",
            url: page.url,
            message:
              "An <img> element has no alt attribute. Add alt text describing the image, or alt=\"\" if it is purely decorative.",
            evidence: { src: resolved.pathname, width: image.width, height: image.height },
          }),
        );
      } else if (image.altIsGeneric) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.WARNING,
            code: "image-generic-alt",
            url: page.url,
            message: `An image uses the generic alt text "${image.alt}", which describes nothing to a reader or a crawler.`,
            actual: image.alt,
            evidence: { src: resolved.pathname },
          }),
        );
      } else if (image.altIsEmpty) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.INFO,
            code: "image-empty-alt",
            url: page.url,
            message:
              "An image has alt=\"\", marking it as decorative. That is correct for a decorative image and incorrect for a meaningful one; only a human can confirm which this is.",
            evidence: { src: resolved.pathname },
          }),
        );
      } else if (image.altMatchesFilename) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.INFO,
            code: "image-alt-mirrors-filename",
            url: page.url,
            message: `The alt text matches the file name, which usually means it was auto-generated rather than written.`,
            actual: image.alt,
            evidence: { src: resolved.pathname },
          }),
        );
      }

      if (!image.hasDimensions && image.loading !== "lazy") {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.WARNING,
            code: "image-without-dimensions",
            url: page.url,
            message:
              "An image declares neither width nor height and is not lazy-loaded, so it can shift the layout as it loads.",
            evidence: { src: resolved.pathname, loading: image.loading },
          }),
        );
      }

      const key = resolved.toString();
      const entry = assetIndex.get(key) || { url: resolved, usedOn: [], altValues: new Set() };
      entry.usedOn.push(page.path);
      if (image.alt) entry.altValues.add(image.alt);
      assetIndex.set(key, entry);
    }
  }

  const probeList = [...assetIndex.values()].slice(0, RUN_LIMITS.maxImageProbes);
  const skipped = [...assetIndex.values()].slice(RUN_LIMITS.maxImageProbes);

  const probes = await mapWithConcurrency(probeList, PROBE_CONCURRENCY, async (entry) => {
    try {
      const response = await client.head(entry.url, { accept: "image/*,*/*" });
      return { entry, response };
    } catch (error) {
      return {
        entry,
        response: {
          status: 0,
          ok: false,
          error: { code: "PROBE_FAILED", message: error instanceof Error ? error.message : String(error) },
        },
      };
    }
  });

  for (const { entry, response } of probes) {
    if (response.blocked) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "image-probe-blocked",
          url: entry.url.toString(),
          message: `This image URL was refused by the auditor's safety guard: ${response.blocked.reason}`,
          evidence: { usedOn: entry.usedOn },
        }),
      );
      continue;
    }

    if (response.error) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.UNVERIFIED,
          code: "image-unverified",
          url: entry.url.toString(),
          message: `This image could not be verified (${response.error.code}: ${response.error.message}).`,
          evidence: { usedOn: entry.usedOn },
        }),
      );
      continue;
    }

    if (response.status >= 400) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.ERROR,
          code: "image-broken",
          url: entry.url.toString(),
          message: `This image returns HTTP ${response.status}, so it renders as a broken placeholder.`,
          actual: response.status,
          evidence: { usedOn: entry.usedOn },
        }),
      );
      continue;
    }

    observations.push({
      code: "image-asset",
      url: entry.url.toString(),
      status: response.status,
      contentType: response.contentType,
      usedOn: entry.usedOn,
      altValues: [...entry.altValues],
      bytes: response.bytesRead,
    });
  }

  for (const entry of skipped) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.UNVERIFIED,
        code: "image-probe-limit-reached",
        url: entry.url.toString(),
        message: `The image probe limit of ${RUN_LIMITS.maxImageProbes} was reached before this asset could be checked.`,
        evidence: { usedOn: entry.usedOn },
      }),
    );
  }

  const totals = pages.reduce(
    (accumulator, page) => {
      const summary = imageSummary(page.images);
      accumulator.total += summary.total;
      accumulator.missingAlt += summary.missingAlt;
      accumulator.emptyAlt += summary.emptyAlt;
      accumulator.genericAlt += summary.genericAlt;
      accumulator.withoutDimensions += summary.withoutDimensions;
      return accumulator;
    },
    { total: 0, missingAlt: 0, emptyAlt: 0, genericAlt: 0, withoutDimensions: 0 },
  );

  return buildAuditResult({
    id: AUDIT,
    name: "Images",
    description:
      "Alt text, dimensions, broken image URLs and the protected AKEN logo. Alt text is never rewritten and no image is ever replaced.",
    findings,
    summary: {
      pagesChecked: pages.length,
      totalImages: totals.total,
      missingAlt: totals.missingAlt,
      emptyAlt: totals.emptyAlt,
      genericAlt: totals.genericAlt,
      withoutDimensions: totals.withoutDimensions,
      uniqueAssets: assetIndex.size,
      probedAssets: probeList.length,
      protectedLogoUsages: logoUsages.length,
      note: "The official AKEN logo is identified and excluded from alt-text findings; it is reported, never modified.",
    },
    observations,
  });
}

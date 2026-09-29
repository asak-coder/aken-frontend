/**
 * Markdown renderers for the link and asset sections:
 * Internal Links, External Links, Images, Indexability.
 */

import { code, findingList, heading, table } from "./markdown-format.mjs";

export function renderInternalLinksSection({ audits }) {
  const lines = [heading(2, "Internal Links"), ""];
  const internalLinks = audits.internalLinks;

  lines.push(
    "Broken internal links, orphan pages, repeated links and inconsistent URL forms. A page is only called an orphan when the crawl can show it has zero inbound internal links and no sitemap entry.",
    "",
  );

  const summary = internalLinks.summary || {};
  lines.push(
    table(
      ["Metric", "Value"],
      [
        ["Pages checked", summary.pagesChecked],
        ["Unique internal targets", summary.uniqueInternalTargets],
        ["Targets probed", summary.probedTargets],
        ["Skipped by probe limit", summary.skippedByProbeLimit],
        ["Broken links", summary.brokenLinks],
        ["Orphan pages", summary.orphanPages],
        ["Redirecting links", summary.redirectingLinks],
        ["Inconsistent URL forms", summary.inconsistentForms],
      ],
    ),
    "",
  );

  const graph = (internalLinks.observations || []).find(
    (entry) => entry.outboundUniqueTargetsPerPage,
  );

  if (graph) {
    const rows = Object.entries(graph.outboundUniqueTargetsPerPage)
      .sort((left, right) => left[1] - right[1])
      .map(([page, count]) => [page, count]);
    lines.push(heading(3, "Unique outbound internal targets per page"), "");
    lines.push(table(["Page", "Unique internal targets"], rows), "");
  }

  lines.push(findingList(internalLinks.findings), "");
  return lines.join("\n");
}

export function renderExternalLinksSection({ audits }) {
  const lines = [heading(2, "External Links"), ""];
  const externalLinks = audits.externalLinks;

  lines.push(
    "Outbound link reachability. A transport failure or a 5xx status is reported as UNVERIFIED, never as broken: a temporary network problem is not evidence that a link is dead.",
    "",
  );

  const summary = externalLinks.summary || {};
  lines.push(
    table(
      ["Metric", "Value"],
      [
        ["Pages checked", summary.pagesChecked],
        ["Unique external targets", summary.uniqueExternalTargets],
        ["Unique external hosts", summary.uniqueExternalHosts],
        ["Targets probed", summary.probedTargets],
        ["Skipped by probe limit", summary.skippedByProbeLimit],
      ],
    ),
    "",
  );

  const hosts = summary.hosts || [];
  if (hosts.length > 0) {
    lines.push(heading(3, "Outbound hosts"), "");
    lines.push(hosts.map((host) => `- ${code(host)}`).join("\n"), "");
  }

  const passing = (externalLinks.observations || []).filter(
    (entry) => entry.code === "external-link-pass",
  );

  if (passing.length > 0) {
    lines.push(heading(3, "Reachable outbound links"), "");
    lines.push(
      table(
        ["URL", "Status", "Linked from"],
        passing.map((entry) => [entry.url, entry.status, (entry.linkedFrom || []).join(", ")]),
      ),
      "",
    );
  }

  lines.push(findingList(externalLinks.findings), "");
  return lines.join("\n");
}

export function renderImagesSection({ audits }) {
  const lines = [heading(2, "Images"), ""];
  const images = audits.images;

  lines.push(
    "Alt text, dimensions and broken image URLs. Alt text is never rewritten, no image is ever replaced, and the official AKEN logo is explicitly protected from any recommendation.",
    "",
  );

  const summary = images.summary || {};
  lines.push(
    table(
      ["Metric", "Value"],
      [
        ["Pages checked", summary.pagesChecked],
        ["Total img elements", summary.totalImages],
        ["Missing alt attribute", summary.missingAlt],
        ["Empty alt (decorative)", summary.emptyAlt],
        ["Generic alt text", summary.genericAlt],
        ["Without dimensions and not lazy", summary.withoutDimensions],
        ["Unique assets", summary.uniqueAssets],
        ["Assets probed", summary.probedAssets],
        ["Protected logo usages", summary.protectedLogoUsages],
      ],
    ),
    "",
  );

  const assets = (images.observations || []).filter((entry) => entry.code === "image-asset");
  if (assets.length > 0) {
    lines.push(heading(3, "Probed assets"), "");
    lines.push(
      table(
        ["Asset", "Status", "Type", "Used on"],
        assets.map((entry) => [
          entry.url,
          entry.status,
          entry.contentType,
          (entry.usedOn || []).join(", "),
        ]),
      ),
      "",
    );
  }

  lines.push(findingList(images.findings), "");
  return lines.join("\n");
}

export function renderIndexabilitySection({ audits }) {
  const lines = [heading(2, "Indexability"), ""];
  const indexability = audits.indexability;

  lines.push(
    "Robots directives, X-Robots-Tag, robots.txt rules and canonical conflicts. The auditor reports the state and never changes it: no noindex is removed and no canonical is rewritten.",
    "",
  );

  const summary = indexability.summary || {};
  lines.push(
    table(
      ["State", "URLs"],
      [
        ["INDEXABLE", summary.indexable],
        ["NOINDEX", summary.noindex],
        ["BLOCKED", summary.blocked],
        ["CONFLICT", summary.conflict],
        ["UNVERIFIED", summary.unverified],
        ["URLs checked", summary.urlsChecked],
        ["Pages with X-Robots-Tag", summary.pagesWithXRobotsTag],
        ["Pages with meta robots", summary.pagesWithMetaRobots],
      ],
    ),
    "",
  );

  const rows = (indexability.observations || []).map((entry) => [
    entry.url,
    entry.state,
    entry.metaRobots || "",
    entry.xRobotsTag || "",
    entry.canonicalTarget || "",
  ]);

  lines.push(
    table(["URL", "State", "meta robots", "X-Robots-Tag", "Canonical"], rows) ||
      "_No indexability data was collected._",
  );
  lines.push("");

  lines.push(findingList(indexability.findings), "");
  return lines.join("\n");
}

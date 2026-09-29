/**
 * Markdown renderers for the page-metadata sections:
 * Metadata (title + description), Canonicals, Heading Structure.
 */

import { findingList, heading, table, truncate } from "./markdown-format.mjs";

export function renderMetadataSection({ audits }) {
  const lines = [heading(2, "Metadata"), ""];
  const titles = audits.titles;
  const descriptions = audits.descriptions;

  lines.push(
    "Title and meta-description coverage. Length bands are advisory: they describe how a value is likely to be displayed, not how any search engine ranks it.",
    "",
  );

  lines.push(heading(3, "Titles"), "");
  const titleRows = (titles.observations || []).map((entry) => [
    entry.url,
    entry.title || "(none)",
    entry.length,
    entry.indexability,
  ]);
  lines.push(
    table(["URL", "Title", "Length", "Indexability"], titleRows) ||
      "_No titles were collected._",
  );
  lines.push("");
  if (titles.summary) {
    lines.push(
      `Advisory band: ${titles.summary.advisoryBand}. Missing: ${titles.summary.missingTitles}. Too long: ${titles.summary.tooLong}. Too short: ${titles.summary.tooShort}. Duplicate groups: ${titles.summary.duplicateTitleGroups}.`,
      "",
    );
  }
  lines.push(findingList(titles.findings), "");

  lines.push(heading(3, "Meta descriptions"), "");
  const descriptionRows = (descriptions.observations || []).map((entry) => [
    entry.url,
    truncate(entry.description || "(none)", 120),
    entry.length,
    entry.indexability,
  ]);
  lines.push(
    table(["URL", "Description", "Length", "Indexability"], descriptionRows) ||
      "_No descriptions were collected._",
  );
  lines.push("");
  if (descriptions.summary) {
    lines.push(
      `Advisory band: ${descriptions.summary.advisoryBand}. Missing: ${descriptions.summary.missingDescriptions}. Too long: ${descriptions.summary.tooLong}. Too short: ${descriptions.summary.tooShort}. Duplicate groups: ${descriptions.summary.duplicateDescriptionGroups}.`,
      "",
    );
  }
  lines.push(findingList(descriptions.findings), "");

  return lines.join("\n");
}

export function renderCanonicalsSection({ audits }) {
  const lines = [heading(2, "Canonicals"), ""];
  const canonicals = audits.canonicals;

  lines.push(
    "Presence, format and target of rel=canonical. A noindexed page pointing its canonical at another URL is the documented consolidation pattern, not a defect.",
    "",
  );

  const rows = (canonicals.observations || []).map((entry) => [
    entry.url,
    entry.canonical || "(none)",
    entry.canonicalTarget || "",
    entry.pointsElsewhere ? "points elsewhere" : "self",
    entry.indexability,
  ]);

  lines.push(
    table(["URL", "Canonical", "Normalised target", "Target", "Indexability"], rows) ||
      "_No canonicals were collected._",
  );
  lines.push("");

  if (canonicals.summary) {
    lines.push(
      `Missing: ${canonicals.summary.missingCanonical}. Self-referencing: ${canonicals.summary.canonicalSelf}. Pointing elsewhere: ${canonicals.summary.canonicalPointsElsewhere}. Expected host: ${canonicals.summary.expectedHost}.`,
      "",
    );
    const hosts = canonicals.summary.hostsSeen || [];
    if (hosts.length > 0) {
      lines.push(
        table(["Canonical host seen", "Count"], hosts.map((entry) => [entry.host, entry.count])),
        "",
      );
    }
  }

  lines.push(findingList(canonicals.findings), "");
  return lines.join("\n");
}

export function renderHeadingStructureSection({ audits }) {
  const lines = [heading(2, "Heading Structure"), ""];
  const headingAudit = audits.headings;
  const h1 = audits.h1;

  lines.push(
    "Heading-level jumps and empty headings are advisory. They are reported as informational because heading levels are an authoring decision, not a validity rule.",
    "",
  );

  lines.push(heading(3, "H1 coverage"), "");
  const h1Rows = (h1.observations || []).map((entry) => [
    entry.url,
    entry.h1Count,
    entry.h1Texts && entry.h1Texts.length > 0 ? entry.h1Texts[0] : "(none)",
    entry.indexability,
  ]);
  lines.push(
    table(["URL", "H1 count", "H1 text", "Indexability"], h1Rows) || "_No H1 data was collected._",
  );
  lines.push("");
  if (h1.summary) {
    lines.push(
      `Missing H1: ${h1.summary.missingH1}. Multiple H1: ${h1.summary.multipleH1}. Duplicate H1 groups: ${h1.summary.duplicateH1Groups}. Pages with a chrome-only H1: ${h1.summary.pagesWithChromeOnlyH1}.`,
      "",
    );
  }
  lines.push(findingList(h1.findings), "");

  lines.push(heading(3, "Outline"), "");
  const outlineRows = (headingAudit.observations || []).map((entry) => [
    entry.url,
    entry.headingCount,
    entry.h1Count,
    entry.jumps,
  ]);
  lines.push(
    table(["URL", "Headings", "H1 count", "Skipped levels"], outlineRows) ||
      "_No heading outlines were collected._",
  );
  lines.push("");
  lines.push(findingList(headingAudit.findings), "");

  return lines.join("\n");
}

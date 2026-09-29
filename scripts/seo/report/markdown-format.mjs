/**
 * Small formatting helpers for the Markdown report.
 *
 * `escapeTableCell` escapes the pipe character, because a literal `|`
 * inside a value breaks Markdown table syntax. It is not an HTML escaper
 * and must not become one: the runtime already handles HTML entities, and
 * hand-rolled entity escaping corrupts output.
 */

const MAX_CELL_LENGTH = 160;

export function heading(level, text) {
  return `${"#".repeat(level)} ${text}`;
}

export function truncate(value, length = MAX_CELL_LENGTH) {
  const text = String(value === null || value === undefined ? "" : value);
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1)}\u2026`;
}

export function escapeTableCell(value) {
  return truncate(String(value === null || value === undefined ? "" : value))
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

export function code(value) {
  const text = String(value === null || value === undefined ? "" : value);
  if (!text) return "";
  return `\`${text}\``;
}

export function link(url, label) {
  const text = String(url || "");
  const shown = label || text;
  if (!text) return "";
  return `[${escapeTableCell(shown)}](${text})`;
}

/** Render a Markdown table. Returns "" when there are no rows. */
export function table(headers, rows) {
  if (!rows || rows.length === 0) return "";
  const headerLine = `| ${headers.map((header) => escapeTableCell(header)).join(" | ")} |`;
  const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const bodyLines = rows.map(
    (row) => `| ${row.map((cell) => escapeTableCell(cell)).join(" | ")} |`,
  );
  return [headerLine, separatorLine, ...bodyLines].join("\n");
}

/**
 * Render a list of findings, most severe first, as Markdown bullets with
 * the evidence attached.
 */
export function findingList(findings, { limit = 200, showEvidence = true } = {}) {
  if (!findings || findings.length === 0) return "_None._";

  const shown = findings.slice(0, limit);
  const lines = [];

  for (const finding of shown) {
    const url = finding.url ? ` ${code(finding.url)}` : "";
    lines.push(`- **${finding.severity}** \`${finding.code}\`${url}`);
    lines.push(`  - ${truncate(finding.message, 400)}`);
    if (showEvidence && finding.evidence) {
      lines.push(`  - Evidence: ${code(truncate(stableStringify(finding.evidence), 400))}`);
    }
    if (finding.expected !== undefined || finding.actual !== undefined) {
      lines.push(
        `  - Expected: ${code(finding.expected)} / Actual: ${code(finding.actual)}`,
      );
    }
  }

  if (findings.length > shown.length) {
    lines.push(`- _${findings.length - shown.length} further finding(s) omitted; see the JSON report._`);
  }

  return lines.join("\n");
}

/** Deterministic single-line JSON, so the same evidence always renders the same way. */
export function stableStringify(value) {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(", ")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${key}: ${stableStringify(value[key])}`).join(", ")}}`;
}

export function bulletList(items) {
  if (!items || items.length === 0) return "_None._";
  return items.map((item) => `- ${truncate(item, 300)}`).join("\n");
}

export function countLine(label, value) {
  return `- ${label}: **${value}**`;
}

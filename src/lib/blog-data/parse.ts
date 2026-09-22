import type { BlogBlock, BlogHeading } from "./types";

const HEADING_PATTERN = /^(#{2,3})\s+(.*)$/;
const BULLET_PATTERN = /^[-*]\s+(.*)$/;
const NUMBERED_PATTERN = /^\d+[.)]\s+(.*)$/;
const TABLE_SEPARATOR_PATTERN = /^\|[\s:|-]+\|$/;

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableStart(lines: string[], index: number): boolean {
  const current = lines[index];
  const next = lines[index + 1];
  if (!current || !next) return false;
  return current.trimStart().startsWith("|") && TABLE_SEPARATOR_PATTERN.test(next.trim());
}

/**
 * Converts an article body written in the supported Markdown subset into a
 * flat list of render blocks. Unknown syntax degrades to a paragraph rather
 * than throwing, so an authoring typo can never break the page.
 */
export function parseBlogBlocks(content: string): BlogBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: BlogBlock[] = [];
  const paragraphBuffer: string[] = [];
  let index = 0;

  const flushParagraph = () => {
    const text = paragraphBuffer.join(" ").trim();
    paragraphBuffer.length = 0;
    if (text) blocks.push({ kind: "paragraph", text });
  };

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      index += 1;
      continue;
    }

    if (line === "---" || line === "***") {
      flushParagraph();
      blocks.push({ kind: "divider" });
      index += 1;
      continue;
    }

    const headingMatch = line.match(HEADING_PATTERN);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length === 3 ? 3 : 2;
      const text = headingMatch[2].trim();
      blocks.push({ kind: "heading", level, text, id: slugifyHeading(text) });
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      flushParagraph();
      const header = splitTableRow(lines[index].trim());
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[index].trim()));
        index += 1;
      }
      blocks.push({ kind: "table", header, rows });
      continue;
    }

    if (BULLET_PATTERN.test(line)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length) {
        const candidate = lines[index].trim();
        const bulletMatch = candidate.match(BULLET_PATTERN);
        if (!bulletMatch) break;
        items.push(bulletMatch[1].trim());
        index += 1;
      }
      blocks.push({ kind: "bulletList", items });
      continue;
    }

    if (NUMBERED_PATTERN.test(line)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length) {
        const candidate = lines[index].trim();
        const numberedMatch = candidate.match(NUMBERED_PATTERN);
        if (!numberedMatch) break;
        items.push(numberedMatch[1].trim());
        index += 1;
      }
      blocks.push({ kind: "numberedList", items });
      continue;
    }

    paragraphBuffer.push(line);
    index += 1;
  }

  flushParagraph();
  return blocks;
}

export function extractHeadings(blocks: BlogBlock[]): BlogHeading[] {
  return blocks.flatMap((block) =>
    block.kind === "heading"
      ? [{ id: block.id, text: block.text, level: block.level }]
      : [],
  );
}

export function countWords(content: string): number {
  return content.split(/\s+/).filter(Boolean).length;
}

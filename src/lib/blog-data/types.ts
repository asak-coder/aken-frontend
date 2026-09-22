/**
 * Types for the AKEN blog content system.
 *
 * Article bodies are authored as a small, deliberately limited subset of
 * Markdown so a content author can write them as plain text while they still
 * render as a properly structured, crawlable document.
 *
 * Supported syntax (see ./parse.ts):
 *   ## Heading 2 / ### Heading 3
 *   - bullet lists / 1. numbered lists
 *   | a | b | tables with a |---|---| separator row
 *   **bold** and [label](/internal-or-absolute-url)
 *   --- horizontal rule
 */

export interface BlogPost {
  /** URL segment under /blog. Short, keyword-focused, no year. */
  slug: string;
  /** On-page H1 and search title. */
  title: string;
  /** Meta description and listing summary. */
  description: string;
  /** Article body in the supported Markdown subset. */
  content: string;
  /** ISO date of first publication (YYYY-MM-DD). */
  date: string;
  /** ISO date of last substantive revision (YYYY-MM-DD). */
  updatedAt?: string;
  /** Primary and secondary keywords for metadata and JSON-LD. */
  keywords: string[];
}

export type BlogBlock =
  | { kind: "heading"; level: 2 | 3; text: string; id: string }
  | { kind: "paragraph"; text: string }
  | { kind: "bulletList"; items: string[] }
  | { kind: "numberedList"; items: string[] }
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "divider" };

export interface BlogHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

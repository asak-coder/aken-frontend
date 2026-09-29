/**
 * Writes the two report artefacts.
 *
 * Both files are written under aken-frontend/reports/seo/, which is outside
 * public/ and therefore cannot be served by Next.js as a static asset. That
 * location is the whole privacy guarantee: no route, no API handler and no
 * middleware can reach these files.
 *
 * Only these two files are ever created. The auditor writes nothing else to
 * disk.
 */

import fs from "node:fs";
import path from "node:path";

import { DEFAULTS } from "../lib/config.mjs";
import { REPORTS_DIR } from "../lib/paths.mjs";

export function writeReports({ jsonReport, markdown, directory = REPORTS_DIR, options = {} }) {
  const targetDirectory = directory;
  fs.mkdirSync(targetDirectory, { recursive: true });

  const jsonFileName = options.jsonFileName || DEFAULTS.jsonFileName;
  const markdownFileName = options.markdownFileName || DEFAULTS.markdownFileName;

  const jsonPath = path.join(targetDirectory, jsonFileName);
  const markdownPath = path.join(targetDirectory, markdownFileName);

  const jsonText = `${JSON.stringify(jsonReport, null, DEFAULTS.jsonIndent)}\n`;

  fs.writeFileSync(jsonPath, jsonText, "utf8");
  fs.writeFileSync(markdownPath, markdown, "utf8");

  return {
    directory: targetDirectory,
    jsonPath,
    markdownPath,
    jsonBytes: Buffer.byteLength(jsonText, "utf8"),
    markdownBytes: Buffer.byteLength(markdown, "utf8"),
  };
}

/** Guard used by the CLI: refuse to write anywhere inside public/. */
export function assertReportLocationIsPrivate(directory = REPORTS_DIR) {
  const resolved = path.resolve(directory);
  const segments = resolved.split(path.sep).map((segment) => segment.toLowerCase());

  const insidePublic = segments.some((segment) => segment === "public");
  if (insidePublic) {
    throw new Error(
      `Refusing to write the audit report to "${resolved}": the path contains a public/ segment, which would expose the report to visitors.`,
    );
  }

  return resolved;
}

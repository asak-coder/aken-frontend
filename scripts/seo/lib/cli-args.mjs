/**
 * Command-line argument parsing for `npm run seo:audit`.
 *
 * Deliberately hand-rolled and tiny: the auditor must not add a dependency
 * to the application's install just to read a few flags.
 *
 * Every recognised flag is listed in USAGE so `--help` cannot drift away
 * from what the parser actually accepts.
 */

import { DEFAULTS, RUN_LIMITS } from "./config.mjs";

export const USAGE = `AKEN SEO Autopilot - Phase 1 read-only technical auditor

Usage:
  npm run seo:audit -- [options]

Options:
  --base-url=<url>        Site to audit (default: ${DEFAULTS.baseUrl})
  --no-network            Configuration-only mode: writes an UNVERIFIED
                          report without contacting the network at all.
  --max-pages=<n>         Crawl page cap (default: ${RUN_LIMITS.maxPages})
  --max-sitemaps=<n>      Sitemap document cap (default: 5)
  --no-linked-pages       Only fetch source-derived and sitemap URLs.
  --json-out=<file>       JSON report file name inside reports/seo/
                          (default: ${DEFAULTS.jsonFileName})
  --md-out=<file>         Markdown report file name inside reports/seo/
                          (default: ${DEFAULTS.markdownFileName})
  --reports-dir=<path>    Override the report directory. Paths containing a
                          public/ segment are refused.
  --quiet                 Suppress progress output.
  --help                  Show this help.

Exit codes:
  0  audit completed with no ERROR findings
  1  audit completed and produced ERROR findings
  2  the auditor itself failed

Notes:
  - Phase 1 is read-only. The auditor never modifies the website, never
    generates content and never deploys anything.
  - Only two files are written, both under reports/seo/.
  - No credentials are used or required.
`;

export function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULTS.baseUrl,
    noNetwork: DEFAULTS.noNetwork,
    maxPages: RUN_LIMITS.maxPages,
    maxSitemaps: 5,
    includeLinkedPages: true,
    jsonFileName: DEFAULTS.jsonFileName,
    markdownFileName: DEFAULTS.markdownFileName,
    reportsDir: null,
    quiet: false,
    help: false,
    errors: [],
  };

  for (const raw of argv) {
    const argument = String(raw);

    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    if (argument === "--no-network") {
      options.noNetwork = true;
      continue;
    }
    if (argument === "--no-linked-pages") {
      options.includeLinkedPages = false;
      continue;
    }
    if (argument === "--quiet") {
      options.quiet = true;
      continue;
    }

    const equals = argument.indexOf("=");
    if (!argument.startsWith("--") || equals === -1) {
      options.errors.push(`Unrecognised argument: ${argument}`);
      continue;
    }

    const key = argument.slice(2, equals);
    const value = argument.slice(equals + 1);

    if (key === "base-url") {
      options.baseUrl = value;
      continue;
    }
    if (key === "max-pages") {
      const number = Number.parseInt(value, 10);
      if (!Number.isFinite(number) || number < 1) {
        options.errors.push(`--max-pages requires a positive integer, got "${value}"`);
      } else {
        options.maxPages = Math.min(number, 1000);
      }
      continue;
    }
    if (key === "max-sitemaps") {
      const number = Number.parseInt(value, 10);
      if (!Number.isFinite(number) || number < 1) {
        options.errors.push(`--max-sitemaps requires a positive integer, got "${value}"`);
      } else {
        options.maxSitemaps = Math.min(number, 20);
      }
      continue;
    }
    if (key === "json-out") {
      options.jsonFileName = value;
      continue;
    }
    if (key === "md-out") {
      options.markdownFileName = value;
      continue;
    }
    if (key === "reports-dir") {
      options.reportsDir = value;
      continue;
    }

    options.errors.push(`Unrecognised option: --${key}`);
  }

  return options;
}

/**
 * Validate the base URL. Only http and https are accepted; the SSRF guard
 * performs the deeper host and address checks.
 */
export function resolveBaseUrl(options) {
  let url;
  try {
    url = new URL(options.baseUrl);
  } catch {
    throw new Error(`--base-url is not a valid URL: "${options.baseUrl}"`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`--base-url must use http or https, got "${url.protocol}"`);
  }

  return url;
}

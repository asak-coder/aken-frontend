/**
 * AUDIT 7 - robots.txt.
 *
 * Checks the HTTP response, the syntax, the sitemap reference and whether
 * any public route is accidentally blocked.
 *
 * One deliberate design decision, stated here so it is not mistaken for a
 * bug: the auditor fetches pages even when robots.txt disallows them. It
 * has to, in order to report that they are disallowed - a crawler that
 * silently obeyed the rule could never tell the owner that an important
 * page is unreachable. The auditor issues a single request per page, at
 * low concurrency, and never re-requests. robots.txt is reported, not
 * obeyed silently.
 *
 * Severity mapping:
 *   ERROR      - a public indexable route is disallowed by robots.txt
 *   WARNING    - syntax problems, a missing sitemap reference, or a
 *                served robots.txt that contradicts the source file
 *   INFO       - robots.txt absent (legal, means "allow all"), or the
 *                admin/API paths are not excluded
 *   UNVERIFIED - robots.txt could not be retrieved
 */

import fs from "node:fs";
import path from "node:path";

import { INDEXABILITY } from "../lib/indexability.mjs";
import { SEVERITY } from "../lib/severity.mjs";
import { createFinding } from "../lib/finding.mjs";
import { buildAuditResult, analysedPages } from "./shared.mjs";
import { disallowedPaths, evaluateGroup, selectGroup } from "../lib/robots-parse.mjs";
import { APP_DIR, EXCLUDED_ROUTE_PREFIXES } from "../lib/paths.mjs";

const AUDIT = "robots";
const AUDIT_USER_AGENT = "AKENSEOAudit";

/**
 * Only these prefixes are worth suggesting for a robots.txt exclusion.
 *
 * The obvious implementation - iterate every EXCLUDED_ROUTE_PREFIXES entry -
 * produced actively harmful advice on the first live run:
 *
 *   - `/_next` is the framework's own asset tree. Disallowing it does not
 *     hide anything (the files are not indexable pages) and it stops
 *     crawlers from rendering the site at all, which costs you far more
 *     than it saves.
 *   - `/reports` is not a served path on the deployed site; it is the
 *     auditor's local output directory. Telling an owner to disallow a
 *     route that does not exist is noise, and it implies the path is
 *     public when the whole design avoids that.
 *
 * Neither is checked. The remaining prefixes are genuine server-side areas.
 */
const ROBOTS_EXCLUSION_CANDIDATES = Object.freeze(["/admin", "/api"]);

export function runRobotsAudit({ crawl }) {
  const findings = [];
  const observations = [];
  const robots = crawl.robots;
  const pages = analysedPages(crawl);

  if (!robots) {
    return buildAuditResult({
      id: AUDIT,
      name: "robots.txt",
      description: "Validation of /robots.txt.",
      findings: [
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.UNVERIFIED,
          code: "robots-not-retrieved",
          url: null,
          message: "robots.txt was not retrieved, so no statement about it can be made.",
        }),
      ],
      summary: { retrieved: false },
    });
  }

  if (robots.blocked) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.UNVERIFIED,
        code: "robots-fetch-blocked",
        url: robots.url,
        message: `The request for robots.txt was refused by the auditor's own safety guard: ${robots.blocked.reason}`,
      }),
    );
  } else if (robots.error) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: SEVERITY.UNVERIFIED,
        code: "robots-fetch-failed",
        url: robots.url,
        message: `robots.txt could not be retrieved (${robots.error.code}: ${robots.error.message}), so it was not validated.`,
      }),
    );
  } else if (!robots.ok) {
    findings.push(
      createFinding({
        audit: AUDIT,
        severity: robots.status === 404 ? SEVERITY.INFO : SEVERITY.WARNING,
        code: robots.status === 404 ? "robots-absent" : "robots-unexpected-status",
        url: robots.url,
        message:
          robots.status === 404
            ? "No robots.txt is served. That is legal and means everything is crawlable, but it also means no sitemap is declared and no private area is excluded."
            : `robots.txt returned HTTP ${robots.status}. Crawlers treat a non-200 response as "no restrictions".`,
        evidence: { status: robots.status },
      }),
    );
  } else {
    const parsed = robots.parsed;

    if (!parsed) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: "robots-unparsed",
          url: robots.url,
          message: "robots.txt was served but could not be parsed.",
        }),
      );
    } else {
      for (const line of parsed.invalidLines) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.WARNING,
            code: "robots-invalid-line",
            url: robots.url,
            message: `Line ${line.lineNumber} ("${line.text}") is not a valid robots.txt directive: ${line.reason}.`,
          }),
        );
      }

      for (const entry of parsed.unknownDirectives) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.INFO,
            code: "robots-unknown-directive",
            url: robots.url,
            message: `Line ${entry.lineNumber} uses the directive "${entry.directive}", which is not a standard robots.txt directive and will be ignored by most crawlers.`,
          }),
        );
      }

      if (parsed.sitemaps.length === 0) {
        const sitemapReachable = crawl.sitemap.primary && crawl.sitemap.primary.ok;
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: sitemapReachable ? SEVERITY.INFO : SEVERITY.WARNING,
            code: "robots-no-sitemap-directive",
            url: robots.url,
            message: sitemapReachable
              ? "robots.txt does not declare a Sitemap directive. The sitemap is still discoverable at the conventional /sitemap.xml location."
              : "robots.txt does not declare a Sitemap directive and no usable sitemap was found at the conventional location.",
            evidence: { declaredSitemaps: parsed.sitemaps },
          }),
        );
      } else {
        for (const declared of parsed.sitemaps) {
          let reachable = false;
          try {
            const target = new URL(declared, crawl.origin).toString();
            reachable = crawl.sitemap.documents.some((document) => document.url === target && document.ok);
          } catch {
            reachable = false;
          }

          if (!reachable) {
            findings.push(
              createFinding({
                audit: AUDIT,
                severity: SEVERITY.WARNING,
                code: "robots-sitemap-unreachable",
                url: robots.url,
                message: `robots.txt declares the sitemap "${declared}", but fetching it did not succeed. A declared sitemap that cannot be read is worse than none.`,
                actual: declared,
              }),
            );
          }
        }
      }

      const group = selectGroup(parsed, AUDIT_USER_AGENT);
      observations.push({
        code: "robots-rule-group",
        url: robots.url,
        agents: group ? group.agents : [],
        allow: group ? group.allow : [],
        disallow: group ? group.disallow : [],
        crawlDelay: group ? group.crawlDelay : null,
      });

      const blockedPublicPages = pages.filter(
        (page) => page.indexability && page.indexability.state === INDEXABILITY.BLOCKED,
      );

      for (const page of blockedPublicPages) {
        findings.push(
          createFinding({
            audit: AUDIT,
            severity: SEVERITY.ERROR,
            code: "robots-blocks-public-route",
            url: page.url,
            message: `robots.txt disallows ${page.indexability.robotsRule}. This page is a public route, so crawlers are being told not to read it.`,
            evidence: { path: page.path, kind: page.kind },
          }),
        );
      }

      for (const prefix of ROBOTS_EXCLUSION_CANDIDATES) {
        const verdict = evaluateGroup(selectGroup(parsed, AUDIT_USER_AGENT), prefix);
        if (verdict.allowed) {
          findings.push(
            createFinding({
              audit: AUDIT,
              severity: SEVERITY.INFO,
              code: "robots-does-not-exclude-private-path",
              url: robots.url,
              message: `robots.txt does not disallow "${prefix}". This is advisory only: robots.txt is not an access control, so it changes nothing about who can reach these paths - it only keeps them out of crawl queues.`,
              evidence: { prefix, verdict },
            }),
          );
        }
      }

      const disallowed = disallowedPaths(parsed, AUDIT_USER_AGENT);
      observations.push({
        code: "robots-disallow-list",
        url: robots.url,
        patterns: disallowed,
        patternsMatchingExcludedPrefixes: disallowed.filter((pattern) =>
          EXCLUDED_ROUTE_PREFIXES.some((prefix) => pattern.startsWith(prefix)),
        ),
      });
    }
  }

  const sourceDeclared = readSourceRobots();
  if (sourceDeclared && robots.ok) {
    const mismatch = compareSourceToLive(sourceDeclared, robots);
    for (const entry of mismatch) {
      findings.push(
        createFinding({
          audit: AUDIT,
          severity: SEVERITY.WARNING,
          code: entry.code,
          url: robots.url,
          message: entry.message,
          evidence: entry.evidence,
        }),
      );
    }
  }

  return buildAuditResult({
    id: AUDIT,
    name: "robots.txt",
    description: "HTTP status, syntax, sitemap directive and accidental blocking of public routes.",
    findings,
    summary: {
      retrieved: Boolean(robots.reached),
      status: robots.status,
      bytes: robots.bytes,
      declaredSitemaps: robots.sitemapsDeclared,
      disallowedPatterns: robots.parsed ? disallowedPaths(robots.parsed, AUDIT_USER_AGENT) : [],
      publicRoutesBlocked: pages.filter(
        (page) => page.indexability && page.indexability.state === INDEXABILITY.BLOCKED,
      ).length,
      sourceFilePresent: Boolean(sourceDeclared),
    },
    observations,
  });
}

function readSourceRobots() {
  const candidates = ["robots.ts", "robots.js", "robots.mjs"];
  for (const name of candidates) {
    const file = path.join(APP_DIR, name);
    try {
      const source = fs.readFileSync(file, "utf8");
      return {
        file: `src/app/${name}`,
        disallow: [...source.matchAll(/disallow:\s*["'`]([^"'`]*)["'`]/gi)].map((match) => match[1]),
        allow: [...source.matchAll(/\ballow:\s*["'`]([^"'`]*)["'`]/gi)].map((match) => match[1]),
        sitemap: [...source.matchAll(/sitemap:\s*["'`]([^"'`]*)["'`]/gi)].map((match) => match[1]),
      };
    } catch {
      continue;
    }
  }
  return null;
}

function compareSourceToLive(sourceDeclared, robots) {
  const entries = [];
  const liveDisallow = robots.parsed ? disallowedPaths(robots.parsed, AUDIT_USER_AGENT) : [];
  const declaredDisallow = sourceDeclared.disallow.filter(Boolean);

  for (const declared of declaredDisallow) {
    const present = liveDisallow.some((pattern) => pattern === declared || pattern.startsWith(declared));
    if (!present) {
      entries.push({
        code: "robots-source-rule-not-served",
        message: `${sourceDeclared.file} declares "Disallow: ${declared}", but the served robots.txt does not contain that rule. The deployed file may be stale.`,
        evidence: { declared, liveDisallow },
      });
    }
  }

  for (const live of liveDisallow) {
    if (live === "") continue;
    if (!declaredDisallow.some((declared) => live === declared || live.startsWith(declared))) {
      entries.push({
        code: "robots-served-rule-not-in-source",
        message: `The served robots.txt contains "Disallow: ${live}", which is not present in ${sourceDeclared.file}. Confirm which of the two is intended.`,
        evidence: { live, declaredDisallow },
      });
    }
  }

  return entries;
}

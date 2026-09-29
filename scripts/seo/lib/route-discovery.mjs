/**
 * Route discovery from the project source.
 *
 * The auditor must not assume a route count. Everything here is read from
 * the repository:
 *
 *   - static routes        <- the `page.*` files under src/app
 *   - dynamic routes       <- expanded from the data files that feed them
 *                             (blog posts, published project records)
 *   - declared sitemap set <- src/app/sitemap.ts
 *
 * This source-derivable set is the "expected" side of the sitemap audit:
 * a route that exists in source but not in the live sitemap is a real
 * finding, and so is the reverse.
 *
 * Read-only. No file is created, modified or deleted.
 */

import fs from "node:fs";
import path from "node:path";

import { APP_DIR, FRONTEND_ROOT, LIB_DIR, EXCLUDED_ROUTE_PREFIXES } from "./paths.mjs";
import { classifyRouteKind, isExcludedPath, normalizePathname } from "./url-utils.mjs";

const PAGE_FILE_PATTERN = /^page\.(tsx|ts|jsx|js)$/;
const ROUTE_GROUP_PATTERN = /^\(.+\)$/;
const DYNAMIC_SEGMENT_PATTERN = /^\[\[?\.{0,3}([^\]]+)\]\]?$/;

export function discoverSourceRoutes() {
  const warnings = [];

  const appRoutes = walkPageFiles(APP_DIR);
  const blogSlugs = readBlogSlugs(warnings);
  const serviceSlugs = readServiceSlugs(warnings);
  const projectSlugs = readProjectSlugs(warnings);
  const sitemapDeclaredPaths = readSitemapStaticPaths(warnings);

  const dynamicSources = {
    blog: blogSlugs,
    projects: projectSlugs,
    services: serviceSlugs,
  };

  const candidates = new Map();
  const excluded = [];

  for (const route of appRoutes) {
    if (route.dynamicParam === null) {
      addCandidate(candidates, excluded, {
        routePath: route.routePath,
        source: "app-filesystem",
        origin: `src/app/${route.relativeFile}`,
      });
      continue;
    }

    const prefix = route.routePath.replace(/\/\[+\.{0,3}[^\]]+\]+$/, "");
    const values = expandDynamicPrefix(prefix, dynamicSources);
    if (values === null) {
      warnings.push({
        code: "UNEXPANDED_DYNAMIC_ROUTE",
        message: `Could not expand dynamic route ${route.routePath} (param "${route.dynamicParam}"); it is reported but not crawled.`,
        file: `src/app/${route.relativeFile}`,
      });
      addCandidate(candidates, excluded, {
        routePath: route.routePath,
        source: "app-filesystem",
        origin: `src/app/${route.relativeFile}`,
        unresolvedDynamic: true,
      });
      continue;
    }

    if (values.length === 0) {
      warnings.push({
        code: "EMPTY_DYNAMIC_ROUTE",
        message: `Dynamic route ${route.routePath} has no source records, so it produces zero public URLs.`,
        file: `src/app/${route.relativeFile}`,
      });
      continue;
    }

    for (const value of values) {
      addCandidate(candidates, excluded, {
        routePath: `${prefix}/${value}`,
        source: "app-filesystem+data",
        origin: `src/app/${route.relativeFile} <- ${value}`,
      });
    }
  }

  for (const declaredPath of sitemapDeclaredPaths) {
    addCandidate(candidates, excluded, {
      routePath: declaredPath,
      source: "sitemap-source",
      origin: "src/app/sitemap.ts",
    });
  }

  const candidateList = [...candidates.values()].sort((left, right) =>
    left.path.localeCompare(right.path),
  );

  return {
    candidates: candidateList,
    excluded,
    blogSlugs,
    serviceSlugs,
    projectSlugs,
    sitemapDeclaredPaths,
    warnings,
    counts: {
      pageFiles: appRoutes.length,
      candidateRoutes: candidateList.length,
      excludedRoutes: excluded.length,
      blogPosts: blogSlugs.length,
      servicePages: serviceSlugs.length,
      publishedProjects: projectSlugs.length,
    },
  };
}

function expandDynamicPrefix(prefix, dynamicSources) {
  if (prefix === "/blog") return dynamicSources.blog;
  if (prefix === "/projects") return dynamicSources.projects;
  if (prefix === "/services") return dynamicSources.services;
  return null;
}

function addCandidate(candidates, excluded, entry) {
  const routePath = normalizePathname(entry.routePath || "/");

  if (isExcludedPath(routePath, EXCLUDED_ROUTE_PREFIXES)) {
    excluded.push({
      path: routePath,
      reason: "admin, API, internal or report route",
      origin: entry.origin,
    });
    return;
  }

  if (hasDynamicSegment(routePath)) {
    excluded.push({
      path: routePath,
      reason: "unexpanded dynamic route template",
      origin: entry.origin,
    });
    return;
  }

  if (!candidates.has(routePath)) {
    candidates.set(routePath, {
      path: routePath,
      kind: classifyRouteKind(routePath),
      source: entry.source,
      origin: entry.origin,
      unresolvedDynamic: Boolean(entry.unresolvedDynamic),
    });
  }
}

function hasDynamicSegment(routePath) {
  return routePath.split("/").some((segment) => segment.startsWith("["));
}

/** Every page file under src/app, with its route path and dynamic param (if any). */
function walkPageFiles(directory, segments = []) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const found = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
      const nextSegments = ROUTE_GROUP_PATTERN.test(entry.name)
        ? segments
        : [...segments, entry.name];
      found.push(...walkPageFiles(absolute, nextSegments));
      continue;
    }

    if (!PAGE_FILE_PATTERN.test(entry.name)) continue;

    const lastSegment = segments.length > 0 ? segments[segments.length - 1] : null;
    const dynamicMatch = lastSegment ? lastSegment.match(DYNAMIC_SEGMENT_PATTERN) : null;
    const routePath = segments.length === 0 ? "/" : `/${segments.join("/")}`;

    found.push({
      routePath,
      dynamicParam: dynamicMatch ? dynamicMatch[1] : null,
      relativeFile: path.relative(APP_DIR, absolute).split(path.sep).join("/"),
    });
  }

  return found.sort((left, right) => left.routePath.localeCompare(right.routePath));
}

function readBlogSlugs(warnings) {
  const directory = path.join(LIB_DIR, "blog-data", "posts");
  const slugs = new Set();

  let files;
  try {
    files = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    warnings.push({
      code: "BLOG_DIRECTORY_MISSING",
      message: "src/lib/blog-data/posts could not be read; blog routes may be under-reported.",
    });
    return [];
  }

  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith(".ts")) continue;
    const source = safeRead(path.join(directory, file.name));
    if (source === null) continue;
    const match = source.match(/^[ \t]*slug:\s*["'`]([^"'`]+)["'`]/m);
    if (match) slugs.add(match[1].trim());
  }

  return [...slugs].sort();
}

function readServiceSlugs(warnings) {
  const source = safeRead(path.join(LIB_DIR, "services", "service-types.ts"));
  if (source === null) {
    warnings.push({
      code: "SERVICE_TYPES_MISSING",
      message: "src/lib/services/service-types.ts could not be read; service routes may be under-reported.",
    });
    return [];
  }

  const arrayBody = extractArrayLiteral(source, "SERVICE_SLUGS");
  if (arrayBody === null) return [];

  const slugs = [...arrayBody.matchAll(/["'`]([a-z0-9][a-z0-9-]*)["'`]/g)].map((match) => match[1]);
  return [...new Set(slugs)].sort();
}

function readProjectSlugs(warnings) {
  const source = safeRead(path.join(LIB_DIR, "projects", "projects-data.ts"));
  if (source === null) {
    warnings.push({
      code: "PROJECTS_DATA_MISSING",
      message: "src/lib/projects/projects-data.ts could not be read; project routes may be under-reported.",
    });
    return [];
  }

  const arrayBody = extractArrayLiteral(source, "projectRecords");
  if (arrayBody === null || !arrayBody.includes("{")) {
    return [];
  }

  const slugs = new Set();
  for (const record of splitTopLevelObjects(arrayBody)) {
    if (!/approvedForPublication\s*:\s*true/.test(record)) continue;
    const match = record.match(/slug:\s*["'`]([^"'`]+)["'`]/);
    if (match) slugs.add(match[1].trim());
  }

  return [...slugs].sort();
}

function readSitemapStaticPaths(warnings) {
  const source = safeRead(path.join(APP_DIR, "sitemap.ts"));
  if (source === null) {
    warnings.push({
      code: "SITEMAP_SOURCE_MISSING",
      message: "src/app/sitemap.ts could not be read; the declared sitemap set is unknown.",
    });
    return [];
  }

  const body = extractArrayLiteral(source, "STATIC_ROUTES");
  if (body === null) return [];

  return [...body.matchAll(/path:\s*["'`]([^"'`]*)["'`]/g)]
    .map((match) => normalizePathname(match[1] || "/"))
    .filter((value, index, all) => all.indexOf(value) === index);
}

/**
 * Text between the array literal's opening `[` and its matching `]`.
 *
 * The identifier is frequently followed by a type annotation
 * (`const SERVICE_SLUGS: ServiceSlug[] = [...]`), so searching for the first
 * `[` after the name finds the annotation's `[]` and silently returns an
 * empty array. The initialiser is located first, and the search starts after
 * it.
 */
export function extractArrayLiteral(source, identifier) {
  const start = source.indexOf(identifier);
  if (start === -1) return null;

  const assignment = findAssignment(source, start + identifier.length);
  const searchFrom = assignment === -1 ? start : assignment + 1;
  const open = source.indexOf("[", searchFrom);
  if (open === -1) return null;

  let depth = 0;
  let quote = null;

  for (let index = open; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (char === "\\") {
        index += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }

  return null;
}

/** Index of the `=` introducing a value, ignoring `=>`, `==`, `<=` and `>=`. */
export function findAssignment(source, from) {
  for (let index = from; index < source.length; index += 1) {
    const char = source[index];
    if (char === ";") return -1;
    if (char !== "=") continue;

    const next = source[index + 1];
    const previous = source[index - 1];
    if (next === "=" || next === ">") continue;
    if (previous === "=" || previous === "!" || previous === "<" || previous === ">") continue;
    return index;
  }
  return -1;
}

/** Split an array literal body into its top-level `{...}` object literals. */
export function splitTopLevelObjects(body) {
  const objects = [];
  let depth = 0;
  let start = -1;
  let quote = null;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];

    if (quote) {
      if (char === "\\") {
        index += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        objects.push(body.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return objects;
}

function safeRead(absolutePath) {
  try {
    return fs.readFileSync(absolutePath, "utf8");
  } catch {
    return null;
  }
}

export function describeDiscovery(discovery) {
  return {
    pageFiles: discovery.counts.pageFiles,
    candidateRoutes: discovery.counts.candidateRoutes,
    excludedRoutes: discovery.counts.excludedRoutes,
    blogPosts: discovery.counts.blogPosts,
    servicePages: discovery.counts.servicePages,
    publishedProjects: discovery.counts.publishedProjects,
    root: path.relative(FRONTEND_ROOT, APP_DIR).split(path.sep).join("/"),
  };
}

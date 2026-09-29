/**
 * robots.txt parsing and evaluation.
 *
 * Implements the directives that actually affect crawling:
 * User-agent, Allow, Disallow, Sitemap, Host, Crawl-delay.
 *
 * Path matching follows the widely implemented longest-match rule:
 * the most specific (longest) matching Allow or Disallow wins, and Allow
 * wins a tie. `*` matches any sequence and a trailing `$` anchors the
 * end of the path. Unrecognised directives are recorded rather than
 * treated as errors, because today's unknown directive is tomorrow's
 * standard.
 */

const KNOWN_DIRECTIVES = new Set([
  "user-agent",
  "allow",
  "disallow",
  "sitemap",
  "host",
  "crawl-delay",
  "clean-param",
  "request-rate",
  "visit-time",
]);

export function parseRobotsTxt(text) {
  const result = {
    groups: [],
    sitemaps: [],
    hosts: [],
    crawlDelays: [],
    unknownDirectives: [],
    invalidLines: [],
    lineCount: 0,
  };

  const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
  result.lineCount = lines.length;

  let current = null;
  let lastDirective = null;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const withoutComment = rawLine.split("#")[0];
    const line = withoutComment.trim();
    if (!line) return;

    const colon = line.indexOf(":");
    if (colon === -1) {
      result.invalidLines.push({ lineNumber, text: rawLine.trim(), reason: "missing ':'" });
      return;
    }

    const directive = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (!KNOWN_DIRECTIVES.has(directive)) {
      result.unknownDirectives.push({ lineNumber, directive, value });
      lastDirective = directive;
      return;
    }

    if (directive === "sitemap") {
      if (value) result.sitemaps.push(value);
      lastDirective = directive;
      return;
    }

    if (directive === "host") {
      if (value) result.hosts.push(value);
      lastDirective = directive;
      return;
    }

    if (directive === "user-agent") {
      /**
       * A user-agent line only continues the current group when the previous
       * line was also a user-agent line. Any other directive ends the group's
       * agent list - including Sitemap, Host and unknown directives, which do
       * not themselves belong to a group. Checking only for allow/disallow/
       * crawl-delay merged two groups whenever a Sitemap line sat between
       * them, so one group's records leaked into the other.
       */
      const startsNewGroup = current === null || lastDirective !== "user-agent";

      if (startsNewGroup) {
        current = { agents: [], allow: [], disallow: [], crawlDelay: null, lineNumber };
        result.groups.push(current);
      }

      current.agents.push(value.toLowerCase());
      lastDirective = directive;
      return;
    }

    if (!current) {
      current = { agents: ["*"], allow: [], disallow: [], crawlDelay: null, lineNumber };
      result.groups.push(current);
    }

    if (directive === "crawl-delay") {
      const seconds = Number.parseFloat(value);
      if (Number.isFinite(seconds)) {
        current.crawlDelay = seconds;
        result.crawlDelays.push(seconds);
      } else {
        result.invalidLines.push({
          lineNumber,
          text: rawLine.trim(),
          reason: "non-numeric crawl-delay",
        });
      }
      lastDirective = directive;
      return;
    }

    if (directive === "allow") {
      current.allow.push(value);
    } else {
      current.disallow.push(value);
    }
    lastDirective = directive;
  });

  return result;
}

/** Pick the group that applies to a user-agent, most specific first. */
export function selectGroup(parsed, userAgent) {
  const agent = String(userAgent || "*").toLowerCase();
  const generic = parsed.groups.filter((group) => group.agents.includes("*"));
  const specific = parsed.groups.filter((group) =>
    group.agents.some((value) => value !== "*" && agent.includes(value)),
  );

  if (specific.length > 0) return specific[specific.length - 1];
  if (generic.length > 0) return generic[generic.length - 1];
  return null;
}

/** Convert a robots path pattern into a RegExp. */
export function patternToRegExp(pattern) {
  const raw = String(pattern || "");
  if (raw === "") return null;
  const anchored = raw.endsWith("$");
  const body = anchored ? raw.slice(0, -1) : raw;
  const escaped = body.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}${anchored ? "$" : ""}`);
}

/**
 * Evaluate a single group against a path.
 * @returns {{allowed: boolean, rule: string|null, specificity: number}}
 */
export function evaluateGroup(group, pathname) {
  if (!group) return { allowed: true, rule: null, specificity: 0 };

  const path = String(pathname || "/");
  let best = { allowed: true, rule: null, specificity: -1 };

  for (const rule of group.disallow) {
    const regex = patternToRegExp(rule);
    if (!regex || !regex.test(path)) continue;
    if (rule.length > best.specificity) {
      best = { allowed: false, rule: `Disallow: ${rule}`, specificity: rule.length };
    }
  }

  for (const rule of group.allow) {
    const regex = patternToRegExp(rule);
    if (!regex || !regex.test(path)) continue;
    if (rule.length >= best.specificity) {
      best = { allowed: true, rule: `Allow: ${rule}`, specificity: rule.length };
    }
  }

  return best;
}

export function isPathAllowed(parsed, pathname, userAgent = "*") {
  const group = selectGroup(parsed, userAgent);
  return evaluateGroup(group, pathname);
}

/** Convenience for the report: which paths are explicitly disallowed. */
export function disallowedPaths(parsed, userAgent = "*") {
  const group = selectGroup(parsed, userAgent);
  return group ? [...group.disallow] : [];
}

export function allowedPaths(parsed, userAgent = "*") {
  const group = selectGroup(parsed, userAgent);
  return group ? [...group.allow] : [];
}

/**
 * Fetches and parses /robots.txt.
 *
 * A missing or non-200 robots.txt is a valid, common state (it means
 * "everything is crawlable"), so it is recorded as a status rather than
 * treated as a failure. Only a transport error or an SSRF refusal leaves
 * the parse result null.
 */

import { parseRobotsTxt } from "./robots-parse.mjs";

const MAX_ROBOTS_BYTES = 512 * 1024;

export async function fetchRobotsTxt(client, origin, { networkEnabled = true } = {}) {
  const url = new URL("/robots.txt", origin);
  const result = {
    url: url.toString(),
    status: 0,
    ok: false,
    reached: false,
    error: null,
    blocked: null,
    contentType: "",
    bytes: 0,
    raw: "",
    parsed: null,
    sitemapsDeclared: [],
  };

  if (!networkEnabled) {
    result.error = { code: "NETWORK_DISABLED", message: "network access is disabled for this run" };
    return result;
  }

  const response = await client.get(url, { maxBytes: MAX_ROBOTS_BYTES });
  result.status = response.status;
  result.ok = response.ok;
  result.contentType = response.contentType || "";
  result.bytes = response.bytesRead || 0;
  result.blocked = response.blocked || null;
  result.error = response.error || null;
  result.reached = Boolean(response.status);

  if (response.ok && typeof response.body === "string") {
    result.raw = response.body;
    result.parsed = parseRobotsTxt(response.body);
    result.sitemapsDeclared = [...result.parsed.sitemaps];
  }

  return result;
}

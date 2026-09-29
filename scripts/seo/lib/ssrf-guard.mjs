/**
 * SSRF protection for every outbound request the auditor makes.
 *
 * The auditor fetches two kinds of URL:
 *   1. the audited site itself
 *   2. external links discovered in that site's public HTML
 *
 * Both are attacker-influencable in principle (anyone who can edit a page
 * can add a link), so neither is trusted. Every URL is checked twice:
 * first by hostname, then by the actual IP addresses the hostname
 * resolves to. The second check is what stops a public DNS name that
 * points at 127.0.0.1 or at a cloud metadata endpoint.
 *
 * Known limitation, stated honestly: Node's global fetch does not expose
 * the connected socket, so the resolver result cannot be pinned to the
 * connection. A determined DNS-rebinding attacker who changes the answer
 * between this check and the fetch is not fully mitigated. The auditor
 * compensates by capping redirects, refusing non-HTTP schemes, refusing
 * non-2xx-adjacent content types, and never sending credentials.
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class UnsafeTargetError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = "UnsafeTargetError";
    this.code = code;
    this.details = details;
  }
}

/** Hostnames that must never be resolved, regardless of DNS. */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  "metadata",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
  "instance-data.ec2.internal",
  "kubernetes.default",
  "kubernetes.default.svc",
  "kubernetes.default.svc.cluster.local",
  "host.docker.internal",
  "gateway.docker.internal",
  "kubernetes.docker.internal",
]);

/** Suffixes that only ever exist on private networks. */
const BLOCKED_HOSTNAME_SUFFIXES = [
  ".localhost",
  ".local",
  ".localdomain",
  ".internal",
  ".intranet",
  ".private",
  ".home.arpa",
  ".in-addr.arpa",
  ".ip6.arpa",
  ".cluster.local",
  ".svc",
];

/** IPv4 CIDR blocks that must never be contacted. */
const BLOCKED_IPV4_RANGES = [
  { cidr: "0.0.0.0/8", reason: "this-network (RFC 1122)" },
  { cidr: "10.0.0.0/8", reason: "RFC 1918 private range" },
  { cidr: "100.64.0.0/10", reason: "carrier-grade NAT (RFC 6598)" },
  { cidr: "127.0.0.0/8", reason: "loopback" },
  { cidr: "169.254.0.0/16", reason: "link-local / cloud metadata" },
  { cidr: "172.16.0.0/12", reason: "RFC 1918 private range" },
  { cidr: "192.0.0.0/24", reason: "IETF protocol assignments" },
  { cidr: "192.0.2.0/24", reason: "documentation (TEST-NET-1)" },
  { cidr: "192.88.99.0/24", reason: "6to4 relay anycast" },
  { cidr: "192.168.0.0/16", reason: "RFC 1918 private range" },
  { cidr: "198.18.0.0/15", reason: "benchmarking (RFC 2544)" },
  { cidr: "198.51.100.0/24", reason: "documentation (TEST-NET-2)" },
  { cidr: "203.0.113.0/24", reason: "documentation (TEST-NET-3)" },
  { cidr: "224.0.0.0/4", reason: "multicast" },
  { cidr: "240.0.0.0/4", reason: "reserved" },
];

/** IPv6 prefixes expressed as leading bytes plus the number of significant bits. */
const BLOCKED_IPV6_PREFIXES = [
  { prefix: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], bits: 128, reason: "loopback (::1)" },
  { prefix: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bits: 128, reason: "unspecified (::)" },
  { prefix: [0xfc], bits: 7, reason: "unique local address (RFC 4193)" },
  { prefix: [0xfe, 0x80], bits: 10, reason: "link-local" },
  { prefix: [0xfe, 0xc0], bits: 10, reason: "deprecated site-local" },
  { prefix: [0xff], bits: 8, reason: "multicast" },
  { prefix: [0x20, 0x01, 0x0d, 0xb8], bits: 32, reason: "documentation (RFC 3849)" },
  { prefix: [0x20, 0x01, 0x00, 0x00], bits: 32, reason: "Teredo tunnelling" },
  { prefix: [0x20, 0x02], bits: 16, reason: "6to4 tunnelling" },
  { prefix: [0x01, 0x00, 0x00, 0x00], bits: 64, reason: "discard prefix (RFC 6666)" },
];

const IPV4_MAPPED_PREFIX_BITS = 96;
const NAT64_PREFIX_BITS = 96;
const NAT64_PREFIX = [0x00, 0x64, 0xff, 0x9b, 0, 0, 0, 0, 0, 0, 0, 0];

function ipv4ToInt(ip) {
  const parts = ip.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }
  return ((parts[0] * 0x1000000) + (parts[1] * 0x10000) + (parts[2] * 0x100) + parts[3]) >>> 0;
}

function cidrToRange(cidr) {
  const [network, bitsText] = cidr.split("/");
  const bits = Number.parseInt(bitsText, 10);
  const base = ipv4ToInt(network);
  if (base === null || !Number.isInteger(bits)) return null;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  const start = (base & mask) >>> 0;
  const end = (start | (~mask >>> 0)) >>> 0;
  return { start, end };
}

const IPV4_RANGES = BLOCKED_IPV4_RANGES.map((entry) => ({
  ...entry,
  range: cidrToRange(entry.cidr),
})).filter((entry) => entry.range !== null);

const IPV4_RANGES_BY_LENGTH = [...IPV4_RANGES].sort(
  (left, right) => (right.range.end - right.range.start) - (left.range.end - left.range.start),
);

/** @returns {string|null} the blocking reason, or null when the IPv4 is public */
export function blockedIpv4Reason(ip) {
  const value = ipv4ToInt(ip);
  if (value === null) return "unparseable IPv4 address";
  for (const entry of IPV4_RANGES_BY_LENGTH) {
    if (value >= entry.range.start && value <= entry.range.end) {
      return `${entry.reason} (${entry.cidr})`;
    }
  }
  return null;
}

/** Expand any IPv6 textual form into 16 bytes. Returns null when unparseable. */
export function ipv6ToBytes(input) {
  let value = String(input || "").trim();
  if (value.startsWith("[") && value.endsWith("]")) {
    value = value.slice(1, -1);
  }
  if (value.includes("%")) {
    value = value.split("%")[0];
  }
  if (value === "") return null;

  let embeddedIpv4 = null;
  const lastColon = value.lastIndexOf(":");
  if (lastColon !== -1) {
    const tail = value.slice(lastColon + 1);
    if (tail.includes(".") && isIP(tail) === 4) {
      embeddedIpv4 = tail;
      value = `${value.slice(0, lastColon + 1)}0:0`;
    }
  } else if (value.includes(".") && isIP(value) === 4) {
    embeddedIpv4 = value;
    value = "0:0";
  }

  const doubleColonCount = (value.match(/::/g) || []).length;
  if (doubleColonCount > 1) return null;

  let head = [];
  let tail = [];
  if (doubleColonCount === 1) {
    const [left, right] = value.split("::");
    head = left ? left.split(":") : [];
    tail = right ? right.split(":") : [];
  } else {
    head = value.split(":");
  }

  const explicit = [...head, ...tail].filter((group) => group !== "");
  const missing = 8 - explicit.length;
  if (missing < 0) return null;

  const groups = doubleColonCount === 1
    ? [...head, ...Array(missing).fill("0"), ...tail]
    : head;

  if (groups.length !== 8) return null;

  const bytes = new Uint8Array(16);
  for (let index = 0; index < 8; index += 1) {
    const group = groups[index] === "" ? "0" : groups[index];
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null;
    const number = Number.parseInt(group, 16);
    bytes[index * 2] = (number >> 8) & 0xff;
    bytes[index * 2 + 1] = number & 0xff;
  }

  if (embeddedIpv4) {
    const octets = embeddedIpv4.split(".").map((part) => Number.parseInt(part, 10));
    bytes[12] = octets[0];
    bytes[13] = octets[1];
    bytes[14] = octets[2];
    bytes[15] = octets[3];
  }

  return bytes;
}

function bytesMatchPrefix(bytes, prefix, bits) {
  const fullBytes = Math.floor(bits / 8);
  for (let index = 0; index < fullBytes; index += 1) {
    if (bytes[index] !== prefix[index]) return false;
  }
  const remainingBits = bits % 8;
  if (remainingBits === 0) return true;
  const mask = (0xff << (8 - remainingBits)) & 0xff;
  return (bytes[fullBytes] & mask) === (prefix[fullBytes] & mask);
}

function bytesToIpv4(bytes) {
  return `${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}`;
}

/** @returns {string|null} the blocking reason, or null when the IPv6 is public */
export function blockedIpv6Reason(input) {
  const bytes = ipv6ToBytes(input);
  if (!bytes) return "unparseable IPv6 address";

  const mappedPrefix = [...new Array(10).fill(0), 0xff, 0xff];
  if (bytesMatchPrefix(bytes, mappedPrefix, IPV4_MAPPED_PREFIX_BITS)) {
    const embedded = bytesToIpv4(bytes);
    const reason = blockedIpv4Reason(embedded);
    return reason ? `IPv4-mapped IPv6 -> ${embedded}: ${reason}` : null;
  }

  if (bytesMatchPrefix(bytes, NAT64_PREFIX, NAT64_PREFIX_BITS)) {
    const embedded = bytesToIpv4(bytes);
    const reason = blockedIpv4Reason(embedded);
    return reason ? `NAT64 -> ${embedded}: ${reason}` : null;
  }

  for (const entry of BLOCKED_IPV6_PREFIXES) {
    if (bytesMatchPrefix(bytes, entry.prefix, entry.bits)) {
      return `${entry.reason} (${describePrefix(entry)})`;
    }
  }

  return null;
}

function describePrefix(entry) {
  return `${entry.prefix.map((byte) => byte.toString(16).padStart(2, "0")).join("")}/${entry.bits}`;
}

/** @returns {string|null} the blocking reason, or null when the address is public */
export function blockedAddressReason(address) {
  const family = isIP(address);
  if (family === 4) return blockedIpv4Reason(address);
  if (family === 6) return blockedIpv6Reason(address);
  return `not an IP address: ${address}`;
}

export function normalizeHostname(hostname) {
  return String(hostname || "").trim().toLowerCase().replace(/\.$/, "");
}

/** @returns {string|null} the blocking reason, or null when the hostname is acceptable */
export function blockedHostnameReason(hostname) {
  const host = normalizeHostname(hostname);
  if (!host) return "empty hostname";

  if (BLOCKED_HOSTNAMES.has(host)) return `blocked hostname "${host}"`;

  for (const suffix of BLOCKED_HOSTNAME_SUFFIXES) {
    if (host === suffix.slice(1) || host.endsWith(suffix)) {
      return `blocked hostname suffix "${suffix}"`;
    }
  }

  if (isIP(host) !== 0) {
    return blockedAddressReason(host);
  }

  return null;
}

/**
 * Full check: scheme, hostname, and every resolved address.
 *
 * @param {URL} url
 * @param {{ skipDns?: boolean }} [options]
 * @throws {UnsafeTargetError}
 */
export async function assertSafeTarget(url, options = {}) {
  if (!(url instanceof URL)) {
    throw new UnsafeTargetError("target is not a URL", "INVALID_URL");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new UnsafeTargetError(
      `scheme "${url.protocol}" is not allowed; only http and https are fetched`,
      "BLOCKED_SCHEME",
      { scheme: url.protocol },
    );
  }

  const hostReason = blockedHostnameReason(url.hostname);
  if (hostReason) {
    throw new UnsafeTargetError(
      `refusing to fetch ${url.hostname}: ${hostReason}`,
      "BLOCKED_HOST",
      { hostname: url.hostname, reason: hostReason },
    );
  }

  if (isIP(normalizeHostname(url.hostname)) !== 0) {
    return { hostname: url.hostname, addresses: [url.hostname] };
  }

  if (options.skipDns) {
    return { hostname: url.hostname, addresses: [] };
  }

  let records;
  try {
    records = await lookup(url.hostname, { all: true, verbatim: true });
  } catch (error) {
    throw new UnsafeTargetError(
      `DNS lookup failed for ${url.hostname}: ${error instanceof Error ? error.message : String(error)}`,
      "DNS_FAILURE",
      { hostname: url.hostname },
    );
  }

  if (!Array.isArray(records) || records.length === 0) {
    throw new UnsafeTargetError(
      `DNS returned no addresses for ${url.hostname}`,
      "DNS_NO_RECORDS",
      { hostname: url.hostname },
    );
  }

  const addresses = records.map((record) => record.address);
  for (const address of addresses) {
    const reason = blockedAddressReason(address);
    if (reason) {
      throw new UnsafeTargetError(
        `refusing to fetch ${url.hostname}: resolves to ${address} which is ${reason}`,
        "BLOCKED_ADDRESS",
        { hostname: url.hostname, address, reason },
      );
    }
  }

  return { hostname: url.hostname, addresses };
}

/** Non-throwing variant, used by the audits to classify without aborting. */
export async function checkSafeTarget(url, options = {}) {
  try {
    const result = await assertSafeTarget(url, options);
    return { safe: true, ...result, reason: null, code: null };
  } catch (error) {
    if (error instanceof UnsafeTargetError) {
      return {
        safe: false,
        hostname: url instanceof URL ? url.hostname : "",
        addresses: [],
        reason: error.message,
        code: error.code,
      };
    }
    throw error;
  }
}

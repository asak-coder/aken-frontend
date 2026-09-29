/**
 * TESTS 13 and 14 - SSRF protection and private-IP rejection.
 *
 * These are the security scenarios the Phase 1 brief requires. They are the
 * reason the auditor can safely probe links that appear in page HTML: a link
 * anyone can add must never be able to make the auditor read an internal
 * service or a cloud metadata endpoint.
 *
 * All checks here are pure functions, so the whole file runs offline.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  UnsafeTargetError,
  assertSafeTarget,
  blockedAddressReason,
  blockedHostnameReason,
  blockedIpv4Reason,
  blockedIpv6Reason,
  checkSafeTarget,
  ipv6ToBytes,
  normalizeHostname,
} from "../lib/ssrf-guard.mjs";

/* ----------------------------------------------------- hostname blocking */

test("rejects localhost and its aliases", () => {
  for (const host of ["localhost", "LOCALHOST", "localhost.", "ip6-localhost", "localhost.localdomain"]) {
    assert.ok(blockedHostnameReason(host), `${host} must be refused`);
  }
});

test("rejects internal-only hostname suffixes", () => {
  for (const host of [
    "app.local",
    "printer.localdomain",
    "service.internal",
    "db.intranet",
    "wiki.private",
    "box.home.arpa",
    "api.svc",
  ]) {
    assert.ok(blockedHostnameReason(host), `${host} must be refused`);
  }
});

test("rejects cloud metadata endpoints by name", () => {
  for (const host of [
    "metadata.google.internal",
    "metadata.goog",
    "instance-data.ec2.internal",
    "kubernetes.default.svc.cluster.local",
    "host.docker.internal",
  ]) {
    assert.ok(blockedHostnameReason(host), `${host} must be refused`);
  }
});

test("accepts the real production host", () => {
  assert.equal(blockedHostnameReason("aken.firm.in"), null);
  assert.equal(blockedHostnameReason("www.aken.firm.in"), null);
});

test("normalises a trailing dot before comparing hostnames", () => {
  assert.equal(normalizeHostname("AKEN.FIRM.IN."), "aken.firm.in");
  assert.ok(blockedHostnameReason("localhost."), "the root-dot form must still be refused");
});

/* ----------------------------------------------- private IPv4 rejection */

test("rejects loopback and private IPv4 addresses", () => {
  for (const ip of [
    "127.0.0.1",
    "127.1.2.3",
    "10.0.0.1",
    "10.255.255.255",
    "172.16.0.1",
    "172.31.255.254",
    "192.168.0.1",
    "192.168.255.255",
  ]) {
    assert.ok(blockedIpv4Reason(ip), `${ip} must be refused`);
  }
});

test("rejects the cloud metadata address 169.254.169.254", () => {
  const reason = blockedIpv4Reason("169.254.169.254");
  assert.ok(reason, "the EC2/GCP metadata address must be refused");
  assert.match(reason, /link-local|metadata/i);
});

test("rejects carrier-grade NAT, benchmarking and documentation ranges", () => {
  for (const ip of ["100.64.0.1", "198.18.0.1", "192.0.2.5", "198.51.100.9", "203.0.113.7"]) {
    assert.ok(blockedIpv4Reason(ip), `${ip} must be refused`);
  }
});

test("accepts a public IPv4 address", () => {
  assert.equal(blockedIpv4Reason("8.8.8.8"), null);
  assert.equal(blockedIpv4Reason("1.1.1.1"), null);
});

/* ----------------------------------------------- private IPv6 rejection */

test("rejects the IPv6 loopback and unspecified addresses", () => {
  assert.ok(blockedIpv6Reason("::1"));
  assert.ok(blockedIpv6Reason("::"));
});

test("rejects unique-local and link-local IPv6 ranges", () => {
  assert.ok(blockedIpv6Reason("fc00::1"), "unique local must be refused");
  assert.ok(blockedIpv6Reason("fd12:3456:789a::1"), "unique local must be refused");
  assert.ok(blockedIpv6Reason("fe80::1"), "link-local must be refused");
});

test("rejects an IPv4-mapped IPv6 address that hides a private IPv4", () => {
  const reason = blockedIpv6Reason("::ffff:127.0.0.1");
  assert.ok(reason, "an IPv4-mapped loopback must be refused");
  assert.match(reason, /IPv4-mapped/);
});

test("accepts a public IPv6 address", () => {
  assert.equal(blockedIpv6Reason("2606:4700:4700::1111"), null);
});

test("parses bracketed and zone-scoped IPv6 forms", () => {
  assert.ok(ipv6ToBytes("[::1]"), "bracketed form must parse");
  assert.ok(ipv6ToBytes("fe80::1%eth0"), "zone-scoped form must parse");
  assert.equal(ipv6ToBytes("not-an-address"), null);
});

test("classifies any address through one entry point", () => {
  assert.ok(blockedAddressReason("127.0.0.1"));
  assert.ok(blockedAddressReason("::1"));
  assert.equal(blockedAddressReason("8.8.8.8"), null);
  assert.match(blockedAddressReason("example.com"), /not an IP address/);
});

/* ------------------------------------------------------- whole-URL check */

test("assertSafeTarget refuses a localhost URL without any DNS lookup", async () => {
  await assert.rejects(
    () => assertSafeTarget(new URL("http://localhost:3000/admin")),
    (error) => {
      assert.ok(error instanceof UnsafeTargetError);
      assert.equal(error.code, "BLOCKED_HOST");
      return true;
    },
  );
});

test("assertSafeTarget refuses an IP literal that is private", async () => {
  await assert.rejects(
    () => assertSafeTarget(new URL("http://169.254.169.254/latest/meta-data/")),
    (error) => error instanceof UnsafeTargetError && error.code === "BLOCKED_HOST",
  );
});

test("assertSafeTarget refuses a non-http scheme", async () => {
  await assert.rejects(
    () => assertSafeTarget(new URL("file:///etc/passwd")),
    (error) => error instanceof UnsafeTargetError && error.code === "BLOCKED_SCHEME",
  );
});

test("assertSafeTarget accepts a public URL when DNS is skipped", async () => {
  const result = await assertSafeTarget(new URL("https://aken.firm.in/about"), { skipDns: true });
  assert.equal(result.hostname, "aken.firm.in");
});

test("checkSafeTarget reports a refusal instead of throwing", async () => {
  const verdict = await checkSafeTarget(new URL("http://127.0.0.1/"));
  assert.equal(verdict.safe, false);
  assert.equal(verdict.code, "BLOCKED_HOST");
  assert.match(verdict.reason, /refusing to fetch/);
});

test("checkSafeTarget reports success for a public target", async () => {
  const verdict = await checkSafeTarget(new URL("https://aken.firm.in/"), { skipDns: true });
  assert.equal(verdict.safe, true);
  assert.equal(verdict.reason, null);
});

test("a refused target is never fetched, so the reason is available before any socket opens", async () => {
  const verdict = await checkSafeTarget(new URL("http://[::ffff:10.0.0.5]/"));
  assert.equal(verdict.safe, false);
  assert.match(verdict.reason, /10\.0\.0\.5/);
});

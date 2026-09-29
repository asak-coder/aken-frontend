import { isSeverity, SEVERITY } from "./severity.mjs";

/**
 * A single audit observation.
 *
 * Every finding carries enough context to be acted on without re-running
 * the auditor: which audit produced it, a stable machine code, the URL,
 * a human message, and the evidence the conclusion rests on.
 *
 * `expected`/`actual` are optional and are only used for band-style checks
 * (title length, description length, canonical host, and so on).
 */

const MAX_MESSAGE_LENGTH = 600;

export function createFinding({
  audit,
  severity,
  code,
  url,
  message,
  expected,
  actual,
  evidence,
}) {
  if (!audit) {
    throw new Error("createFinding requires an 'audit' name");
  }
  if (!isSeverity(severity)) {
    throw new Error(`createFinding received an unknown severity: ${severity}`);
  }
  if (!code) {
    throw new Error("createFinding requires a stable 'code'");
  }
  if (!message) {
    throw new Error("createFinding requires a human-readable 'message'");
  }

  const finding = {
    audit,
    severity,
    code,
    url: url || null,
    message: truncate(message, MAX_MESSAGE_LENGTH),
  };

  if (expected !== undefined) finding.expected = expected;
  if (actual !== undefined) finding.actual = actual;
  if (evidence !== undefined) finding.evidence = evidence;

  return finding;
}

function truncate(value, limit) {
  const text = String(value);
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}\u2026`;
}

export function findingGroup(audit, url) {
  return { audit, url };
}

/**
 * Small helper for band checks so every audit reports lengths the same way.
 */
export function bandStatus(length, band) {
  if (!Number.isFinite(length)) return SEVERITY.ERROR;
  if (length > band.hardMax || length < band.hardMin) return SEVERITY.ERROR;
  if (length > band.max || length < band.min) return SEVERITY.WARNING;
  return SEVERITY.PASS;
}

/**
 * The auditor's only outbound HTTP capability.
 *
 * Safety properties, all of which are load-bearing:
 *
 *   - Every request, including every redirect hop, passes the SSRF guard
 *     before it is issued. Redirects are followed manually precisely so
 *     that hop 2 cannot escape the check that hop 1 passed.
 *   - Responses are streamed and cut off at a byte ceiling, so a hostile
 *     or accidental multi-gigabyte body cannot exhaust memory.
 *   - A per-attempt timeout always applies, and is composed with the
 *     caller's abort signal rather than replacing it.
 *   - Retries happen only for transport errors and for the status codes
 *     that genuinely mean "try again" (408/425/429/5xx). A 404 is never
 *     retried, so a broken link is reported as broken immediately.
 *   - No credentials, cookies or auth headers are ever sent. The auditor
 *     only ever reads public pages.
 */

import { assertSafeTarget, UnsafeTargetError } from "./ssrf-guard.mjs";
import {
  backoffDelay,
  createHostPacer,
  createSemaphore,
  sleep,
} from "./rate-limiter.mjs";
import { FETCH_POLICY } from "./config.mjs";

export class NetworkDisabledError extends Error {
  constructor(message = "network access is disabled for this run") {
    super(message);
    this.name = "NetworkDisabledError";
    this.code = "NETWORK_DISABLED";
  }
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export function createHttpClient(options = {}) {
  const config = {
    allowNetwork: options.allowNetwork !== false,
    concurrency: clampInt(options.concurrency, 1, 8, FETCH_POLICY.concurrency),
    timeoutMs: clampInt(options.timeoutMs, 1000, 60_000, FETCH_POLICY.timeoutMs),
    retries: clampInt(options.retries, 0, 5, FETCH_POLICY.retries),
    backoffBaseMs: FETCH_POLICY.backoffBaseMs,
    maxBackoffMs: FETCH_POLICY.maxBackoffMs,
    minHostDelayMs: options.minHostDelayMs ?? FETCH_POLICY.minHostDelayMs,
    maxRedirects: clampInt(options.maxRedirects, 0, 10, FETCH_POLICY.maxRedirects),
    maxResponseBytes: options.maxResponseBytes ?? FETCH_POLICY.maxResponseBytes,
    userAgent: options.userAgent || FETCH_POLICY.userAgent,
  };

  const semaphore = createSemaphore(config.concurrency);
  const pacer = createHostPacer(config.minHostDelayMs);
  const counters = { requests: 0, retries: 0, blocked: 0, bytes: 0 };

  async function request(url, requestOptions = {}) {
    if (!config.allowNetwork) {
      throw new NetworkDisabledError();
    }

    const startedAt = Date.now();
    const maxBytes = requestOptions.maxBytes ?? config.maxResponseBytes;
    const method = (requestOptions.method || "GET").toUpperCase();
    const maxAttempts = config.retries + 1;

    let lastError = null;
    let attempts = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      attempts = attempt;
      const release = await semaphore.acquire();
      try {
        const outcome = await followAndFetch(url, {
          method,
          maxBytes,
          timeoutMs: config.timeoutMs,
          signal: requestOptions.signal,
          headers: requestOptions.headers,
          accept: requestOptions.accept,
        });

        if (outcome.blocked) {
          counters.blocked += 1;
          return finalise(outcome);
        }

        if (outcome.error) {
          lastError = outcome.error;
          if (attempt < maxAttempts) {
            counters.retries += 1;
            await sleep(backoffDelay(attempt, config.backoffBaseMs, config.maxBackoffMs));
            continue;
          }
          return finalise(outcome);
        }

        if (RETRYABLE_STATUS.has(outcome.status) && attempt < maxAttempts) {
          counters.retries += 1;
          await sleep(backoffDelay(attempt, config.backoffBaseMs, config.maxBackoffMs));
          continue;
        }

        return finalise(outcome);
      } finally {
        release();
      }
    }

    return finalise({
      url,
      finalUrl: url,
      status: 0,
      ok: false,
      body: "",
      bytesRead: 0,
      bodyTruncated: false,
      redirects: [],
      error: lastError || { code: "UNKNOWN", message: "request failed" },
    });
  }

  async function followAndFetch(startUrl, settings) {
    const redirects = [];
    let current = startUrl;
    let referer = null;

    for (let hop = 0; hop <= config.maxRedirects; hop += 1) {
      const safety = await safeCheck(current);
      if (!safety.safe) {
        return {
          url: startUrl,
          finalUrl: current,
          status: 0,
          ok: false,
          body: "",
          bytesRead: 0,
          bodyTruncated: false,
          redirects,
          blocked: { code: safety.code, reason: safety.reason, url: current.toString() },
          error: null,
        };
      }

      await pacer.wait(current.hostname);
      const hopResult = await issueRequest(current, settings, referer);
      counters.requests += 1;

      if (hopResult.error) {
        return {
          url: startUrl,
          finalUrl: current,
          status: 0,
          ok: false,
          body: "",
          bytesRead: 0,
          bodyTruncated: false,
          redirects,
          blocked: null,
          error: hopResult.error,
        };
      }

      const location = hopResult.headers.location;
      const isRedirect = hopResult.status >= 300 && hopResult.status < 400 && location;

      if (isRedirect && settings.method === "GET") {
        const nextUrl = resolveRedirect(location, current);
        if (!nextUrl) {
          return {
            url: startUrl,
            finalUrl: current,
            status: hopResult.status,
            ok: false,
            body: "",
            bytesRead: 0,
            bodyTruncated: false,
            redirects,
            blocked: null,
            error: { code: "BAD_REDIRECT", message: `unresolvable Location: ${location}` },
          };
        }
        redirects.push({ from: current.toString(), to: nextUrl.toString(), status: hopResult.status });
        referer = current.toString();
        current = nextUrl;
        continue;
      }

      counters.bytes += hopResult.bytesRead;
      return {
        url: startUrl,
        finalUrl: current,
        status: hopResult.status,
        ok: hopResult.status >= 200 && hopResult.status < 300,
        statusText: hopResult.statusText,
        headers: hopResult.headers,
        contentType: hopResult.contentType,
        body: hopResult.body,
        bytesRead: hopResult.bytesRead,
        bodyTruncated: hopResult.bodyTruncated,
        redirects,
        redirectedTooFar: isRedirect,
        blocked: null,
        error: null,
      };
    }

    return {
      url: startUrl,
      finalUrl: current,
      status: 0,
      ok: false,
      body: "",
      bytesRead: 0,
      bodyTruncated: false,
      redirects,
      blocked: null,
      error: {
        code: "TOO_MANY_REDIRECTS",
        message: `more than ${config.maxRedirects} redirects`,
      },
    };
  }

  async function safeCheck(url) {
    try {
      await assertSafeTarget(url);
      return { safe: true };
    } catch (error) {
      if (error instanceof UnsafeTargetError) {
        return { safe: false, code: error.code, reason: error.message };
      }
      throw error;
    }
  }

  async function issueRequest(url, settings, referer) {
    const headers = {
      "user-agent": config.userAgent,
      accept:
        settings.accept ||
        "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
      "accept-language": "en-IN,en;q=0.9",
      "accept-encoding": "identity",
    };
    if (referer) headers.referer = referer;
    if (settings.headers) Object.assign(headers, settings.headers);

    const signals = [AbortSignal.timeout(settings.timeoutMs)];
    if (settings.signal) signals.push(settings.signal);
    const signal = signals.length === 1 ? signals[0] : AbortSignal.any(signals);

    let response;
    try {
      response = await fetch(url, {
        method: settings.method,
        headers,
        redirect: "manual",
        signal,
        credentials: "omit",
        cache: "no-store",
      });
    } catch (error) {
      return { error: classifyFetchError(error) };
    }

    const responseHeaders = headersToObject(response.headers);
    const contentType = String(responseHeaders["content-type"] || "");

    if (settings.method === "HEAD" || response.status === 204 || response.status === 304) {
      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        contentType,
        body: "",
        bytesRead: 0,
        bodyTruncated: false,
      };
    }

    try {
      const body = await readBodyCapped(response, settings.maxBytes);
      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        contentType,
        body: body.text,
        bytesRead: body.bytes,
        bodyTruncated: body.truncated,
      };
    } catch (error) {
      return { error: classifyFetchError(error) };
    }
  }

  function finalise(outcome) {
    return {
      ...outcome,
      attempts: undefined,
      elapsedMs: undefined,
    };
  }

  return {
    get: (url, requestOptions) => request(url, { ...requestOptions, method: "GET" }),
    head: (url, requestOptions) => request(url, { ...requestOptions, method: "HEAD" }),
    counters,
    config,
  };
}

async function readBodyCapped(response, maxBytes) {
  const limit = Math.max(1024, Number(maxBytes) || FETCH_POLICY.maxResponseBytes);

  if (!response.body) {
    const text = await response.text();
    const sliced = text.slice(0, limit);
    return { text: sliced, bytes: sliced.length, truncated: text.length > sliced.length };
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  let truncated = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value || value.length === 0) continue;

    if (total + value.length > limit) {
      chunks.push(Buffer.from(value).subarray(0, limit - total));
      total = limit;
      truncated = true;
      try {
        await reader.cancel();
      } catch {
        // a cancelled stream is the expected outcome here
      }
      break;
    }

    chunks.push(Buffer.from(value));
    total += value.length;
  }

  return { text: Buffer.concat(chunks, total).toString("utf8"), bytes: total, truncated };
}

function headersToObject(headers) {
  const result = {};
  for (const [key, value] of headers.entries()) {
    const name = key.toLowerCase();
    result[name] = result[name] ? `${result[name]}, ${value}` : value;
  }
  return result;
}

function resolveRedirect(location, base) {
  try {
    return new URL(location, base);
  } catch {
    return null;
  }
}

function classifyFetchError(error) {
  const name = error && error.name ? error.name : "Error";
  const message = error && error.message ? error.message : String(error);

  if (name === "TimeoutError") {
    return { code: "TIMEOUT", message: "request timed out" };
  }
  if (name === "AbortError") {
    return { code: "ABORTED", message: "request aborted" };
  }

  const causeCode = error && error.cause && error.cause.code ? error.cause.code : null;
  if (causeCode === "ENOTFOUND" || causeCode === "EAI_AGAIN") {
    return { code: "DNS_FAILURE", message: `DNS lookup failed (${causeCode})` };
  }
  if (causeCode === "ECONNREFUSED") {
    return { code: "CONNECTION_REFUSED", message: "connection refused" };
  }
  if (causeCode === "ECONNRESET") {
    return { code: "CONNECTION_RESET", message: "connection reset" };
  }
  if (causeCode === "CERT_HAS_EXPIRED" || causeCode === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
    return { code: "TLS_ERROR", message: `TLS error (${causeCode})` };
  }

  return { code: causeCode || "NETWORK_ERROR", message };
}

function clampInt(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export { sleep };

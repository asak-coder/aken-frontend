/**
 * Concurrency and pacing primitives.
 *
 * The Phase 1 brief requires the auditor not to hammer aken.firm.in.
 * Two independent controls enforce that:
 *
 *   - a semaphore, which bounds how many requests are in flight at once
 *     (default 4)
 *   - a per-host pacer, which guarantees a minimum gap between two
 *     requests to the same host
 *
 * They are separate because they solve different problems: concurrency
 * bounds burst size, pacing bounds request rate over time. Neither alone
 * is sufficient.
 */

export function createSemaphore(limit) {
  const capacity = Math.max(1, Math.floor(limit) || 1);
  let active = 0;
  const waiting = [];

  function release() {
    active -= 1;
    const next = waiting.shift();
    if (next) next();
  }

  async function acquire() {
    if (active < capacity) {
      active += 1;
      return release;
    }
    await new Promise((resolve) => waiting.push(resolve));
    active += 1;
    return release;
  }

  return {
    acquire,
    get active() {
      return active;
    },
    get pending() {
      return waiting.length;
    },
    get limit() {
      return capacity;
    },
  };
}

/**
 * Guarantees a minimum interval between requests to the same host.
 * Requests to different hosts do not block each other.
 */
export function createHostPacer(minimumDelayMs) {
  const delay = Math.max(0, Number(minimumDelayMs) || 0);
  const nextAllowedAt = new Map();

  return {
    /** Resolves once it is this host's turn. */
    async wait(hostname) {
      if (delay === 0) return;
      const host = String(hostname || "").toLowerCase();
      const now = Date.now();
      const earliest = nextAllowedAt.get(host) || 0;
      const waitMs = Math.max(0, earliest - now);
      nextAllowedAt.set(host, Math.max(now, earliest) + delay);
      if (waitMs > 0) {
        await sleep(waitMs);
      }
    },
    get minimumDelayMs() {
      return delay;
    },
  };
}

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.max(0, ms));
  });
}

/**
 * Exponential backoff with full jitter, so a burst of retries cannot
 * re-synchronise into a second burst.
 */
export function backoffDelay(attempt, baseMs, maxMs) {
  const exponential = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt - 1));
  return Math.round(Math.random() * exponential);
}

/** Bounded parallelism over a list, preserving order in the result array. */
export async function mapWithConcurrency(items, limit, worker) {
  const list = [...items];
  const results = new Array(list.length);
  let cursor = 0;
  const semaphore = createSemaphore(limit);

  async function run() {
    while (cursor < list.length) {
      const index = cursor;
      cursor += 1;
      const release = await semaphore.acquire();
      try {
        results[index] = await worker(list[index], index);
      } finally {
        release();
      }
    }
  }

  const runners = Array.from({ length: Math.min(limit, list.length) }, () => run());
  await Promise.all(runners);
  return results;
}

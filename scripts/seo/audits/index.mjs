/**
 * The audit registry.
 *
 * Every audit is invoked with the same context and returns the same shape,
 * so adding an audit means adding one import and one entry here and nothing
 * else.
 *
 * Audits may be synchronous or asynchronous. The runner awaits each result,
 * which is a no-op for the synchronous ones, so the call site does not need
 * to know which is which.
 */

import { runDiscoveryAudit } from "./discovery.mjs";
import { runTitlesAudit } from "./titles.mjs";
import { runDescriptionsAudit } from "./descriptions.mjs";
import { runCanonicalsAudit } from "./canonicals.mjs";
import { runH1Audit } from "./h1.mjs";
import { runHeadingsAudit } from "./headings.mjs";
import { runRobotsAudit } from "./robots.mjs";
import { runSitemapAudit } from "./sitemap.mjs";
import { runStructuredDataAudit } from "./structured-data.mjs";
import { runInternalLinksAudit } from "./internal-links.mjs";
import { runExternalLinksAudit } from "./external-links.mjs";
import { runImagesAudit } from "./images.mjs";
import { runIndexabilityAudit } from "./indexability-audit.mjs";
import { runDuplicateSignalsAudit } from "./duplicate-signals.mjs";
import { runUrlQualityAudit } from "./url-quality.mjs";
import { runBlogAudit } from "./blog.mjs";
import { runServicesAudit } from "./services.mjs";

export const AUDITS = Object.freeze([
  { id: "discovery", run: runDiscoveryAudit },
  { id: "titles", run: runTitlesAudit },
  { id: "descriptions", run: runDescriptionsAudit },
  { id: "canonicals", run: runCanonicalsAudit },
  { id: "h1", run: runH1Audit },
  { id: "headings", run: runHeadingsAudit },
  { id: "robots", run: runRobotsAudit },
  { id: "sitemap", run: runSitemapAudit },
  { id: "structured-data", run: runStructuredDataAudit },
  { id: "internal-links", run: runInternalLinksAudit },
  { id: "external-links", run: runExternalLinksAudit },
  { id: "images", run: runImagesAudit },
  { id: "indexability", run: runIndexabilityAudit },
  { id: "duplicate-signals", run: runDuplicateSignalsAudit },
  { id: "url-quality", run: runUrlQualityAudit },
  { id: "blog", run: runBlogAudit },
  { id: "services", run: runServicesAudit },
]);

/**
 * Run every audit in registry order.
 *
 * A single audit throwing must not lose the other sixteen results, so each
 * audit is isolated: a failure becomes an ERROR finding attributed to that
 * audit, and the run continues. Silently swallowing the failure would be
 * worse than the failure itself.
 *
 * @param {object} context
 * @param {(message: string) => void} [onProgress]
 */
export async function runAllAudits(context, onProgress) {
  const results = [];

  for (const audit of AUDITS) {
    const startedAt = Date.now();
    try {
      if (onProgress) onProgress(`  audit ${audit.id}`);
      const result = await audit.run(context);
      result.durationMs = Date.now() - startedAt;
      results.push(result);
    } catch (error) {
      results.push({
        id: audit.id,
        name: audit.id,
        description: "This audit threw and produced no result.",
        tally: { ERROR: 1, WARNING: 0, INFO: 0, UNVERIFIED: 0, PASS: 0 },
        summary: {},
        observations: [],
        durationMs: Date.now() - startedAt,
        findings: [
          {
            audit: audit.id,
            severity: "ERROR",
            code: "audit-threw",
            url: null,
            message: `The ${audit.id} audit failed: ${error instanceof Error ? error.message : String(error)}`,
            evidence: { stack: error instanceof Error ? error.stack : null },
          },
        ],
      });
    }
  }

  return results;
}

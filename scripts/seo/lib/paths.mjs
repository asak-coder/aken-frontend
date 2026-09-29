import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Absolute filesystem locations the auditor reads from and writes to.
 *
 * Derived from this module's own URL rather than process.cwd() so the
 * auditor behaves identically whether it is invoked from the frontend
 * package root, from a monorepo root, or from CI.
 */

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));

/** aken-frontend/ */
export const FRONTEND_ROOT = path.resolve(moduleDirectory, "..", "..", "..");

/** aken-frontend/src/ */
export const SRC_DIR = path.join(FRONTEND_ROOT, "src");

/** aken-frontend/src/app/ */
export const APP_DIR = path.join(SRC_DIR, "app");

/** aken-frontend/src/lib/ */
export const LIB_DIR = path.join(SRC_DIR, "lib");

/** aken-frontend/public/ */
export const PUBLIC_DIR = path.join(FRONTEND_ROOT, "public");

/**
 * Private report destination. Deliberately outside public/ so no audit
 * artefact can ever be served to a visitor.
 */
export const REPORTS_DIR = path.join(FRONTEND_ROOT, "reports", "seo");

export const PACKAGE_JSON_PATH = path.join(FRONTEND_ROOT, "package.json");

/** Route segments that must never be treated as public indexable pages. */
export const EXCLUDED_ROUTE_PREFIXES = Object.freeze([
  "/admin",
  "/api",
  "/_next",
  "/reports",
]);

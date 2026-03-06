/**
 * NOTE:
 * We intentionally do NOT use Next.js middleware here.
 *
 * Reason: Vercel build is failing with:
 *   ENOENT: no such file or directory, open '/vercel/path0/.next/server/middleware.js.nft.json'
 *
 * Until that Vercel build issue is resolved, canonical is enforced via:
 * 1) Vercel Domains redirect settings (www -> non-www, apex serves content)
 * 2) next.config.mjs redirects()
 */
export {};

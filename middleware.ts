import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "aken.firm.in";
const WWW_HOST = "www.aken.firm.in";

/**
 * Canonical host enforcement.
 *
 * Why: prevents duplicate-content and redirect confusion (SEO/Google Ads),
 * and fixes cases where edge/domain config accidentally flips apex↔www.
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";

  // If request comes to www, redirect to canonical (non-www).
  if (host.toLowerCase() === WWW_HOST) {
    const url = req.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

/**
 * Only run for pages, not for Next internals or static assets.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

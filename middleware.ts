import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const adminCookie = request.cookies.get("admin_auth");

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!adminCookie && !request.nextUrl.pathname.startsWith("/admin/login")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

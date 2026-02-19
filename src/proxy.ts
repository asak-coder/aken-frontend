import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";
  const isApiRoute = pathname.startsWith("/api");

  const token = req.cookies.get("admin_auth")?.value;

  if (isApiRoute) {
    return NextResponse.next();
  }

  if (isAdminRoute && !isLoginRoute && token !== "true") {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

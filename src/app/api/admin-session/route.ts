import { NextRequest, NextResponse } from "next/server";
import { getAdminCookieName, verifyAdminSessionToken } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(getAdminCookieName())?.value;
  if (!cookie) {
    const response = NextResponse.json({ authenticated: false }, { status: 401 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const payload = verifyAdminSessionToken(cookie);
  if (!payload) {
    const response = NextResponse.json({ authenticated: false }, { status: 401 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const response = NextResponse.json({
    authenticated: true,
    expiresAt: payload.exp,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

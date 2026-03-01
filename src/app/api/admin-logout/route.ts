import { NextResponse } from "next/server";
import { getAdminCookieName } from "@/lib/adminAuth";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(getAdminCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    priority: "high",
  });
  response.headers.set("Cache-Control", "no-store");

  return response;
}

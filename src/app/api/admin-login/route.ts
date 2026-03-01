import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSessionToken,
  getAdminCookieName,
  getAdminSessionTtlSeconds,
  hasValidAdminAuthConfig,
  isValidAdminCredentials,
} from "@/lib/adminAuth";

const FAILED_LOGIN_DELAY_MS = 700;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  let username = "admin";
  let password = "";

  try {
    const body = await req.json();
    username = String(body?.username || "admin").trim();
    password = String(body?.password || "");
  } catch {
    const response = NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (!hasValidAdminAuthConfig()) {
    const response = NextResponse.json(
      { error: "Server auth configuration is missing." },
      { status: 500 },
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (!password) {
    const response = NextResponse.json({ error: "Password is required." }, { status: 400 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const valid = isValidAdminCredentials(username, password);
  if (!valid) {
    await sleep(FAILED_LOGIN_DELAY_MS);
    const response = NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  let sessionToken = "";
  try {
    sessionToken = createAdminSessionToken();
  } catch {
    const response = NextResponse.json(
      { error: "Server auth configuration is invalid." },
      { status: 500 },
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(getAdminCookieName(), sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: getAdminSessionTtlSeconds(),
    priority: "high",
  });
  response.headers.set("Cache-Control", "no-store");

  return response;
}

import { NextRequest, NextResponse } from "next/server";

const LOGIN_PATH = "/admin/login";
const DEFAULT_ADMIN_REDIRECT = "/admin/leads";

function getAuthSecret() {
  const configuredSecret = (process.env.ADMIN_AUTH_SECRET || "").trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev-only-insecure-admin-auth-secret-change-me";
  }

  return "";
}

function getAdminSessionToken(request: NextRequest) {
  return (
    request.cookies.get("__Host-aken_admin_session")?.value ||
    request.cookies.get("aken_admin_session")?.value ||
    ""
  );
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64UrlToString(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function signValue(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  return toBase64Url(new Uint8Array(signature));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

async function verifyAdminSessionToken(token: string) {
  const secret = getAuthSecret();
  if (!secret || !token) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [encodedHeader, encodedPayload, incomingSignature] = parts;
  const expectedSignature = await signValue(`${encodedHeader}.${encodedPayload}`, secret);
  if (!safeEqual(incomingSignature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(decodeBase64UrlToString(encodedPayload)) as {
      sub?: string;
      exp?: number;
    };

    if (!payload || payload.sub !== "admin") {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp <= now) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function buildLoginRedirect(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = LOGIN_PATH;
  redirectUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(redirectUrl);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = getAdminSessionToken(request);
  const isAuthenticated = await verifyAdminSessionToken(token);

  if (pathname === LOGIN_PATH) {
    if (isAuthenticated) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = DEFAULT_ADMIN_REDIRECT;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return buildLoginRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

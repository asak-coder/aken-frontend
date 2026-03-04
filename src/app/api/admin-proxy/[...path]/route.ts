import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getBackendUrl() {
  const url = (process.env.BACKEND_API_URL || "").trim();
  return url || "http://localhost:5000";
}

function buildTargetUrl(pathParts: string[] | undefined, search: string) {
  const base = getBackendUrl().replace(/\/$/, "");
  const path = (pathParts || []).map((part) => encodeURIComponent(part)).join("/");
  return `${base}/api/${path}${search || ""}`;
}

async function proxyRequest(req: NextRequest, pathParts: string[] | undefined) {
  const targetUrl = buildTargetUrl(pathParts, new URL(req.url).search);

  // Forward minimal safe headers.
  const headers = new Headers();
  const csrf = req.headers.get("x-csrf-token");
  if (csrf) {
    headers.set("x-csrf-token", csrf);
  }
  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  // Read body only when needed.
  let body: BodyInit | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const arrayBuffer = await req.arrayBuffer();
    body = arrayBuffer.byteLength ? arrayBuffer : undefined;
  }

  const backendRes = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
    // IMPORTANT: include backend cookies coming from the browser
    credentials: "include",
    cache: "no-store",
  });

  // Pass through response (including set-cookie) so session + CSRF cookies persist.
  const resHeaders = new Headers(backendRes.headers);
  resHeaders.set("Cache-Control", "no-store");

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    headers: resHeaders,
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolved = await params;
  return proxyRequest(req, resolved.path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolved = await params;
  return proxyRequest(req, resolved.path);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolved = await params;
  return proxyRequest(req, resolved.path);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const resolved = await params;
  return proxyRequest(req, resolved.path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const resolved = await params;
  return proxyRequest(req, resolved.path);
}

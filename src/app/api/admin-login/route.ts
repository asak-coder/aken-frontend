import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json(
      { error: "Server auth configuration is missing." },
      { status: 500 },
    );
  }

  if (password === adminPassword) {
    const response = NextResponse.json({ success: true });

    response.cookies.set("admin_auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}

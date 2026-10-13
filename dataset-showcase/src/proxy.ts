import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

/**
 * Request boundary for /api/admin/* (except /api/admin/login).
 * NOTE: Next.js 16 renamed `middleware.ts` to `proxy.ts` — same purpose.
 * Every admin route handler also verifies the session itself; this is
 * an early optimistic check only.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  let valid = false;
  const secret = process.env.SESSION_SECRET;
  if (token && secret) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      valid = payload.role === "admin";
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    if (pathname === "/api/admin/me") {
      return Response.json({ authenticated: false }, { status: 401 });
    }
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/admin/:path*",
};

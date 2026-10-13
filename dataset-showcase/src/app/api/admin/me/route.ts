import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/auth";

/** GET /api/admin/me — session status (401 + false without a cookie). */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const authenticated = await verifySession(token);
  if (!authenticated) {
    return Response.json({ authenticated: false }, { status: 401 });
  }
  return Response.json({ authenticated: true });
}

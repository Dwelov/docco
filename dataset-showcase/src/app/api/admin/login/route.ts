import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";

function passwordsEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    // Same-cost dummy comparison to avoid leaking length quickly.
    const n = Math.max(a.length, b.length);
    const filler = Buffer.alloc(n);
    try {
      timingSafeEqual(filler, filler);
    } catch {
      // ignore
    }
    return false;
  }
  return timingSafeEqual(a, b);
}

/** POST /api/admin/login — password check, set signed session cookie. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const password =
    typeof body === "object" && body !== null && "password" in body
      ? (body as Record<string, unknown>).password
      : undefined;
  if (typeof password !== "string") {
    return Response.json({ error: "password is required." }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return Response.json({ error: "Server misconfigured." }, { status: 500 });
  }

  if (!passwordsEqual(password, expected)) {
    await new Promise((r) => setTimeout(r, 300));
    return Response.json({ error: "Invalid password." }, { status: 401 });
  }

  let token: string;
  try {
    token = await signSession();
  } catch {
    return Response.json({ error: "Server misconfigured." }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    ADMIN_COOKIE,
    token,
    sessionCookieOptions(process.env.NODE_ENV === "production"),
  );
  return res;
}

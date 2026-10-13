import { jwtVerify, SignJWT } from "jose";

export const ADMIN_COOKIE = "admin_session";
const TWELVE_HOURS_SECONDS = 12 * 60 * 60;

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Server misconfigured: SESSION_SECRET missing.");
  }
  return new TextEncoder().encode(secret);
}

/** Sign a new admin session JWT (12h expiry, HS256). SERVER ONLY. */
export async function signSession(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TWELVE_HOURS_SECONDS}s`)
    .sign(getSecret());
}

/** Verify an admin session JWT. Returns false for missing/invalid/expired. */
export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function sessionCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: TWELVE_HOURS_SECONDS,
  };
}

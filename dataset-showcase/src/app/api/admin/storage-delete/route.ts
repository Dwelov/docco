import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/auth";
import { DATASETS_BUCKET, getServiceClient } from "@/lib/supabaseServer";

// Server-generated upload paths look like "<uuid>/<sanitized-name>".
const PATH_RE = /^[0-9a-fA-F-]{36}\/[^/]{1,100}$/;

/**
 * POST /api/admin/storage-delete — best-effort removal of an orphaned
 * Storage file (e.g. upload succeeded but the dataset save failed).
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!(await verifySession(token))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const path =
    typeof body === "object" && body !== null && "path" in body
      ? (body as Record<string, unknown>).path
      : undefined;
  if (typeof path !== "string" || !PATH_RE.test(path)) {
    return Response.json({ error: "path is invalid." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return Response.json({ error: "Server misconfigured." }, { status: 500 });
  }
  const { error } = await supabase.storage.from(DATASETS_BUCKET).remove([path]);
  if (error) {
    return Response.json({ error: "Failed to delete file." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

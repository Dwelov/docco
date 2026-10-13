import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { DATASETS_BUCKET, getServiceClient } from "@/lib/supabaseServer";

/** POST /api/admin/upload-url — signed Storage upload URL for a .csv file. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const filename =
    typeof body === "object" && body !== null && "filename" in body
      ? (body as Record<string, unknown>).filename
      : undefined;
  if (typeof filename !== "string" || filename.trim().length === 0) {
    return Response.json({ error: "filename is required." }, { status: 400 });
  }
  if (!filename.toLowerCase().endsWith(".csv")) {
    return Response.json({ error: "Only .csv files are accepted." }, { status: 400 });
  }

  const base = filename.split(/[\\/]/).pop() ?? filename;
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "upload.csv";
  const path = `${randomUUID()}/${sanitized}`;

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return Response.json({ error: "Server misconfigured." }, { status: 500 });
  }

  const { data, error } = await supabase.storage
    .from(DATASETS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return Response.json({ error: "Failed to create upload URL." }, { status: 500 });
  }
  return Response.json({ path: data.path, token: data.token });
}

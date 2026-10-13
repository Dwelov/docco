import type { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";

/** POST /api/admin/datasets/reorder — body { ids: string[] }, rewrites position. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const ids =
    typeof body === "object" && body !== null && "ids" in body
      ? (body as Record<string, unknown>).ids
      : undefined;
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string" && id.length > 0)) {
    return Response.json({ error: "ids must be a non-empty array of strings." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return Response.json({ error: "Server misconfigured." }, { status: 500 });
  }

  for (let i = 0; i < ids.length; i += 1) {
    const { error } = await supabase.from("datasets").update({ position: i }).eq("id", ids[i]);
    if (error) {
      return Response.json({ error: "Failed to reorder datasets." }, { status: 500 });
    }
  }
  return Response.json({ ok: true });
}

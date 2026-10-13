import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/auth";
import { DATASETS_BUCKET, getServiceClient } from "@/lib/supabaseServer";
import { toDataset, validateDatasetInput } from "@/lib/validate-dataset";

/** POST /api/admin/datasets — create a dataset (position = max + 1). */
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

  const parsed = validateDatasetInput(body, true);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const input = parsed.value;

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return Response.json({ error: "Server misconfigured." }, { status: 500 });
  }

  const { data: last } = await supabase
    .from("datasets")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;

  let fileUrl: string | null = null;
  if (input.file_path) {
    fileUrl = supabase.storage.from(DATASETS_BUCKET).getPublicUrl(input.file_path).data.publicUrl;
  }

  const { data, error } = await supabase
    .from("datasets")
    .insert({
      title: input.title,
      description: input.description ?? null,
      properties: input.properties ?? [],
      columns: input.columns ?? [],
      preview_rows: input.preview_rows ?? [],
      row_count: input.row_count ?? 0,
      column_count: input.column_count ?? 0,
      file_path: input.file_path ?? null,
      file_url: fileUrl,
      file_size_bytes: input.file_size_bytes ?? null,
      position,
    })
    .select("*")
    .single();

  if (error || !data) {
    return Response.json({ error: "Failed to create dataset." }, { status: 500 });
  }
  return Response.json(toDataset(data as Record<string, unknown>), { status: 201 });
}

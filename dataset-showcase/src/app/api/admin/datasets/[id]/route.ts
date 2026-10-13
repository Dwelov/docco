import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/auth";
import { DATASETS_BUCKET, getServiceClient } from "@/lib/supabaseServer";
import { toDataset, validateDatasetInput } from "@/lib/validate-dataset";

async function requireAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  return verifySession(token);
}

/** PUT /api/admin/datasets/[id] — partial update; replaces file handling. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = validateDatasetInput(body, false);
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

  const { data: existing, error: fetchError } = await supabase
    .from("datasets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError || !existing) {
    return Response.json({ error: "Dataset not found." }, { status: 404 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.properties !== undefined) patch.properties = input.properties;
  if (input.columns !== undefined) patch.columns = input.columns;
  if (input.preview_rows !== undefined) patch.preview_rows = input.preview_rows;
  if (input.row_count !== undefined) patch.row_count = input.row_count;
  if (input.column_count !== undefined) patch.column_count = input.column_count;
  if (input.file_size_bytes !== undefined) patch.file_size_bytes = input.file_size_bytes;

  if (input.file_path !== undefined && input.file_path !== existing.file_path) {
    patch.file_path = input.file_path;
    patch.file_url = supabase.storage.from(DATASETS_BUCKET).getPublicUrl(input.file_path).data.publicUrl;
  }

  const { data, error } = await supabase
    .from("datasets")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    return Response.json({ error: "Failed to update dataset." }, { status: 500 });
  }

  // Delete the replaced Storage file (best effort, after a successful update).
  if (input.file_path !== undefined && existing.file_path && input.file_path !== existing.file_path) {
    await supabase.storage.from(DATASETS_BUCKET).remove([existing.file_path as string]);
  }

  return Response.json(toDataset(data as Record<string, unknown>));
}

/** DELETE /api/admin/datasets/[id] — delete the row AND its Storage file. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { id } = await params;

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return Response.json({ error: "Server misconfigured." }, { status: 500 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("datasets")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();
  if (fetchError || !existing) {
    return Response.json({ error: "Dataset not found." }, { status: 404 });
  }

  const { error } = await supabase.from("datasets").delete().eq("id", id);
  if (error) {
    return Response.json({ error: "Failed to delete dataset." }, { status: 500 });
  }

  if (existing.file_path) {
    await supabase.storage.from(DATASETS_BUCKET).remove([existing.file_path as string]);
  }
  return Response.json({ ok: true });
}

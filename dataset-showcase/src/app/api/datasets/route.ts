import { connection } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { toDataset } from "@/lib/validate-dataset";

/** Public: all datasets ordered by position. Always request-time, never cached. */
export async function GET() {
  // Opt out of prerendering: every request must hit the database so
  // admin changes are visible without a redeploy (replaces the legacy
  // `export const dynamic = "force-dynamic"`, which Cache Components forbids).
  await connection();

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return Response.json({ error: "Server misconfigured." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("datasets")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ error: "Failed to load datasets." }, { status: 500 });
  }

  return Response.json((data ?? []).map((row) => toDataset(row as Record<string, unknown>)), {
    headers: { "Cache-Control": "no-store" },
  });
}

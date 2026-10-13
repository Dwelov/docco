"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Anon-key Supabase client for browser use only (Phase 3: direct CSV
 * upload to a signed URL). It cannot read/write the database — RLS has
 * no public policies.
 */
export function getBrowserClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Client misconfigured: Supabase env vars missing.");
  }
  cached = createClient(url, anonKey);
  return cached;
}

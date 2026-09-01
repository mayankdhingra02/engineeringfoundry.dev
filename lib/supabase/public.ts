import "server-only";

import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/account-platform";
import type { Database } from "./database.types";

/**
 * Anonymous, read-only-capable client for public data protected by RLS.
 *
 * Public content remains available when accounts are intentionally disabled.
 * This client never receives request cookies, persists a session, or refreshes
 * authentication; mutations must continue through the authenticated client.
 */
export function createSupabasePublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!isSupabaseConfigured() || !url || !key) return null;
  return createClient<Database, "public">(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

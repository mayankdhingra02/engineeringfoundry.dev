import "server-only";

import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/account-platform";
import type { Database } from "./database.types";

/**
 * Sessionless client for the explicitly public, RLS-protected projection.
 * It never receives request cookies or upgrades to the authenticated role.
 */
export function createSupabasePublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!isSupabaseConfigured() || !url || !key) return null;
  return createClient<Database, "public">(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

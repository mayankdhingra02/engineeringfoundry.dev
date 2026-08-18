import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import type { Database } from "./database.types";

let browserClient: SupabaseClient<Database> | null = null;

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!isAccountPlatformAvailable() || !url || !key) return null;
  browserClient ??= createBrowserClient<Database, "public">(url, key);
  return browserClient;
}

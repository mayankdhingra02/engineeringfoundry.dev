import { createBrowserClient } from "@supabase/ssr";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import type { Database } from "./database.types";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!isAccountPlatformAvailable() || !url || !key) return null;
  return createBrowserClient<Database, "public">(url, key);
}

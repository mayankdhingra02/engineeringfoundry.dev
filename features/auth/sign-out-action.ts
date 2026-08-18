"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignOutResult = { ok: true } | { ok: false; message: string };

export async function signOutAction(): Promise<SignOutResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Authentication is not configured in this environment.",
    };
  }

  let { error } = await supabase.auth.signOut();
  if (error) {
    // Clear the current request's cookie session even when global refresh-token
    // revocation is temporarily unavailable.
    ({ error } = await supabase.auth.signOut({ scope: "local" }));
  }
  if (error) {
    return {
      ok: false,
      message: "We couldn't sign you out. Check your connection and try again.",
    };
  }
  return { ok: true };
}

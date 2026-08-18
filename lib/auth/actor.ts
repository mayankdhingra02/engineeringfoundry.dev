import "server-only";

import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthenticatedActor = {
  user: User;
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
};

/**
 * Resolves the only identity that may own private preparation data.
 * Never accept a user id from a form, URL, or client payload instead.
 */
export const getAuthenticatedActor = cache(async (): Promise<AuthenticatedActor | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { user: data.user, supabase };
});

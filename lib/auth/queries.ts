import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, PublicProfile } from "@/lib/supabase/database.types";
import { USERNAME_PATTERN } from "@/lib/auth/validation";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const actor = await getAuthenticatedActor();
  return actor?.user ?? null;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const current = await getAuthenticatedActor();
  if (!current) return null;
  const { data, error } = await current.supabase.from("profiles").select("*").eq("id", current.user.id).maybeSingle();
  if (error) throw new PrivateDataUnavailableError("profile");
  return data;
});

export const getPublicProfile = cache(async (username: string): Promise<PublicProfile | null> => {
  const normalized = username.toLowerCase();
  if (!USERNAME_PATTERN.test(normalized)) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.rpc("get_public_profile", { profile_username: normalized }).maybeSingle();
  return data;
});

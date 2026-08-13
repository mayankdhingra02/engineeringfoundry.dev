import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, PublicProfile } from "@/lib/supabase/database.types";
import { USERNAME_PATTERN } from "@/lib/auth/validation";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
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

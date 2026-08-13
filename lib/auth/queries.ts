import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/database.types";

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

export const getPublicProfile = cache(async (username: string): Promise<Profile | null> => {
  const normalized = username.toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(normalized)) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from("profiles").select("*").eq("username", normalized).eq("is_public", true).eq("onboarding_complete", true).maybeSingle();
  return data;
});

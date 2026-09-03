"use server";

import { getAuthenticatedActor } from "@/lib/auth/actor";
import { parseProfileForm } from "@/lib/auth/validation";
import type { Database } from "@/lib/supabase/database.types";

export interface ProfileActionState { status: "idle" | "error" | "success"; message: string; username?: string; visibility?: "public" | "private"; }

export async function saveProfileAction(_: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const current = await getAuthenticatedActor();
  if (!current) return { status: "error", message: "Your session has expired. Sign in and try again." };
  const { data: storedProfile, error: storedProfileError } = await current.supabase
    .from("profiles")
    .select("github_url,linkedin_url")
    .eq("id", current.user.id)
    .maybeSingle();
  if (storedProfileError) return { status: "error", message: "We couldn't save your profile. Check the fields and try again." };
  if (!storedProfile) return { status: "error", message: "We couldn't find your profile record. Sign out, sign back in, and try again." };
  const parsed = parseProfileForm(formData, {
    githubUrl: storedProfile.github_url,
    linkedinUrl: storedProfile.linkedin_url,
  });
  if (!parsed.data) return { status: "error", message: parsed.error ?? "Review the profile fields and try again." };
  const mode = formData.get("mode") === "onboarding" ? "onboarding" : "settings";
  const input = parsed.data;
  const profileUpdate: Database["public"]["Tables"]["profiles"]["Update"] = {
    username: input.username,
    display_name: input.displayName,
    bio: input.bio,
    current_company: input.currentCompany,
    current_role: input.currentRole,
    years_experience: input.yearsExperience,
    is_public: input.isPublic,
  };
  if (input.linkedinUrl !== undefined) profileUpdate.linkedin_url = input.linkedinUrl;
  if (input.githubUrl !== undefined) profileUpdate.github_url = input.githubUrl;
  const { data: updatedProfile, error } = await current.supabase.from("profiles").update(profileUpdate).eq("id", current.user.id).select("id").maybeSingle();
  if (error?.code === "23505") return { status: "error", message: "That username is already taken." };
  if (error?.code === "23514" && error.message.includes("profiles_username_not_reserved")) return { status: "error", message: "That username is reserved. Choose another one." };
  if (error) return { status: "error", message: "We couldn't save your profile. Check the fields and try again." };
  if (!updatedProfile) return { status: "error", message: "We couldn't find your profile record. Sign out, sign back in, and try again." };
  if (mode === "onboarding") {
    const completion = await current.supabase.rpc("complete_account_onboarding", {
      preferred_role_level_value: null,
      primary_preparation_focus_value: null,
      preferred_timezone_value: null,
    });
    if (completion.error) return { status: "error", message: "Your profile was saved, but setup could not be completed. Try again." };
  }
  return { status: "success", message: mode === "onboarding" ? "Profile complete." : "Profile changes saved.", username: input.username, visibility: input.isPublic ? "public" : "private" };
}

"use server";

import { getCurrentUser } from "@/lib/auth/queries";
import { parseProfileForm } from "@/lib/auth/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ProfileActionState { status: "idle" | "error" | "success"; message: string; username?: string; visibility?: "public" | "private"; }
export const initialProfileState: ProfileActionState = { status: "idle", message: "" };

export async function saveProfileAction(_: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  if (!user || !supabase) return { status: "error", message: "Your session has expired. Sign in and try again." };
  const parsed = parseProfileForm(formData);
  if (!parsed.data) return { status: "error", message: parsed.error ?? "Review the profile fields and try again." };
  const mode = formData.get("mode") === "onboarding" ? "onboarding" : "settings";
  const input = parsed.data;
  const { error } = await supabase.from("profiles").update({
    username: input.username,
    display_name: input.displayName,
    bio: input.bio,
    current_company: input.currentCompany,
    current_role: input.currentRole,
    years_experience: input.yearsExperience,
    linkedin_url: input.linkedinUrl,
    github_url: input.githubUrl,
    is_public: input.isPublic,
    ...(mode === "onboarding" ? { onboarding_complete: true } : {}),
  }).eq("id", user.id);
  if (error?.code === "23505") return { status: "error", message: "That username is already taken." };
  if (error) return { status: "error", message: "We couldn't save your profile. Check the fields and try again." };
  return { status: "success", message: mode === "onboarding" ? "Profile complete." : "Profile changes saved.", username: input.username, visibility: input.isPublic ? "public" : "private" };
}

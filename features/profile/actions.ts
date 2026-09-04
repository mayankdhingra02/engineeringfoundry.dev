"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import {
  PROFILE_CONFLICT_ERROR,
  PROFILE_INVALID_INPUT_ERROR,
  PROFILE_PERSISTENCE_ERROR,
  PROFILE_SAVED_MESSAGE,
  parseProfileActionEnvelope,
  parseProfileMutationResult,
  resolveProfileActionInput,
} from "@/lib/auth/profile-action-input";

export interface ProfileActionState {
  status: "idle" | "error" | "success";
  message: string;
  username?: string;
  visibility?: "public" | "private";
  conflict?: boolean;
  revision?: string;
}

export async function saveProfileAction(previousState: ProfileActionState, formData: unknown): Promise<ProfileActionState> {
  const envelope = parseProfileActionEnvelope(formData);
  if (!envelope.ok) {
    return {
      status: "error",
      message: PROFILE_INVALID_INPUT_ERROR,
      revision: previousState.revision,
    };
  }
  const current = await getAuthenticatedActor();
  if (!current) return { status: "error", message: "Your session has expired. Sign in and try again.", revision: envelope.value.expectedUpdatedAt };
  const { data: storedProfile, error: storedProfileError } = await current.supabase
    .from("profiles")
    .select("github_url,linkedin_url")
    .eq("id", current.user.id)
    .maybeSingle();
  if (storedProfileError) return { status: "error", message: PROFILE_PERSISTENCE_ERROR, revision: envelope.value.expectedUpdatedAt };
  if (!storedProfile) return { status: "error", message: PROFILE_PERSISTENCE_ERROR, revision: envelope.value.expectedUpdatedAt };
  const parsed = resolveProfileActionInput(envelope.value, {
    githubUrl: storedProfile.github_url,
    linkedinUrl: storedProfile.linkedin_url,
  });
  if (!parsed.ok) {
    return {
      status: "error",
      message: parsed.reason === "invalid-github"
        ? "GitHub URL must use https://github.com."
        : "LinkedIn URL must use https://www.linkedin.com.",
      revision: envelope.value.expectedUpdatedAt,
    };
  }
  const input = parsed.value;
  const { data, error } = await current.supabase.rpc("save_profile_if_revision", {
    target_expected_updated_at: input.expectedUpdatedAt,
    target_username: input.username,
    target_display_name: input.displayName,
    target_bio: input.bio,
    target_current_company: input.currentCompany,
    target_current_role: input.currentRole,
    target_years_experience: input.yearsExperience,
    target_update_linkedin_url: input.linkedinUrl !== undefined,
    target_linkedin_url: input.linkedinUrl ?? null,
    target_update_github_url: input.githubUrl !== undefined,
    target_github_url: input.githubUrl ?? null,
    target_is_public: input.isPublic,
  });
  if (error?.code === "23505") return { status: "error", message: "That username is already taken.", revision: input.expectedUpdatedAt };
  if (error?.code === "23514" && error.message.includes("profiles_username_not_reserved")) return { status: "error", message: "That username is reserved. Choose another one.", revision: input.expectedUpdatedAt };
  if (error) return { status: "error", message: PROFILE_PERSISTENCE_ERROR, revision: input.expectedUpdatedAt };
  const outcome = parseProfileMutationResult(data, current.user.id);
  if (outcome.status === "conflict") {
    return {
      status: "error",
      message: PROFILE_CONFLICT_ERROR,
      conflict: true,
      revision: input.expectedUpdatedAt,
    };
  }
  if (outcome.status === "invalid") {
    return { status: "error", message: PROFILE_PERSISTENCE_ERROR, revision: input.expectedUpdatedAt };
  }
  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
  revalidatePath(`/u/${input.username}`);
  return {
    status: "success",
    message: PROFILE_SAVED_MESSAGE,
    username: input.username,
    visibility: input.isPublic ? "public" : "private",
    revision: outcome.updatedAt,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { canonicalInterviewExperienceCompany } from "@/lib/interview-experiences/company";
import {
  INTERVIEW_EXPERIENCE_INVALID_INPUT_ERROR,
  INTERVIEW_EXPERIENCE_INVALID_MANAGEMENT_ERROR,
  INTERVIEW_EXPERIENCE_MANAGEMENT_UNAVAILABLE_ERROR,
  INTERVIEW_EXPERIENCE_SAVE_UNAVAILABLE_ERROR,
  parseInterviewExperienceManagementInput,
  parseInterviewExperienceSaveInput,
  type ExperienceManagementAction,
  type ExperienceSubmissionInput,
} from "@/lib/interview-experiences/action-input";
import type { Json } from "@/lib/supabase/database.types";

export type { ExperienceSubmissionInput } from "@/lib/interview-experiences/action-input";

export async function saveInterviewExperience(input: ExperienceSubmissionInput, submit: boolean) {
  const parsed = parseInterviewExperienceSaveInput(input, submit);
  if (!parsed.ok) return { ok: false, error: INTERVIEW_EXPERIENCE_INVALID_INPUT_ERROR };
  if (!isAccountPlatformAvailable()) return { ok: false, error: INTERVIEW_EXPERIENCE_SAVE_UNAVAILABLE_ERROR };
  const actor = await getAuthenticatedActor();
  if (!actor) return { ok: false, error: "Sign in to save or submit an interview experience." };
  const validated = parsed.value.input;
  const companyName = canonicalInterviewExperienceCompany(validated.companyName);
  const { roleTitle, summary } = validated;
  if (!companyName || !roleTitle || (parsed.value.submit && (!validated.publicationConsent || summary.length < 40))) return { ok: false, error: parsed.value.submit ? "Add a company, role, a 40-character high-level summary, and publication consent before submitting." : "Add a company and role before saving a draft." };
  const rounds = validated.roundType ? [{ round_type: validated.roundType, topic_labels: validated.topics, process_notes: null }] : [];
  const payload = {
    company_name: companyName,
    role_title: roleTitle,
    role_level: validated.roleLevel || null,
    region: validated.region || null,
    interview_date: validated.interviewDate ? `${validated.interviewDate}-01` : null,
    summary,
    preparation_lessons: validated.preparationLessons || null,
    public_identity: validated.publicIdentity,
    publication_consent: validated.publicationConsent,
    rounds,
  };
  const saved = await actor.supabase.rpc("save_interview_experience_draft", { target_id: validated.id ?? null, payload: payload as Json });
  if (saved.error || !saved.data) return { ok: false, error: "Your experience could not be saved. Please try again." };
  if (parsed.value.submit) {
    const submitted = await actor.supabase.rpc("submit_interview_experience", { target_id: saved.data });
    if (submitted.error || !submitted.data) return { ok: false, error: "Your draft was saved, but could not be submitted. You can try again from Your submissions." };
  }
  revalidatePath("/interview-experiences");
  return { ok: true, id: saved.data, status: parsed.value.submit ? "submitted" : "draft" };
}

const managementRpc: Record<ExperienceManagementAction, "withdraw_interview_experience" | "delete_interview_experience"> = {
  withdraw: "withdraw_interview_experience",
  delete: "delete_interview_experience",
};
const managementFailureError: Record<ExperienceManagementAction, string> = {
  withdraw: "This submission could not be withdrawn.",
  delete: "This draft could not be deleted.",
};

export async function manageInterviewExperience(id: string, action: ExperienceManagementAction) {
  const parsed = parseInterviewExperienceManagementInput(id, action);
  if (!parsed.ok) return { ok: false, error: INTERVIEW_EXPERIENCE_INVALID_MANAGEMENT_ERROR };
  if (!isAccountPlatformAvailable()) return { ok: false, error: INTERVIEW_EXPERIENCE_MANAGEMENT_UNAVAILABLE_ERROR };
  const actor = await getAuthenticatedActor();
  if (!actor) return { ok: false, error: "Sign in to manage your submission." };
  const result = await actor.supabase.rpc(managementRpc[parsed.value.action], { target_id: parsed.value.id });
  if (result.error || !result.data) return { ok: false, error: managementFailureError[parsed.value.action] };
  revalidatePath("/interview-experiences");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import {
  INTERVIEW_EXPERIENCE_DRAFT_SAVED_MESSAGE,
  INTERVIEW_EXPERIENCE_INVALID_INPUT_ERROR,
  INTERVIEW_EXPERIENCE_INVALID_MANAGEMENT_ERROR,
  INTERVIEW_EXPERIENCE_MANAGEMENT_CONFLICT_ERROR,
  INTERVIEW_EXPERIENCE_MANAGEMENT_UNAVAILABLE_ERROR,
  INTERVIEW_EXPERIENCE_SAVE_CONFLICT_ERROR,
  INTERVIEW_EXPERIENCE_SAVE_UNAVAILABLE_ERROR,
  INTERVIEW_EXPERIENCE_SUBMITTED_MESSAGE,
  parseInterviewExperienceManagementInput,
  parseInterviewExperienceMutationResult,
  parseInterviewExperienceSaveInput,
  type ExperienceManagementAction,
  type InterviewExperienceStatus,
} from "@/lib/interview-experiences/action-input";
import { canonicalInterviewExperienceCompany } from "@/lib/interview-experiences/company";
import type { Json } from "@/lib/supabase/database.types";

export type { ExperienceSubmissionInput } from "@/lib/interview-experiences/action-input";

export type InterviewExperienceActionResult =
  | Readonly<{
      ok: true;
      id: string;
      status: InterviewExperienceStatus | "deleted";
      revision: string;
      message: string;
    }>
  | Readonly<{ ok: false; error: string; conflict?: boolean }>;

export async function saveInterviewExperience(
  input: unknown,
  submit: unknown,
): Promise<InterviewExperienceActionResult> {
  const parsed = parseInterviewExperienceSaveInput(input, submit);
  if (!parsed.ok) {
    return { ok: false, error: INTERVIEW_EXPERIENCE_INVALID_INPUT_ERROR };
  }

  const validated = parsed.value.input;
  const companyName = canonicalInterviewExperienceCompany(
    validated.companyName,
  );
  if (
    !companyName ||
    !validated.roleTitle ||
    (parsed.value.submit &&
      (!validated.publicationConsent ||
        Array.from(validated.summary).length < 40))
  ) {
    return {
      ok: false,
      error: parsed.value.submit
        ? "Add a company, role, a 40-character high-level summary, and publication consent before submitting."
        : "Add a company and role before saving a draft.",
    };
  }
  if (!isAccountPlatformAvailable()) {
    return { ok: false, error: INTERVIEW_EXPERIENCE_SAVE_UNAVAILABLE_ERROR };
  }
  const actor = await getAuthenticatedActor();
  if (!actor) {
    return {
      ok: false,
      error: "Sign in to save or submit an interview experience.",
    };
  }

  const rounds = validated.roundType
    ? [
        {
          round_type: validated.roundType,
          topic_labels: validated.topics,
          process_notes: null,
        },
      ]
    : [];
  const { data, error } = await actor.supabase.rpc(
    "save_interview_experience_if_revision",
    {
      target_experience_id: validated.id,
      target_expect_absent: parsed.value.expectAbsent,
      target_expected_updated_at: parsed.value.expectedUpdatedAt,
      target_submit: parsed.value.submit,
      target_company_name: companyName,
      target_role_title: validated.roleTitle,
      target_role_level: validated.roleLevel || null,
      target_region: validated.region || null,
      target_interview_date: validated.interviewDate
        ? `${validated.interviewDate}-01`
        : null,
      target_summary: validated.summary,
      target_preparation_lessons: validated.preparationLessons || null,
      target_public_identity: validated.publicIdentity,
      target_publication_consent: validated.publicationConsent,
      target_rounds: rounds as Json,
    },
  );
  if (error) {
    return {
      ok: false,
      error: "Your experience could not be saved. Please try again.",
    };
  }
  const result = parseInterviewExperienceMutationResult(
    data,
    validated.id,
    [parsed.value.submit ? "submitted" : "draft"],
  );
  if (result.status === "conflict") {
    return {
      ok: false,
      error: INTERVIEW_EXPERIENCE_SAVE_CONFLICT_ERROR,
      conflict: true,
    };
  }
  if (result.status !== "saved") {
    return {
      ok: false,
      error: "Your experience could not be saved. Please try again.",
    };
  }

  revalidatePath("/interview-experiences");
  return {
    ok: true,
    id: result.id,
    status: result.experienceStatus,
    revision: result.updatedAt,
    message: parsed.value.submit
      ? INTERVIEW_EXPERIENCE_SUBMITTED_MESSAGE
      : INTERVIEW_EXPERIENCE_DRAFT_SAVED_MESSAGE,
  };
}

const managementFailureError: Record<ExperienceManagementAction, string> = {
  withdraw: "This submission could not be withdrawn. Please try again.",
  delete: "This draft could not be deleted. Please try again.",
};

export async function manageInterviewExperience(
  id: unknown,
  action: unknown,
  expectedUpdatedAt: unknown,
): Promise<InterviewExperienceActionResult> {
  const parsed = parseInterviewExperienceManagementInput(
    id,
    action,
    expectedUpdatedAt,
  );
  if (!parsed.ok) {
    return {
      ok: false,
      error: INTERVIEW_EXPERIENCE_INVALID_MANAGEMENT_ERROR,
    };
  }
  if (!isAccountPlatformAvailable()) {
    return {
      ok: false,
      error: INTERVIEW_EXPERIENCE_MANAGEMENT_UNAVAILABLE_ERROR,
    };
  }
  const actor = await getAuthenticatedActor();
  if (!actor) {
    return { ok: false, error: "Sign in to manage your submission." };
  }

  const { data, error } = await actor.supabase.rpc(
    "manage_interview_experience_if_revision",
    {
      target_experience_id: parsed.value.id,
      target_expected_updated_at: parsed.value.expectedUpdatedAt,
      target_action: parsed.value.action,
    },
  );
  if (error) {
    return {
      ok: false,
      error: managementFailureError[parsed.value.action],
    };
  }
  const expectedStatus =
    parsed.value.action === "withdraw" ? "withdrawn" : "deleted";
  const result = parseInterviewExperienceMutationResult(
    data,
    parsed.value.id,
    [expectedStatus],
  );
  if (result.status === "conflict") {
    return {
      ok: false,
      error: INTERVIEW_EXPERIENCE_MANAGEMENT_CONFLICT_ERROR,
      conflict: true,
    };
  }
  if (result.status !== "saved") {
    return {
      ok: false,
      error: managementFailureError[parsed.value.action],
    };
  }

  revalidatePath("/interview-experiences");
  return {
    ok: true,
    id: result.id,
    status: result.experienceStatus,
    revision: result.updatedAt,
    message:
      parsed.value.action === "withdraw"
        ? "Submission withdrawn. It is no longer public or under review."
        : "Draft deleted.",
  };
}

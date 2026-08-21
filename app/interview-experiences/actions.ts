"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import type { Json } from "@/lib/supabase/database.types";

export type ExperienceSubmissionInput = {
  id?: string;
  companyName: string;
  roleTitle: string;
  roleLevel: string;
  region: string;
  interviewDate: string;
  summary: string;
  preparationLessons: string;
  publicIdentity: "anonymous" | "username";
  publicationConsent: boolean;
  roundType: string;
  topics: string[];
};

function clean(value: string, max: number) { return value.trim().slice(0, max); }

export async function saveInterviewExperience(input: ExperienceSubmissionInput, submit = false) {
  const actor = await getAuthenticatedActor();
  if (!actor) return { ok: false, error: "Sign in to save or submit an interview experience." };
  const companyName = clean(input.companyName, 120);
  const roleTitle = clean(input.roleTitle, 160);
  const summary = clean(input.summary, 4000);
  const validLevels = new Set(["", "Entry", "Mid", "Senior", "Staff+", "Management", "Prefer not to say"]);
  if (!companyName || !roleTitle || !validLevels.has(input.roleLevel) || (submit && (!input.publicationConsent || summary.length < 40))) return { ok: false, error: submit ? "Add a company, role, a 40-character high-level summary, and publication consent before submitting." : "Add a company and role before saving a draft." };
  const rounds = input.roundType ? [{ round_type: clean(input.roundType, 80), topic_labels: input.topics.slice(0, 12).map((topic) => clean(topic, 80)).filter(Boolean), process_notes: null }] : [];
  const payload = {
    company_name: companyName,
    role_title: roleTitle,
    role_level: input.roleLevel || null,
    region: clean(input.region, 120) || null,
    interview_date: input.interviewDate || null,
    summary,
    preparation_lessons: clean(input.preparationLessons, 3000) || null,
    public_identity: input.publicIdentity,
    publication_consent: input.publicationConsent,
    rounds,
  };
  const saved = await actor.supabase.rpc("save_interview_experience_draft", { target_id: input.id ?? null, payload: payload as Json });
  if (saved.error || !saved.data) return { ok: false, error: "Your experience could not be saved. Please try again." };
  if (submit) {
    const submitted = await actor.supabase.rpc("submit_interview_experience", { target_id: saved.data });
    if (submitted.error || !submitted.data) return { ok: false, error: "Your draft was saved, but could not be submitted. You can try again from Your submissions." };
  }
  revalidatePath("/interview-experiences");
  return { ok: true, id: saved.data, status: submit ? "submitted" : "draft" };
}

export async function manageInterviewExperience(id: string, action: "withdraw" | "delete") {
  const actor = await getAuthenticatedActor();
  if (!actor) return { ok: false, error: "Sign in to manage your submission." };
  const rpc = action === "withdraw" ? "withdraw_interview_experience" : "delete_interview_experience";
  const result = await actor.supabase.rpc(rpc, { target_id: id });
  if (result.error || !result.data) return { ok: false, error: action === "withdraw" ? "This submission could not be withdrawn." : "This draft could not be deleted." };
  revalidatePath("/interview-experiences");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findCuratedQuestion } from "@/lib/behavioral/catalog";
import { reviewAnswerFacts } from "@/lib/behavioral/fact-integrity";
import {
  BEHAVIORAL_STORY_CONFLICT_ERROR,
  BEHAVIORAL_STORY_CREATE_ERROR,
  BEHAVIORAL_STORY_DUPLICATE_ERROR,
  BEHAVIORAL_STORY_INVALID_INPUT_ERROR,
  BEHAVIORAL_STORY_UPDATE_ERROR,
  parseBehavioralStoryActionInput,
  parseBehavioralStoryMutationResult,
  parseCanonicalBehavioralStoryId,
  type BehavioralStoryInput,
} from "@/lib/behavioral/story-action-input";
import { parseAnswerForm, parseQuestionForm, type BehavioralFieldErrors } from "@/lib/behavioral/validation";
import { getAuthenticatedActor, type AuthenticatedActor } from "@/lib/auth/actor";

export interface BehavioralActionState { status: "idle" | "error"; message: string; fieldErrors?: BehavioralFieldErrors; conflict?: boolean }
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sessionError = (): BehavioralActionState => ({ status: "error", message: "Your session has expired. Sign in and try again." });
function refreshBehavioral() { revalidatePath("/behavioral/workspace"); revalidatePath("/behavioral/questions"); revalidatePath("/behavioral/stories"); revalidatePath("/dashboard"); }

async function ownedQuestion(current: AuthenticatedActor, questionId: string) {
  const curated = findCuratedQuestion(questionId);
  if (curated) return { curated_question_id: questionId, custom_question_id: null };
  if (!UUID_PATTERN.test(questionId)) return null;
  const { data } = await current.supabase.from("behavioral_custom_questions").select("id").eq("id", questionId).eq("user_id", current.user.id).maybeSingle();
  return data ? { curated_question_id: null, custom_question_id: questionId } : null;
}

async function ownsStory(current: AuthenticatedActor, storyId: string) {
  if (!UUID_PATTERN.test(storyId)) return false;
  const { data, error } = await current.supabase.from("behavioral_stories").select("id").eq("id", storyId).eq("user_id", current.user.id).maybeSingle();
  return !error && Boolean(data);
}

async function ownedFactSourceStory(current: AuthenticatedActor, storyId: string) {
  if (!UUID_PATTERN.test(storyId)) return null;
  const { data, error } = await current.supabase
    .from("behavioral_stories")
    .select("id,title,situation,task,action,result,reflection,short_summary")
    .eq("id", storyId)
    .eq("user_id", current.user.id)
    .maybeSingle();
  return error ? null : data;
}

async function hasConfirmedAnswerFacts(current: AuthenticatedActor, storyId: string | null, draft: Parameters<typeof reviewAnswerFacts>[1], confirmed: boolean) {
  if (!storyId) return false;
  const source = await ownedFactSourceStory(current, storyId);
  if (!source) return false;
  return reviewAnswerFacts(source, draft).length === 0 || confirmed;
}

async function ownsAnswerRelationships(current: AuthenticatedActor, input: { story_id: string | null; application_id: string | null }) {
  const [story, application] = await Promise.all([
    input.story_id ? ownsStory(current, input.story_id) : Promise.resolve(true),
    input.application_id
      ? current.supabase.from("applications").select("id").eq("id", input.application_id).eq("user_id", current.user.id).maybeSingle().then(({ data, error }) => !error && Boolean(data))
      : Promise.resolve(true),
  ]);
  return story && application;
}

async function answerMatchesOwnedQuestion(current: AuthenticatedActor, answerId: string, reference: { curated_question_id: string | null; custom_question_id: string | null }) {
  const { data, error } = await current.supabase.from("behavioral_answers").select("curated_question_id,custom_question_id").eq("id", answerId).eq("user_id", current.user.id).maybeSingle();
  return !error && data?.curated_question_id === reference.curated_question_id && data?.custom_question_id === reference.custom_question_id;
}

function mutationFailure(message: string): never {
  throw new Error(message);
}

function signInAgain(next: string): never {
  redirect(`/signin?next=${encodeURIComponent(next)}`);
}

function storyRpcArgs(story: BehavioralStoryInput) {
  return {
    target_title: story.title,
    target_company_or_context: story.company_or_context,
    target_role: story.role,
    target_approximate_period: story.approximate_period,
    target_project: story.project,
    target_situation: story.situation,
    target_task: story.task,
    target_action: story.action,
    target_result: story.result,
    target_reflection: story.reflection,
    target_short_summary: story.short_summary,
    target_notes: story.notes,
  };
}

export async function createStoryAction(_: BehavioralActionState, formData: unknown): Promise<BehavioralActionState> {
  const parsed = parseBehavioralStoryActionInput(formData, { kind: "create" });
  if (!parsed.ok) return { status: "error", message: BEHAVIORAL_STORY_INVALID_INPUT_ERROR, fieldErrors: parsed.fieldErrors };
  const current = await getAuthenticatedActor(); if (!current) return sessionError();
  const { story, themes } = parsed.value;
  const { data, error } = await current.supabase.rpc("create_behavioral_story_with_themes", {
    ...storyRpcArgs(story), target_themes: [...themes],
  });
  if (error) return { status: "error", message: BEHAVIORAL_STORY_CREATE_ERROR };
  const outcome = parseBehavioralStoryMutationResult(data);
  if (outcome.status !== "saved") return { status: "error", message: BEHAVIORAL_STORY_CREATE_ERROR };
  refreshBehavioral(); redirect(`/behavioral/stories/${outcome.storyId}`);
}

export async function updateStoryAction(storyId: unknown, _: BehavioralActionState, formData: unknown): Promise<BehavioralActionState> {
  const parsed = parseBehavioralStoryActionInput(formData, { kind: "edit", storyId });
  if (!parsed.ok) return { status: "error", message: BEHAVIORAL_STORY_INVALID_INPUT_ERROR, fieldErrors: parsed.fieldErrors };
  const current = await getAuthenticatedActor(); if (!current) return sessionError();
  const { story, themes, expectedUpdatedAt } = parsed.value;
  const { data, error } = await current.supabase.rpc("update_behavioral_story_with_themes_if_revision", {
    target_story_id: parsed.value.storyId!, target_expected_updated_at: expectedUpdatedAt!,
    ...storyRpcArgs(story), target_themes: [...themes],
  });
  if (error) return { status: "error", message: BEHAVIORAL_STORY_UPDATE_ERROR };
  const outcome = parseBehavioralStoryMutationResult(data, parsed.value.storyId!);
  if (outcome.status === "missing") return { status: "error", message: BEHAVIORAL_STORY_CONFLICT_ERROR, conflict: true };
  if (outcome.status === "invalid") return { status: "error", message: BEHAVIORAL_STORY_UPDATE_ERROR };
  refreshBehavioral(); revalidatePath(`/behavioral/stories/${outcome.storyId}`); redirect(`/behavioral/stories/${outcome.storyId}`);
}

export async function deleteStoryAction(storyId: string) {
  const current = await getAuthenticatedActor(); if (!current) signInAgain("/behavioral/stories");
  if (!UUID_PATTERN.test(storyId)) return;
  const { data, error } = await current.supabase.from("behavioral_stories").delete().eq("id", storyId).eq("user_id", current.user.id).select("id").maybeSingle();
  if (error || !data) mutationFailure("We couldn't delete this story. It may no longer be available.");
  refreshBehavioral(); redirect("/behavioral/stories");
}

export async function duplicateStoryAction(storyId: unknown) {
  const parsedStoryId = parseCanonicalBehavioralStoryId(storyId);
  if (!parsedStoryId) mutationFailure(BEHAVIORAL_STORY_DUPLICATE_ERROR);
  const current = await getAuthenticatedActor(); if (!current) signInAgain("/behavioral/stories");
  const { data, error } = await current.supabase.rpc("duplicate_behavioral_story_with_themes", { target_story_id: parsedStoryId });
  if (error) mutationFailure(BEHAVIORAL_STORY_DUPLICATE_ERROR);
  const outcome = parseBehavioralStoryMutationResult(data);
  if (outcome.status !== "saved") mutationFailure(BEHAVIORAL_STORY_DUPLICATE_ERROR);
  refreshBehavioral(); redirect(`/behavioral/stories/${outcome.storyId}/edit`);
}

export async function createQuestionAction(_: BehavioralActionState, formData: FormData): Promise<BehavioralActionState> {
  const current = await getAuthenticatedActor(); if (!current) return sessionError();
  const parsed = parseQuestionForm(formData); if (!parsed.data) return { status: "error", message: "Review the highlighted fields.", fieldErrors: parsed.errors };
  const { data, error } = await current.supabase.from("behavioral_custom_questions").insert({ ...parsed.data, user_id: current.user.id }).select("id").maybeSingle();
  if (error || !data) return { status: "error", message: "We couldn't save this question." };
  refreshBehavioral(); redirect(`/behavioral/questions/${data.id}`);
}

export async function updateQuestionAction(questionId: string, _: BehavioralActionState, formData: FormData): Promise<BehavioralActionState> {
  const current = await getAuthenticatedActor(); if (!current) return sessionError();
  if (!UUID_PATTERN.test(questionId)) return { status: "error", message: "Curated questions cannot be edited." };
  const parsed = parseQuestionForm(formData); if (!parsed.data) return { status: "error", message: "Review the highlighted fields.", fieldErrors: parsed.errors };
  const { data, error } = await current.supabase.from("behavioral_custom_questions").update(parsed.data).eq("id", questionId).eq("user_id", current.user.id).select("id").maybeSingle();
  if (error || !data) return { status: "error", message: "We couldn't update this question." };
  refreshBehavioral(); revalidatePath(`/behavioral/questions/${questionId}`); redirect(`/behavioral/questions/${questionId}`);
}

export async function deleteQuestionAction(questionId: string) {
  const current = await getAuthenticatedActor(); if (!current) signInAgain("/behavioral/questions");
  if (!UUID_PATTERN.test(questionId)) return;
  const { data, error } = await current.supabase.from("behavioral_custom_questions").delete().eq("id", questionId).eq("user_id", current.user.id).select("id").maybeSingle();
  if (error || !data) mutationFailure("We couldn't delete this question. It may no longer be available.");
  refreshBehavioral(); redirect("/behavioral/questions");
}

export async function linkStoryAction(questionId: string, formData: FormData) {
  const current = await getAuthenticatedActor(); if (!current) signInAgain("/behavioral/questions");
  const reference = await ownedQuestion(current, questionId); const storyId = String(formData.get("story_id") ?? "");
  if (!reference || !await ownsStory(current, storyId)) return;
  const { error } = await current.supabase.from("behavioral_story_question_links").insert({ user_id: current.user.id, story_id: storyId, ...reference });
  if (error) mutationFailure("We couldn't link that story. It may already be linked.");
  refreshBehavioral(); revalidatePath(`/behavioral/questions/${questionId}`); revalidatePath(`/behavioral/stories/${storyId}`);
}

export async function linkQuestionToStoryAction(storyId: string, formData: FormData) {
  const current = await getAuthenticatedActor(); const questionId = String(formData.get("question_id") ?? "");
  if (!current) signInAgain("/behavioral/stories");
  if (!await ownsStory(current, storyId)) return;
  const reference = await ownedQuestion(current, questionId); if (!reference) return;
  const { error } = await current.supabase.from("behavioral_story_question_links").insert({ user_id: current.user.id, story_id: storyId, ...reference });
  if (error) mutationFailure("We couldn't link that question. It may already be linked.");
  refreshBehavioral(); revalidatePath(`/behavioral/stories/${storyId}`); revalidatePath(`/behavioral/questions/${questionId}`);
}

export async function unlinkStoryAction(linkId: string, questionId: string) {
  const current = await getAuthenticatedActor(); if (!current) signInAgain("/behavioral/questions");
  if (!UUID_PATTERN.test(linkId)) return;
  const { data, error } = await current.supabase.from("behavioral_story_question_links").delete().eq("id", linkId).eq("user_id", current.user.id).select("id").maybeSingle();
  if (error || !data) mutationFailure("We couldn't unlink that story. It may no longer be available.");
  refreshBehavioral(); revalidatePath(`/behavioral/questions/${questionId}`);
}

export async function createAnswerAction(questionId: string, _: BehavioralActionState, formData: FormData): Promise<BehavioralActionState> {
  const current = await getAuthenticatedActor(); if (!current) return sessionError();
  const reference = await ownedQuestion(current, questionId); if (!reference) return { status: "error", message: "This question could not be found." };
  const parsed = parseAnswerForm(formData); if (!parsed.data) return { status: "error", message: "Review the highlighted fields.", fieldErrors: parsed.errors };
  if (!await ownsAnswerRelationships(current, parsed.data)) return { status: "error", message: "A linked story or application is no longer available." };
  if (!await hasConfirmedAnswerFacts(current, parsed.data.story_id, parsed.data, parsed.factIntegrityConfirmed)) return { status: "error", message: "Review the source-story consistency prompts before saving this variant.", fieldErrors: { fact_integrity_confirmed: "Confirm the source story or update it first before saving these factual changes." } };
  const { data: answer, error } = await current.supabase.from("behavioral_answers").insert({ ...parsed.data, ...reference, user_id: current.user.id }).select("id").maybeSingle();
  if (error || !answer) return { status: "error", message: "We couldn't save this preparation. Check linked records and try again." };
  if (parsed.isPrimary) {
    const { data: primarySet, error: primaryError } = await current.supabase.rpc("set_behavioral_primary_answer", { target_answer_id: answer.id, make_primary: true });
    if (primaryError || !primarySet) {
      await current.supabase.from("behavioral_answers").delete().eq("id", answer.id).eq("user_id", current.user.id);
      return { status: "error", message: "We couldn't set the primary story. Check the linked story and try again." };
    }
  }
  refreshBehavioral(); revalidatePath(`/behavioral/questions/${questionId}`); redirect(`/behavioral/questions/${questionId}`);
}

export async function updateAnswerAction(questionId: string, answerId: string, _: BehavioralActionState, formData: FormData): Promise<BehavioralActionState> {
  const current = await getAuthenticatedActor(); if (!current) return sessionError();
  const reference = await ownedQuestion(current, questionId);
  if (!UUID_PATTERN.test(answerId) || !reference || !await answerMatchesOwnedQuestion(current, answerId, reference)) return { status: "error", message: "This answer could not be found." };
  const parsed = parseAnswerForm(formData); if (!parsed.data) return { status: "error", message: "Review the highlighted fields.", fieldErrors: parsed.errors };
  if (!await ownsAnswerRelationships(current, parsed.data)) return { status: "error", message: "A linked story or application is no longer available." };
  if (!await hasConfirmedAnswerFacts(current, parsed.data.story_id, parsed.data, parsed.factIntegrityConfirmed)) return { status: "error", message: "Review the source-story consistency prompts before saving this variant.", fieldErrors: { fact_integrity_confirmed: "Confirm the source story or update it first before saving these factual changes." } };
  const { data, error } = await current.supabase.from("behavioral_answers").update(parsed.data).eq("id", answerId).eq("user_id", current.user.id).select("id").maybeSingle();
  if (error || !data) return { status: "error", message: "We couldn't update this answer." };
  const { data: primarySet, error: primaryError } = await current.supabase.rpc("set_behavioral_primary_answer", { target_answer_id: answerId, make_primary: parsed.isPrimary });
  if (primaryError || !primarySet) return { status: "error", message: "The notes were updated, but the primary-story setting could not be changed. Try saving again." };
  refreshBehavioral(); revalidatePath(`/behavioral/questions/${questionId}`); redirect(`/behavioral/questions/${questionId}`);
}

export async function deleteAnswerAction(answerId: string, questionId: string) {
  const current = await getAuthenticatedActor(); if (!current) signInAgain("/behavioral/questions");
  if (!UUID_PATTERN.test(answerId)) return;
  const reference = await ownedQuestion(current, questionId);
  if (!reference || !await answerMatchesOwnedQuestion(current, answerId, reference)) return;
  const { data, error } = await current.supabase.from("behavioral_answers").delete().eq("id", answerId).eq("user_id", current.user.id).select("id").maybeSingle();
  if (error || !data) mutationFailure("We couldn't delete this answer. It may no longer be available.");
  refreshBehavioral(); revalidatePath(`/behavioral/questions/${questionId}`);
}

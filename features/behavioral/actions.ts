"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CURATED_BEHAVIORAL_QUESTIONS, findCuratedQuestion } from "@/lib/behavioral/catalog";
import {
  BEHAVIORAL_ANSWER_CONFLICT_ERROR,
  BEHAVIORAL_ANSWER_CREATE_ERROR,
  BEHAVIORAL_ANSWER_INVALID_INPUT_ERROR,
  BEHAVIORAL_ANSWER_UPDATE_ERROR,
  parseBehavioralAnswerActionInput,
  parseBehavioralAnswerMutationResult,
  type BehavioralAnswerInput,
} from "@/lib/behavioral/answer-action-input";
import { reviewAnswerFacts } from "@/lib/behavioral/fact-integrity";
import {
  BEHAVIORAL_ANSWER_DELETE_ERROR,
  BEHAVIORAL_STORY_DELETE_ERROR,
  parseBehavioralAnswerDeleteInput,
  parseBehavioralDeleteResult,
  parseBehavioralStoryDeleteInput,
} from "@/lib/behavioral/delete-revision";
import {
  BEHAVIORAL_QUESTION_CONFLICT_ERROR,
  BEHAVIORAL_QUESTION_DELETE_ERROR,
  BEHAVIORAL_QUESTION_INVALID_INPUT_ERROR,
  BEHAVIORAL_QUESTION_PERSISTENCE_ERROR,
  BEHAVIORAL_QUESTION_SAVED_MESSAGE,
  parseBehavioralQuestionActionInput,
  parseBehavioralQuestionDeleteResult,
  parseBehavioralQuestionMutationResult,
  parseBehavioralQuestionRevision,
} from "@/lib/behavioral/question-action-input";
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
import { getAuthenticatedActor, type AuthenticatedActor } from "@/lib/auth/actor";
import type { TrackerActionState } from "@/features/applications/actions";

export interface BehavioralActionState {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string>;
  conflict?: boolean;
  questionId?: string;
  revision?: string;
}
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const curatedQuestionIds = new Set(CURATED_BEHAVIORAL_QUESTIONS.map((question) => question.id));

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

function answerRpcArgs(
  answer: BehavioralAnswerInput,
  reference: {
    curated_question_id: string | null;
    custom_question_id: string | null;
  },
  isPrimary: boolean,
) {
  return {
    target_custom_question_id: reference.custom_question_id,
    target_curated_question_id: reference.curated_question_id,
    target_story_id: answer.story_id,
    target_company_slug: answer.company_slug,
    target_application_id: answer.application_id,
    target_title: answer.title,
    target_answer_text: answer.answer_text,
    target_opening_framing: answer.opening_framing,
    target_details_to_emphasize: answer.details_to_emphasize,
    target_details_to_avoid: answer.details_to_avoid,
    target_notes: answer.notes,
    target_status: answer.status,
    target_make_primary: isPrimary,
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

export async function deleteStoryAction(
  storyIdInput: unknown,
  revisionInput: unknown,
  _: TrackerActionState,
  formInput: unknown,
): Promise<TrackerActionState> {
  const parsed = parseBehavioralStoryDeleteInput(storyIdInput, revisionInput, formInput);
  if (!parsed) return { status: "error", message: BEHAVIORAL_STORY_DELETE_ERROR };
  const current = await getAuthenticatedActor();
  if (!current) return { status: "error", message: "Your session has expired. Sign in and try again." };
  const { data, error } = await current.supabase.rpc(
    "delete_behavioral_story_if_revision",
    {
      target_story_id: parsed.storyId,
      target_expected_updated_at: parsed.expectedUpdatedAt,
    },
  );
  if (error) return { status: "error", message: BEHAVIORAL_STORY_DELETE_ERROR };
  const outcome = parseBehavioralDeleteResult(data, "story_id", parsed.storyId);
  if (outcome.status !== "deleted") {
    return {
      status: "error",
      message: BEHAVIORAL_STORY_DELETE_ERROR,
      conflict: outcome.status === "conflict",
    };
  }
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

export async function saveQuestionAction(previousState: BehavioralActionState, formData: unknown): Promise<BehavioralActionState> {
  const parsed = parseBehavioralQuestionActionInput(formData);
  if (!parsed.ok) {
    return {
      status: "error",
      message: BEHAVIORAL_QUESTION_INVALID_INPUT_ERROR,
      fieldErrors: parsed.fieldErrors,
      questionId: previousState.questionId,
      revision: previousState.revision,
    };
  }
  const current = await getAuthenticatedActor();
  if (!current) {
    return {
      ...sessionError(),
      questionId: parsed.value.questionId,
      revision: parsed.value.expectedUpdatedAt ?? previousState.revision,
    };
  }
  const { question } = parsed.value;
  const { data, error } = await current.supabase.rpc(
    "save_behavioral_custom_question_if_revision",
    {
      target_question_id: parsed.value.questionId,
      target_expect_absent: parsed.value.expectAbsent,
      target_expected_updated_at: parsed.value.expectedUpdatedAt,
      target_question_text: question.question_text,
      target_description: question.description,
      target_category: question.category,
      target_company_slug: question.company_slug,
      target_notes: question.notes,
    },
  );
  if (error) {
    return {
      status: "error",
      message: BEHAVIORAL_QUESTION_PERSISTENCE_ERROR,
      questionId: parsed.value.questionId,
      revision: parsed.value.expectedUpdatedAt ?? previousState.revision,
    };
  }
  const outcome = parseBehavioralQuestionMutationResult(
    data,
    parsed.value.questionId,
  );
  if (outcome.status === "conflict") {
    return {
      status: "error",
      message: BEHAVIORAL_QUESTION_CONFLICT_ERROR,
      conflict: true,
      questionId: parsed.value.questionId,
      revision: parsed.value.expectedUpdatedAt ?? previousState.revision,
    };
  }
  if (outcome.status !== "saved") {
    return {
      status: "error",
      message: BEHAVIORAL_QUESTION_PERSISTENCE_ERROR,
      questionId: parsed.value.questionId,
      revision: parsed.value.expectedUpdatedAt ?? previousState.revision,
    };
  }
  refreshBehavioral();
  revalidatePath(`/behavioral/questions/${outcome.questionId}`);
  return {
    status: "success",
    message: BEHAVIORAL_QUESTION_SAVED_MESSAGE,
    questionId: outcome.questionId,
    revision: outcome.updatedAt,
  };
}

export async function deleteQuestionAction(questionIdInput: unknown, revisionInput: unknown) {
  const parsed = parseBehavioralQuestionRevision(questionIdInput, revisionInput);
  if (!parsed) mutationFailure(BEHAVIORAL_QUESTION_DELETE_ERROR);
  const current = await getAuthenticatedActor();
  if (!current) signInAgain("/behavioral/questions");
  const { data, error } = await current.supabase.rpc(
    "delete_behavioral_custom_question_if_revision",
    {
      target_question_id: parsed.questionId,
      target_expected_updated_at: parsed.expectedUpdatedAt,
    },
  );
  if (error) mutationFailure(BEHAVIORAL_QUESTION_DELETE_ERROR);
  const outcome = parseBehavioralQuestionDeleteResult(data, parsed.questionId);
  if (outcome.status !== "deleted") {
    mutationFailure(BEHAVIORAL_QUESTION_DELETE_ERROR);
  }
  refreshBehavioral();
  redirect("/behavioral/questions");
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

export async function createAnswerAction(questionId: unknown, _: BehavioralActionState, formData: unknown): Promise<BehavioralActionState> {
  const parsed = parseBehavioralAnswerActionInput(formData, { kind: "create", questionId }, curatedQuestionIds);
  if (!parsed.ok) return { status: "error", message: BEHAVIORAL_ANSWER_INVALID_INPUT_ERROR, fieldErrors: parsed.fieldErrors };
  const current = await getAuthenticatedActor(); if (!current) return sessionError();
  const reference = await ownedQuestion(current, parsed.value.questionId); if (!reference) return { status: "error", message: "This question could not be found." };
  if (!await ownsAnswerRelationships(current, parsed.value.answer)) return { status: "error", message: "A linked story or application is no longer available." };
  if (!await hasConfirmedAnswerFacts(current, parsed.value.answer.story_id, parsed.value.answer, parsed.value.factIntegrityConfirmed)) return { status: "error", message: "Review the source-story consistency prompts before saving this variant.", fieldErrors: { fact_integrity_confirmed: "Confirm the source story or update it first before saving these factual changes." } };
  const { data, error } = await current.supabase.rpc("create_behavioral_answer_aggregate", answerRpcArgs(parsed.value.answer, reference, parsed.value.isPrimary));
  if (error) return { status: "error", message: BEHAVIORAL_ANSWER_CREATE_ERROR };
  const outcome = parseBehavioralAnswerMutationResult(data);
  if (outcome.status !== "saved") return { status: "error", message: BEHAVIORAL_ANSWER_CREATE_ERROR };
  refreshBehavioral(); revalidatePath(`/behavioral/questions/${parsed.value.questionId}`); redirect(`/behavioral/questions/${parsed.value.questionId}`);
}

export async function updateAnswerAction(questionId: unknown, answerId: unknown, _: BehavioralActionState, formData: unknown): Promise<BehavioralActionState> {
  const parsed = parseBehavioralAnswerActionInput(formData, { kind: "edit", questionId, answerId }, curatedQuestionIds);
  if (!parsed.ok) return { status: "error", message: BEHAVIORAL_ANSWER_INVALID_INPUT_ERROR, fieldErrors: parsed.fieldErrors };
  const current = await getAuthenticatedActor(); if (!current) return sessionError();
  const reference = await ownedQuestion(current, parsed.value.questionId);
  if (!reference) return { status: "error", message: "This question could not be found." };
  if (!await ownsAnswerRelationships(current, parsed.value.answer)) return { status: "error", message: "A linked story or application is no longer available." };
  if (!await hasConfirmedAnswerFacts(current, parsed.value.answer.story_id, parsed.value.answer, parsed.value.factIntegrityConfirmed)) return { status: "error", message: "Review the source-story consistency prompts before saving this variant.", fieldErrors: { fact_integrity_confirmed: "Confirm the source story or update it first before saving these factual changes." } };
  const { data, error } = await current.supabase.rpc("update_behavioral_answer_aggregate_if_revision", {
    target_answer_id: parsed.value.answerId!,
    target_expected_updated_at: parsed.value.expectedUpdatedAt!,
    ...answerRpcArgs(parsed.value.answer, reference, parsed.value.isPrimary),
  });
  if (error) return { status: "error", message: BEHAVIORAL_ANSWER_UPDATE_ERROR };
  const outcome = parseBehavioralAnswerMutationResult(data, parsed.value.answerId!);
  if (outcome.status === "missing") return { status: "error", message: BEHAVIORAL_ANSWER_CONFLICT_ERROR, conflict: true };
  if (outcome.status === "invalid") return { status: "error", message: BEHAVIORAL_ANSWER_UPDATE_ERROR };
  refreshBehavioral(); revalidatePath(`/behavioral/questions/${parsed.value.questionId}`); redirect(`/behavioral/questions/${parsed.value.questionId}`);
}

export async function deleteAnswerAction(
  questionIdInput: unknown,
  answerIdInput: unknown,
  revisionInput: unknown,
  _: TrackerActionState,
  formInput: unknown,
): Promise<TrackerActionState> {
  const parsed = parseBehavioralAnswerDeleteInput(
    questionIdInput,
    answerIdInput,
    revisionInput,
    formInput,
    curatedQuestionIds,
  );
  if (!parsed) return { status: "error", message: BEHAVIORAL_ANSWER_DELETE_ERROR };
  const current = await getAuthenticatedActor();
  if (!current) return { status: "error", message: "Your session has expired. Sign in and try again." };
  const reference = await ownedQuestion(current, parsed.questionId);
  if (!reference) return { status: "error", message: BEHAVIORAL_ANSWER_DELETE_ERROR };
  const { data, error } = await current.supabase.rpc(
    "delete_behavioral_answer_if_revision",
    {
      target_answer_id: parsed.answerId,
      target_expected_updated_at: parsed.expectedUpdatedAt,
      target_custom_question_id: reference.custom_question_id,
      target_curated_question_id: reference.curated_question_id,
    },
  );
  if (error) return { status: "error", message: BEHAVIORAL_ANSWER_DELETE_ERROR };
  const outcome = parseBehavioralDeleteResult(data, "answer_id", parsed.answerId);
  if (outcome.status !== "deleted") {
    return {
      status: "error",
      message: BEHAVIORAL_ANSWER_DELETE_ERROR,
      conflict: outcome.status === "conflict",
    };
  }
  refreshBehavioral(); revalidatePath(`/behavioral/questions/${parsed.questionId}`);
  redirect(`/behavioral/questions/${parsed.questionId}`);
}

"use server";

import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getAuthenticatedActorState } from "@/lib/auth/actor";
import {
  MOCK_REVIEW_ACCOUNT_UNAVAILABLE_ERROR,
  MOCK_REVIEW_INVALID_INPUT_ERROR,
  MOCK_REVIEW_PERSISTENCE_ERROR,
  MOCK_REVIEW_SAVED_MESSAGE,
  MOCK_REVIEW_UNAUTHENTICATED_ERROR,
  parseMockInterviewReviewInput,
  type MockInterviewReviewActionResult,
} from "@/lib/mock-interviews/review-input";
import type { Json } from "@/lib/supabase/database.types";

export async function saveMockInterviewReview(
  input: unknown,
): Promise<MockInterviewReviewActionResult> {
  const parsed = parseMockInterviewReviewInput(input);

  if (!parsed.ok) {
    return {
      ok: false,
      reason: "invalid-input",
      error: MOCK_REVIEW_INVALID_INPUT_ERROR,
    };
  }

  if (!isAccountPlatformAvailable()) {
    return {
      ok: false,
      reason: "account-unavailable",
      error: MOCK_REVIEW_ACCOUNT_UNAVAILABLE_ERROR,
    };
  }

  const actorState = await getAuthenticatedActorState();
  if (actorState.state === "unavailable") {
    return {
      ok: false,
      reason: "account-unavailable",
      error: MOCK_REVIEW_ACCOUNT_UNAVAILABLE_ERROR,
    };
  }
  if (actorState.state === "anonymous") {
    return {
      ok: false,
      reason: "unauthenticated",
      error: MOCK_REVIEW_UNAUTHENTICATED_ERROR,
    };
  }
  const actor = actorState.actor;

  const validated = parsed.value;
  const result = await actor.supabase.rpc("save_mock_interview_review", {
    target_session_id: validated.sessionId,
    target_track: validated.track,
    target_mode: validated.mode,
    target_plan_id: validated.planId,
    target_prompt_id: validated.promptId,
    target_rubric_id: validated.rubricId,
    target_started_at: validated.startedAt,
    target_elapsed_seconds: validated.elapsedSeconds,
    target_strength: validated.strength || null,
    target_improvement: validated.improvement || null,
    target_follow_up_practice: validated.followUp || null,
    target_ratings: validated.ratings as Json,
  });

  if (result.error) {
    return {
      ok: false,
      reason: "persistence-failed",
      error: MOCK_REVIEW_PERSISTENCE_ERROR,
    };
  }

  return {
    ok: true,
    reason: "saved",
    message: MOCK_REVIEW_SAVED_MESSAGE,
  };
}

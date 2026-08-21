"use server";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { activeMockSessionPlans, getMockRubric } from "@/data/mock-interviews";
import type { Json } from "@/lib/supabase/database.types";

export async function saveMockInterviewReview(input: { sessionId: string; track: string; mode: string; planId: string; promptId: string; rubricId: string; startedAt: string; elapsedSeconds: number; strength: string; improvement: string; followUp: string; ratings: { dimension_id: string; rating: string }[] }) {
  const actor = await getAuthenticatedActor();
  if (!actor) return { ok: false, error: "Sign in to save this private practice review." };
  const plan = activeMockSessionPlans.find((item) => item.id === input.planId);
  const rubric = plan && getMockRubric(plan.rubric_id);
  const validRatings = new Set(["Strong", "Developing", "Needs attention"]);
  const ids = new Set(input.ratings.map((item) => item.dimension_id));
  if (!plan || !rubric || input.track !== plan.track || input.mode !== "solo" && input.mode !== "peer" || input.rubricId !== plan.rubric_id || input.promptId !== plan.content_reference.id || !input.ratings.length || ids.size !== input.ratings.length || input.ratings.some((item) => !rubric.dimensions.some((dimension) => dimension.id === item.dimension_id) || !validRatings.has(item.rating))) return { ok: false, error: "This review no longer matches the selected canonical practice session." };
  const result = await actor.supabase.rpc("save_mock_interview_review", { target_session_id: input.sessionId, target_track: input.track as "dsa" | "system-design" | "ml-design" | "behavioral", target_mode: input.mode as "solo" | "peer", target_plan_id: input.planId, target_prompt_id: input.promptId, target_rubric_id: input.rubricId, target_started_at: input.startedAt, target_elapsed_seconds: input.elapsedSeconds, target_strength: input.strength || null, target_improvement: input.improvement || null, target_follow_up_practice: input.followUp || null, target_ratings: input.ratings as Json });
  return result.error ? { ok: false, error: "Could not save your practice review. Please try again." } : { ok: true };
}

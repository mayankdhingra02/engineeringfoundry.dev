"use server";
import { getAuthenticatedActor } from "@/lib/auth/actor";

export async function saveMockInterviewReview(input: { sessionId: string; track: string; mode: string; planId: string; promptId: string; rubricId: string; startedAt: string; elapsedSeconds: number; strength: string; improvement: string; followUp: string; ratings: { dimension_id: string; rating: string }[] }) {
  const actor = await getAuthenticatedActor();
  if (!actor) return { ok: false, error: "Sign in to save this private practice review." };
  const rpc = actor.supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ error: unknown }>;
  const result = await rpc("save_mock_interview_review", { target_session_id: input.sessionId, target_track: input.track, target_mode: input.mode, target_plan_id: input.planId, target_prompt_id: input.promptId, target_rubric_id: input.rubricId, target_started_at: input.startedAt, target_elapsed_seconds: input.elapsedSeconds, target_strength: input.strength || null, target_improvement: input.improvement || null, target_follow_up_practice: input.followUp || null, target_ratings: input.ratings });
  return result.error ? { ok: false, error: "Could not save your practice review. Please try again." } : { ok: true };
}

import "server-only";
import { getAuthenticatedActor } from "@/lib/auth/actor";
import { PrivateDataUnavailableError } from "@/lib/persistence/errors";
import { mockReviewsToInterviewEvidence, type MockReviewRating } from "./mock-evidence.ts";

export async function getMockInterviewEvidence() {
  const actor = await getAuthenticatedActor();
  if (!actor) return [];
  const result = await actor.supabase.from("mock_interview_sessions").select("id,track,reviewed_at,mock_interview_rubric_ratings(rating)").eq("user_id", actor.user.id).not("reviewed_at", "is", null);
  if (result.error) throw new PrivateDataUnavailableError("mock practice evidence");
  const rows = (result.data ?? []) as unknown as readonly { id: string; track: "dsa" | "system-design" | "ml-design" | "behavioral"; reviewed_at: string; mock_interview_rubric_ratings: readonly { rating: MockReviewRating }[] | null }[];
  return mockReviewsToInterviewEvidence(rows.map((row) => ({ sessionId: row.id, track: row.track, reviewedAt: row.reviewed_at, ratings: (row.mock_interview_rubric_ratings ?? []).map((rating) => rating.rating) })));
}

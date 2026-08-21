import type { InterviewEvidenceItem, InterviewPreparationArea } from "./evidence.ts";

export type MockReviewRating = "Strong" | "Developing" | "Needs attention";
export type MockReviewSource = Readonly<{ sessionId: string; track: "dsa" | "system-design" | "ml-design" | "behavioral"; reviewedAt: string; ratings: readonly MockReviewRating[] }>;

const AREAS: Record<MockReviewSource["track"], InterviewPreparationArea> = { dsa: "algorithmic-coding", "system-design": "system-design", "ml-design": "ml-system-design", behavioral: "behavioral" };

/** Qualitative, unweighted aggregation: all Strong = positive; all Needs attention = negative; every other non-empty set = mixed. */
export function mockReviewsToInterviewEvidence(reviews: readonly MockReviewSource[]): readonly InterviewEvidenceItem[] {
  return [...reviews].sort((a, b) => a.sessionId.localeCompare(b.sessionId)).flatMap((review) => {
    if (!review.ratings.length) return [];
    const signal = review.ratings.every((rating) => rating === "Strong") ? "positive" : review.ratings.every((rating) => rating === "Needs attention") ? "negative" : "mixed";
    return [{ id: `mock-session:${review.sessionId}:self-review`, area: AREAS[review.track], provenance: "self-report", kind: "mock", signal, observedAt: review.reviewedAt, summary: "Saved mock self-review.", repeatedError: false }];
  });
}

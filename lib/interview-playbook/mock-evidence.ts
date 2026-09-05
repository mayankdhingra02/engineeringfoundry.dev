import type { InterviewEvidenceItem, InterviewPreparationArea } from "./evidence.ts";
import {
  MOCK_ASSISTANCE_STATE_LABELS,
  MOCK_PROMPT_EXPOSURE_LABELS,
  MOCK_SESSION_OUTCOME_LABELS,
  mockReviewCanInformCapability,
  type MockAssistanceState,
  type MockPromptExposure,
  type MockSessionOutcome,
} from "../mock-interviews/session-conditions.ts";
import type { MockPracticeMode } from "../../types/index.ts";

export type MockReviewRating = "Strong" | "Developing" | "Needs attention";
export type MockReviewSource = Readonly<{ sessionId: string; track: "dsa" | "system-design" | "low-level-design" | "ml-design" | "behavioral"; mode: MockPracticeMode; promptExposure: MockPromptExposure; assistanceState: MockAssistanceState; sessionOutcome: MockSessionOutcome; reviewedAt: string; ratings: readonly MockReviewRating[] }>;

const AREAS: Record<MockReviewSource["track"], InterviewPreparationArea> = { dsa: "algorithmic-coding", "system-design": "system-design", "low-level-design": "low-level-design", "ml-design": "ml-system-design", behavioral: "behavioral" };

/** Qualitative, unweighted aggregation: all Strong = positive; all Needs attention = negative; every other non-empty set = mixed. */
export function mockReviewsToInterviewEvidence(reviews: readonly MockReviewSource[]): readonly InterviewEvidenceItem[] {
  return [...reviews].sort((a, b) => a.sessionId.localeCompare(b.sessionId)).flatMap((review) => {
    if (!review.ratings.length) return [];
    const canInformCapability = mockReviewCanInformCapability(review.promptExposure, review.sessionOutcome);
    const signal = !canInformCapability ? "unknown" : review.ratings.every((rating) => rating === "Strong") ? "positive" : review.ratings.every((rating) => rating === "Needs attention") ? "negative" : "mixed";
    const evaluator = review.mode === "peer" ? "User-entered peer review; evaluator not verified." : "Saved candidate self-review.";
    const conditions = `${MOCK_PROMPT_EXPOSURE_LABELS[review.promptExposure]}; ${MOCK_ASSISTANCE_STATE_LABELS[review.assistanceState]}; ${MOCK_SESSION_OUTCOME_LABELS[review.sessionOutcome]}.`;
    const evidenceBoundary = canInformCapability ? "Qualitative self-report evidence." : "Retained for practice history; excluded from capability evidence.";
    return [{ id: `mock-session:${review.sessionId}:${review.mode === "peer" ? "peer-entered-review" : "self-review"}`, area: AREAS[review.track], provenance: "self-report", kind: "mock", signal, observedAt: review.reviewedAt, summary: `${evaluator} ${conditions} ${evidenceBoundary}`, repeatedError: false }];
  });
}

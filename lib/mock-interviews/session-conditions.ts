import type { MockPracticeMode } from "@/types";

export const MOCK_PROMPT_EXPOSURES = ["fresh", "repeated"] as const;
export type MockPromptExposure = (typeof MOCK_PROMPT_EXPOSURES)[number];

export const MOCK_TIMING_MODES = ["suggested", "extended", "untimed"] as const;
export type MockTimingMode = (typeof MOCK_TIMING_MODES)[number];

export const MOCK_HINT_POLICIES = ["none", "on-request", "guided"] as const;
export type MockHintPolicy = (typeof MOCK_HINT_POLICIES)[number];

export const MOCK_ASSISTANCE_STATES = [
  "unassisted",
  "hint-used",
  "redirection-used",
  "hint-and-redirection",
] as const;
export type MockAssistanceState = (typeof MOCK_ASSISTANCE_STATES)[number];

export const MOCK_SESSION_OUTCOMES = ["completed", "interrupted", "technical-failure"] as const;
export type MockSessionOutcome = (typeof MOCK_SESSION_OUTCOMES)[number];

export type MockSessionConditions = Readonly<{
  promptExposure: MockPromptExposure;
  timingMode: MockTimingMode;
  hintPolicy: MockHintPolicy;
}>;

export const DEFAULT_MOCK_SESSION_CONDITIONS: MockSessionConditions = {
  promptExposure: "fresh",
  timingMode: "suggested",
  hintPolicy: "on-request",
};

export const MOCK_PROMPT_EXPOSURE_LABELS: Readonly<Record<MockPromptExposure, string>> = {
  fresh: "Fresh prompt",
  repeated: "Seen before",
};

export const MOCK_TIMING_MODE_LABELS: Readonly<Record<MockTimingMode, string>> = {
  suggested: "Suggested time",
  extended: "Extended time",
  untimed: "Untimed",
};

export const MOCK_HINT_POLICY_LABELS: Readonly<Record<MockHintPolicy, string>> = {
  none: "No hints",
  "on-request": "Hints only when requested",
  guided: "Guided practice",
};

export const MOCK_ASSISTANCE_STATE_LABELS: Readonly<Record<MockAssistanceState, string>> = {
  unassisted: "No hint or redirection used",
  "hint-used": "Hint used",
  "redirection-used": "Redirection used",
  "hint-and-redirection": "Hint and redirection used",
};

export const MOCK_SESSION_OUTCOME_LABELS: Readonly<Record<MockSessionOutcome, string>> = {
  completed: "Completed as configured",
  interrupted: "Interrupted or stopped early",
  "technical-failure": "Technical or platform failure",
};

export function mockEvaluatorProvenanceLabel(mode: MockPracticeMode) {
  return mode === "solo"
    ? "Candidate self-review"
    : "User-provided peer; not matched or verified by Engineering Foundry";
}

/** Repeated or disrupted sessions remain practice records, not fresh capability evidence. */
export function mockReviewCanInformCapability(exposure: MockPromptExposure, outcome: MockSessionOutcome) {
  return exposure === "fresh" && outcome === "completed";
}

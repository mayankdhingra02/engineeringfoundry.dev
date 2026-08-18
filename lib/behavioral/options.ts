export const STORY_STATUSES = ["Draft", "Needs Work", "Ready", "Retired"] as const;
export const STORY_READINESS = ["Draft", "Needs detail", "Ready"] as const;
export const ANSWER_STATUSES = STORY_STATUSES;
export const STORY_THEMES = [
  "Leadership", "Ownership", "Conflict", "Failure", "Growth", "Ambiguity", "Influence", "Initiative",
  "Execution", "Collaboration", "Mentorship", "Technical challenge", "Technical judgment",
  "Customer", "Customer impact", "Incident response", "Cross-functional work",
] as const;

export type PreparationStatus = "Not started" | "Story linked" | "Drafted" | "Ready";

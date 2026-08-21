import type { BehavioralStory } from "@/lib/supabase/database.types";

export type StoryReadiness = "Draft" | "Needs detail" | "Ready";

type StoryContent = Pick<BehavioralStory, "situation" | "task" | "action" | "result">;

const meaningfulLength = (value: string | null | undefined) => value?.trim().length ?? 0;

export function storyReadiness(story: StoryContent): StoryReadiness {
  const lengths = {
    situation: meaningfulLength(story.situation),
    task: meaningfulLength(story.task),
    action: meaningfulLength(story.action),
    result: meaningfulLength(story.result),
  };

  if (lengths.situation >= 40 && lengths.task >= 20 && lengths.action >= 80 && lengths.result >= 40) {
    return "Ready";
  }

  const meaningfulSections = Object.values(lengths).filter((length) => length >= 20).length;
  const totalLength = [story.situation, story.task, story.action, story.result]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(" ").length;
  return meaningfulSections >= 2 || totalLength >= 80 ? "Needs detail" : "Draft";
}

/** Presentation wording only; stored completeness and planner semantics remain unchanged. */
export function storyCompletenessLabel(readiness: StoryReadiness) {
  return readiness === "Ready" ? "Content complete" : readiness;
}

/** Stored status values are retained for database compatibility; this is display-only language. */
export function behavioralContentStatusLabel(status: string) {
  if (status === "Ready") return "Content complete";
  if (status === "Needs Work") return "Needs detail";
  if (status === "Retired") return "Retired";
  return status;
}

const BEHAVIORAL_ROUND_PATTERN = /\b(behavioral|behavioural|hiring manager|bar raiser|onsite|virtual onsite)\b/i;

export function isBehavioralRoundType(roundType: string) {
  return BEHAVIORAL_ROUND_PATTERN.test(roundType.trim());
}

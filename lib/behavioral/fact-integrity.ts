import type { BehavioralStory } from "@/lib/supabase/database.types";

export type FactIntegrityFinding = {
  kind: "unsupported-metric" | "missing-source";
  message: string;
};

export type AnswerFactDraft = Pick<
  Record<"opening_framing" | "details_to_emphasize" | "details_to_avoid" | "notes" | "answer_text", string | null | undefined>,
  "opening_framing" | "details_to_emphasize" | "details_to_avoid" | "notes" | "answer_text"
>;

const NUMBER = /(?<![\w.])-?\d+(?:\.\d+)?(?:\s?%|\s?(?:ms|s|minutes?|hours?|days?|weeks?|months?|years?|people|person|engineers?|teammates?|x))?\b/gi;

function numbers(value: string) {
  return Array.from(value.matchAll(NUMBER), (match) => match[0].toLowerCase().replace(/\s+/g, ""));
}

export type FactSourceStory = Pick<BehavioralStory, "id" | "title" | "situation" | "task" | "action" | "result" | "reflection" | "short_summary">;

export function sourceStoryFacts(story: FactSourceStory) {
  return [story.situation, story.task, story.action, story.result, story.reflection, story.short_summary].filter(Boolean).join(" ");
}

/**
 * A deliberately narrow internal check. Numeric claims are deterministic to
 * compare; prose truth, ownership, and chronology still require user review.
 */
export function reviewAnswerFacts(story: FactSourceStory | undefined, draft: AnswerFactDraft): FactIntegrityFinding[] {
  if (!story) return [{ kind: "missing-source", message: "Choose a source story before saving this answer variant." }];
  const sourceNumbers = new Set(numbers(sourceStoryFacts(story)));
  const answerNumbers = new Set(numbers(Object.values(draft).filter(Boolean).join(" ")));
  const unsupported = [...answerNumbers].filter((value) => !sourceNumbers.has(value));
  return unsupported.length
    ? [{ kind: "unsupported-metric", message: `Check these numeric claims against the source story: ${unsupported.join(", ")}. Update or confirm the story first if they are factual.` }]
    : [];
}

export const FACT_INTEGRITY_PROMPTS = [
  "Is this metric present in your source story?",
  "Did your responsibility change in this version?",
  "Are you describing team impact as personal impact?",
  "Did this outcome actually happen?",
  "Would you tell the same timeline if asked twice?",
] as const;

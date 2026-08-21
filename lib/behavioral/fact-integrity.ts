import type { BehavioralStory } from "@/lib/supabase/database.types";

export type FactIntegrityFinding = {
  kind: "unsupported-numeric-claim" | "possible-new-claim" | "missing-source";
  message: string;
};

export type AnswerFactDraft = Pick<
  Record<"opening_framing" | "details_to_emphasize" | "details_to_avoid" | "notes" | "answer_text", string | null | undefined>,
  "opening_framing" | "details_to_emphasize" | "details_to_avoid" | "notes" | "answer_text"
>;

const NUMBER_OR_RATIO = /(?<![\w.])-?\d+(?:\.\d+)?(?:\s?%|\s?(?:ms|s|minutes?|hours?|days?|weeks?|months?|years?|people|person|engineers?|teammates?|x))?\b|\b(?:half|double|twice|triple|three times)\b/gi;
const TECHNOLOGY = /\b(?:AWS|Azure|GCP|Kubernetes|Docker|Kafka|Postgres(?:QL)?|MongoDB|Redis|React|TypeScript|JavaScript|Python|Java|Go|Rust|Terraform|GraphQL)\b/gi;
const CLAIM_CUES = [
  /\bI\s+(?:led|owned|decided|managed|drove|created|launched|implemented|designed|approved|rejected)\b/gi,
  /\bI\s+was\s+responsible\s+for\b/gi,
  /\b(?:increased|decreased|reduced|improved|saved|generated|grew|cut)\b[^.!?]{0,90}\b(?:latency|revenue|cost|conversion|reliability|errors?|users?|customers?|incidents?)\b/gi,
  /\b(?:last|this|next)\s+(?:year|quarter|month|week)\b/gi,
];

function claimValues(value: string, pattern: RegExp) {
  return Array.from(value.matchAll(pattern), (match) => match[0].toLowerCase().replace(/\s+/g, " "));
}

export type FactSourceStory = Pick<BehavioralStory, "id" | "title" | "situation" | "task" | "action" | "result" | "reflection" | "short_summary">;

export function sourceStoryFacts(story: FactSourceStory) {
  return [story.situation, story.task, story.action, story.result, story.reflection, story.short_summary].filter(Boolean).join(" ");
}

/**
 * Numeric and ratio claims are compared deterministically. Responsibility,
 * outcome, time, and named-technology cues are deliberately labeled as
 * possible claims: the user must confirm them against their saved source.
 */
export function reviewAnswerFacts(story: FactSourceStory | undefined, draft: AnswerFactDraft): FactIntegrityFinding[] {
  if (!story) return [{ kind: "missing-source", message: "Choose a source story before saving this answer variant." }];
  const source = sourceStoryFacts(story);
  const answer = Object.values(draft).filter(Boolean).join(" ");
  const sourceNumbers = new Set(claimValues(source, NUMBER_OR_RATIO));
  const answerNumbers = new Set(claimValues(answer, NUMBER_OR_RATIO));
  const unsupported = [...answerNumbers].filter((value) => !sourceNumbers.has(value));
  const findings: FactIntegrityFinding[] = unsupported.length
    ? [{ kind: "unsupported-numeric-claim", message: `Check these numeric or ratio claims against the source story: ${unsupported.join(", ")}. Update or confirm the story first if they are factual.` }]
    : [];

  const sourceLower = source.toLowerCase();
  const possibleCueClaims = CLAIM_CUES.flatMap((pattern) => claimValues(answer, pattern)).filter((claim) => {
    const meaningfulTerms = claim.match(/[a-z]{3,}/g) ?? [];
    return !meaningfulTerms.every((term) => sourceLower.includes(term));
  });
  const possibleClaims = [...claimValues(answer, TECHNOLOGY).filter((claim) => !sourceLower.includes(claim)), ...possibleCueClaims];
  if (possibleClaims.length) findings.push({ kind: "possible-new-claim", message: `Review these possible new factual claims against the source story: ${[...new Set(possibleClaims)].join("; ")}. This is an internal consistency prompt, not proof of truth.` });
  return findings;
}

export const FACT_INTEGRITY_PROMPTS = [
  "Is this metric present in your source story?",
  "Did your responsibility change in this version?",
  "Are you describing team impact as personal impact?",
  "Did this outcome actually happen?",
  "Would you tell the same timeline if asked twice?",
] as const;

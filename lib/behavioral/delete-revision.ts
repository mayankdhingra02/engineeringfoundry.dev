import {
  isCanonicalBehavioralAnswerRevision,
  parseCanonicalBehavioralAnswerId,
} from "./answer-action-input.ts";
import {
  isCanonicalBehavioralStoryRevision,
  parseCanonicalBehavioralStoryId,
} from "./story-action-input.ts";

export const BEHAVIORAL_STORY_DELETE_ERROR =
  "We couldn't delete this story. It may have changed or no longer be available.";
export const BEHAVIORAL_ANSWER_DELETE_ERROR =
  "We couldn't delete this answer. It may have changed or no longer be available.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type BehavioralStoryDeleteInput = Readonly<{
  storyId: string;
  expectedUpdatedAt: string;
}>;

export type BehavioralAnswerDeleteInput = Readonly<{
  questionId: string;
  answerId: string;
  expectedUpdatedAt: string;
}>;

export type BehavioralDeleteResult =
  | Readonly<{ status: "deleted"; recordId: string }>
  | Readonly<{ status: "conflict" }>
  | Readonly<{ status: "invalid" }>;

function parseDeleteActionForm(input: unknown) {
  if (typeof FormData === "undefined" || !(input instanceof FormData)) {
    return false;
  }
  for (const key of input.keys()) {
    if (!key.startsWith("$ACTION_")) return false;
  }
  return true;
}

function parseQuestionId(
  value: unknown,
  curatedQuestionIds: ReadonlySet<string>,
) {
  if (typeof value !== "string") return null;
  if (curatedQuestionIds.has(value)) return value;
  return UUID_PATTERN.test(value) ? value.toLowerCase() : null;
}

export function parseBehavioralStoryDeleteInput(
  storyIdInput: unknown,
  revisionInput: unknown,
  formInput: unknown,
): BehavioralStoryDeleteInput | null {
  const storyId = parseCanonicalBehavioralStoryId(storyIdInput);
  if (
    !storyId ||
    !isCanonicalBehavioralStoryRevision(revisionInput) ||
    !parseDeleteActionForm(formInput)
  ) {
    return null;
  }
  return { storyId, expectedUpdatedAt: revisionInput };
}

export function parseBehavioralAnswerDeleteInput(
  questionIdInput: unknown,
  answerIdInput: unknown,
  revisionInput: unknown,
  formInput: unknown,
  curatedQuestionIds: ReadonlySet<string>,
): BehavioralAnswerDeleteInput | null {
  const questionId = parseQuestionId(questionIdInput, curatedQuestionIds);
  const answerId = parseCanonicalBehavioralAnswerId(answerIdInput);
  if (
    !questionId ||
    !answerId ||
    !isCanonicalBehavioralAnswerRevision(revisionInput) ||
    !parseDeleteActionForm(formInput)
  ) {
    return null;
  }
  return { questionId, answerId, expectedUpdatedAt: revisionInput };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function parseBehavioralDeleteResult(
  value: unknown,
  idKey: "story_id" | "answer_id",
  expectedId: string,
): BehavioralDeleteResult {
  if (!Array.isArray(value)) return { status: "invalid" };
  if (value.length === 0) return { status: "conflict" };
  if (value.length !== 1 || !isPlainRecord(value[0])) {
    return { status: "invalid" };
  }
  const keys = Reflect.ownKeys(value[0]);
  const recordId = idKey === "story_id"
    ? parseCanonicalBehavioralStoryId(value[0][idKey])
    : parseCanonicalBehavioralAnswerId(value[0][idKey]);
  if (keys.length !== 1 || keys[0] !== idKey || recordId !== expectedId) {
    return { status: "invalid" };
  }
  return { status: "deleted", recordId };
}

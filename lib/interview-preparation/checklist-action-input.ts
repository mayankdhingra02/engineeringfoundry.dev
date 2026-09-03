import { ALL_CHECKLIST_IDS } from "./model.ts";

export const PREPARATION_CHECKLIST_INVALID_INPUT_ERROR =
  "This checklist change is no longer valid. Refresh and try again.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const checklistIds = new Set<string>(ALL_CHECKLIST_IDS);

export type PreparationChecklistActionInput = Readonly<{
  roundId: string;
  itemId: string;
  targetCompleted: boolean;
}>;

export type PreparationChecklistActionInputResult =
  | { ok: true; value: PreparationChecklistActionInput }
  | { ok: false };

export function normalizePreparationChecklistUuid(value: unknown): string | null {
  return typeof value === "string" && UUID_PATTERN.test(value)
    ? value.toLowerCase()
    : null;
}

export function parsePreparationChecklistActionInput(
  roundId: unknown,
  itemId: unknown,
  targetCompleted: unknown,
): PreparationChecklistActionInputResult {
  const normalizedRoundId = normalizePreparationChecklistUuid(roundId);
  if (
    normalizedRoundId === null ||
    typeof itemId !== "string" ||
    !checklistIds.has(itemId) ||
    typeof targetCompleted !== "boolean"
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      roundId: normalizedRoundId,
      itemId,
      targetCompleted,
    },
  };
}

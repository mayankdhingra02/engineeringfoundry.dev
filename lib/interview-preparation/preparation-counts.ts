import { checklistForRound } from "./model.ts";

export type PreparationCount = Readonly<{
  completed: number;
  total: number;
}>;

export type PreparationCountsStatus = "ready" | "unavailable";

export type PreparationCountsResult =
  | Readonly<{
    status: "ready";
    counts: ReadonlyMap<string, PreparationCount>;
  }>
  | Readonly<{
    status: "unavailable";
  }>;

export type PreparationCountRoundRow = Readonly<{
  id: string;
  round_type: string;
}>;

export type PreparationCountPreparationRow = Readonly<{
  round_id: string;
  completed_template_item_ids: readonly string[];
}>;

export type PreparationCountTaskRow = Readonly<{
  round_id: string;
  completed: boolean;
}>;

export type ResolvePreparationCountsInput = Readonly<{
  queryFailed: boolean;
  rounds: readonly PreparationCountRoundRow[];
  preparations: readonly PreparationCountPreparationRow[];
  tasks: readonly PreparationCountTaskRow[];
}>;

/**
 * Converts owner-scoped persistence rows into an explicit availability state.
 * Query failure wins over row contents so partial results can never masquerade
 * as genuine zero progress.
 */
export function resolvePreparationCounts(input: ResolvePreparationCountsInput): PreparationCountsResult {
  if (input.queryFailed) return { status: "unavailable" };

  const counts = new Map<string, PreparationCount>();
  for (const round of input.rounds) {
    const checklist = checklistForRound(round.round_type);
    const completedIds = new Set(
      input.preparations.find((preparation) => preparation.round_id === round.id)?.completed_template_item_ids ?? [],
    );
    const roundTasks = input.tasks.filter((task) => task.round_id === round.id);
    counts.set(round.id, {
      completed: checklist.filter((item) => completedIds.has(item.id)).length
        + roundTasks.filter((task) => task.completed).length,
      total: checklist.length + roundTasks.length,
    });
  }

  return { status: "ready", counts };
}

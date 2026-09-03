import type { PrimaryPreparationFocus } from "../account/preferences.ts";
import { PrivateDataUnavailableError } from "../persistence/errors.ts";

export const DASHBOARD_PRIVATE_DATA_DOMAIN = "dashboard";

const dashboardPreparationFocuses = new Set<PrimaryPreparationFocus>([
  "dsa",
  "system_design",
  "behavioral",
  "applications",
  "unsure",
]);

export type DashboardPrivateStartState = Readonly<{
  focus: PrimaryPreparationFocus;
  storyCount: number;
}>;

export type DashboardPrivateStartStateQueryResults = Readonly<{
  preferenceResult: Readonly<{
    data: unknown;
    error: unknown;
  }>;
  storyCountResult: Readonly<{
    count: unknown;
    error: unknown;
  }>;
}>;

function unavailable(): never {
  throw new PrivateDataUnavailableError(DASHBOARD_PRIVATE_DATA_DOMAIN);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveFocus(data: unknown): PrimaryPreparationFocus {
  if (data === null) return "unsure";
  if (!isRecord(data)) unavailable();

  if (
    Object.keys(data).length !== 1 ||
    !("primary_preparation_focus" in data)
  ) unavailable();

  const focus = data.primary_preparation_focus;
  if (focus === null) return "unsure";
  if (typeof focus !== "string" || !dashboardPreparationFocuses.has(focus as PrimaryPreparationFocus)) {
    unavailable();
  }
  return focus as PrimaryPreparationFocus;
}

/**
 * Resolves only complete, owner-scoped dashboard facts. Query failures and
 * malformed persisted values throw one fixed, non-sensitive error instead of
 * masquerading as a new account's `unsure` preference or zero story count.
 */
export function resolveDashboardPrivateStartState(input: unknown): DashboardPrivateStartState {
  if (!isRecord(input)) unavailable();
  const preferenceResult = input.preferenceResult;
  const storyCountResult = input.storyCountResult;
  if (
    !isRecord(preferenceResult) ||
    !Object.hasOwn(preferenceResult, "data") ||
    !Object.hasOwn(preferenceResult, "error") ||
    !isRecord(storyCountResult) ||
    !Object.hasOwn(storyCountResult, "count") ||
    !Object.hasOwn(storyCountResult, "error")
  ) unavailable();

  if (preferenceResult.error !== null || storyCountResult.error !== null) unavailable();
  if (!Number.isSafeInteger(storyCountResult.count) || (storyCountResult.count as number) < 0) {
    unavailable();
  }

  return {
    focus: resolveFocus(preferenceResult.data),
    storyCount: storyCountResult.count as number,
  };
}

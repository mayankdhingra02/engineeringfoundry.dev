import {
  preparationProgressVersion,
  preparationTracks,
  type LocalPreparationProgress,
  type LocalProgressItem,
  type LocalProgressStatus,
  type LocalSavedPlan,
  type PreparationTrack,
} from "./local.ts";

export const preparationImportOutcomes = ["imported", "existing", "failed"] as const;
export type PreparationImportOutcome = (typeof preparationImportOutcomes)[number];

export type PreparationImportRequest = LocalPreparationProgress;

export type PreparationImportItemResult = Readonly<{
  track: PreparationTrack;
  itemId: string;
  outcome: PreparationImportOutcome;
}>;

export type PreparationImportResponse = Readonly<{
  results: readonly PreparationImportItemResult[];
  plansRequireChoice: boolean;
}>;

export type PreparationImportReconciliation = Readonly<{
  progress: LocalPreparationProgress;
  legacySystemDesignProgress: Readonly<Record<string, unknown>> | null;
  primaryChanged: boolean;
  legacyChanged: boolean;
  changedLocallyCount: number;
}>;

export const PREPARATION_IMPORT_INVALID_MESSAGE = "Browser activity could not be read.";
export const PREPARATION_IMPORT_UNAUTHENTICATED_MESSAGE = "Sign in to import browser activity.";
export const PREPARATION_IMPORT_UNAVAILABLE_MESSAGE = "Browser activity could not be imported. Try again.";

const itemLimit = 160;
const planLimit = 2;
const maximumFutureSkewMilliseconds = 86_400_000;
const trackSet = new Set<unknown>(preparationTracks);
const statusSet = new Set<unknown>(["in-progress", "completed"] satisfies LocalProgressStatus[]);
const outcomeSet = new Set<unknown>(preparationImportOutcomes);
const allowedRequestKeys = new Set(["version", "items", "plans"]);
const allowedItemKeys = new Set(["track", "itemId", "status", "updatedAt"]);
const allowedPlanKeys = new Set(["track", "href", "label", "savedAt"]);
const allowedResponseKeys = new Set(["results", "plansRequireChoice"]);
const allowedResultKeys = new Set(["track", "itemId", "outcome"]);
const allowedErrorKeys = new Set(["error"]);
const allowedErrorMessages = new Set([
  PREPARATION_IMPORT_INVALID_MESSAGE,
  PREPARATION_IMPORT_UNAUTHENTICATED_MESSAGE,
  PREPARATION_IMPORT_UNAVAILABLE_MESSAGE,
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.size && keys.every((key) => allowed.has(key));
}

function isCanonicalItemId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9:_-]{0,199}$/.test(value);
}

function isSafeTimestamp(value: unknown, validationTime: number): value is number {
  return typeof value === "number"
    && Number.isSafeInteger(value)
    && value >= 0
    && value <= validationTime + maximumFutureSkewMilliseconds;
}

function isSafeInternalHref(value: unknown): value is string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /\s/.test(value)) return false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 31 || code === 127) return false;
  }
  return true;
}

function parseProgressItem(value: unknown, validationTime: number): LocalProgressItem | null {
  if (!isRecord(value) || !hasExactKeys(value, allowedItemKeys)) return null;
  if (!trackSet.has(value.track) || !isCanonicalItemId(value.itemId) || !statusSet.has(value.status)) return null;
  if (!isSafeTimestamp(value.updatedAt, validationTime)) return null;
  return {
    track: value.track as PreparationTrack,
    itemId: value.itemId,
    status: value.status as LocalProgressStatus,
    updatedAt: value.updatedAt,
  };
}

function parseSavedPlan(value: unknown, validationTime: number): LocalSavedPlan | null {
  if (!isRecord(value) || !hasExactKeys(value, allowedPlanKeys)) return null;
  if (value.track !== "dsa" && value.track !== "system-design") return null;
  if (!isSafeInternalHref(value.href) || typeof value.label !== "string" || value.label.length < 1 || value.label.length > 120) return null;
  if (!isSafeTimestamp(value.savedAt, validationTime)) return null;
  return {
    track: value.track,
    href: value.href,
    label: value.label,
    savedAt: value.savedAt,
  };
}

export function preparationProgressItemKey(item: Pick<LocalProgressItem, "track" | "itemId">): string {
  return `${item.track}:${item.itemId}`;
}

/** Strict network-boundary parser. Unlike browser-storage parsing, it never drops malformed rows. */
export function parsePreparationImportRequest(value: unknown, validationInstant = new Date()): PreparationImportRequest | null {
  const validationTime = validationInstant.getTime();
  if (!Number.isFinite(validationTime) || !isRecord(value) || !hasExactKeys(value, allowedRequestKeys)) return null;
  if (value.version !== preparationProgressVersion || !Array.isArray(value.items) || !Array.isArray(value.plans)) return null;
  if (value.items.length > itemLimit || value.plans.length > planLimit) return null;

  const items: LocalProgressItem[] = [];
  const itemKeys = new Set<string>();
  for (const valueItem of value.items) {
    const item = parseProgressItem(valueItem, validationTime);
    if (!item) return null;
    const key = preparationProgressItemKey(item);
    if (itemKeys.has(key)) return null;
    itemKeys.add(key);
    items.push(item);
  }

  const plans: LocalSavedPlan[] = [];
  const planTracks = new Set<LocalSavedPlan["track"]>();
  for (const valuePlan of value.plans) {
    const plan = parseSavedPlan(valuePlan, validationTime);
    if (!plan || planTracks.has(plan.track)) return null;
    planTracks.add(plan.track);
    plans.push(plan);
  }

  return { version: preparationProgressVersion, items, plans };
}

/** Accepts only a complete, one-result-per-submitted-item server response. */
export function parsePreparationImportResponse(
  value: unknown,
  submitted: PreparationImportRequest,
): PreparationImportResponse | null {
  if (!isRecord(value) || !hasExactKeys(value, allowedResponseKeys)) return null;
  if (!Array.isArray(value.results) || typeof value.plansRequireChoice !== "boolean") return null;
  if (value.results.length !== submitted.items.length || value.plansRequireChoice !== (submitted.plans.length > 0)) return null;

  const submittedByKey = new Map(submitted.items.map((item) => [preparationProgressItemKey(item), item]));
  const resultsByKey = new Map<string, PreparationImportItemResult>();
  for (const valueResult of value.results) {
    if (!isRecord(valueResult) || !hasExactKeys(valueResult, allowedResultKeys)) return null;
    if (!trackSet.has(valueResult.track) || !isCanonicalItemId(valueResult.itemId) || !outcomeSet.has(valueResult.outcome)) return null;
    const result: PreparationImportItemResult = {
      track: valueResult.track as PreparationTrack,
      itemId: valueResult.itemId,
      outcome: valueResult.outcome as PreparationImportOutcome,
    };
    const key = preparationProgressItemKey(result);
    if (!submittedByKey.has(key) || resultsByKey.has(key)) return null;
    resultsByKey.set(key, result);
  }

  return {
    results: submitted.items.map((item) => resultsByKey.get(preparationProgressItemKey(item))!),
    plansRequireChoice: value.plansRequireChoice,
  };
}

export function parsePreparationImportError(value: unknown): string | null {
  if (!isRecord(value) || !hasExactKeys(value, allowedErrorKeys)) return null;
  return typeof value.error === "string" && allowedErrorMessages.has(value.error) ? value.error : null;
}

function sameProgressItem(left: LocalProgressItem, right: LocalProgressItem): boolean {
  return left.track === right.track
    && left.itemId === right.itemId
    && left.status === right.status
    && left.updatedAt === right.updatedAt;
}

function legacyProgressItem(storageKey: string, status: unknown): LocalProgressItem | null {
  const separator = storageKey.indexOf(":");
  if (separator <= 0 || (status !== "in-progress" && status !== "completed")) return null;
  const itemId = storageKey.slice(separator + 1);
  if (!isCanonicalItemId(itemId)) return null;
  return { track: "system-design", itemId, status, updatedAt: 0 };
}

/**
 * Removes only account-confirmed rows whose current browser value still
 * exactly matches the submitted snapshot. Concurrent edits and unrelated
 * browser state are returned unchanged.
 */
export function reconcilePreparationImport(
  submitted: PreparationImportRequest,
  response: PreparationImportResponse,
  currentProgress: LocalPreparationProgress,
  currentLegacySystemDesignProgress: unknown,
): PreparationImportReconciliation {
  const submittedByKey = new Map(submitted.items.map((item) => [preparationProgressItemKey(item), item]));
  const confirmedKeys = new Set(
    response.results
      .filter((result) => result.outcome === "imported" || result.outcome === "existing")
      .map(preparationProgressItemKey),
  );
  const changedLocallyKeys = new Set<string>();

  const nextItems = currentProgress.items.filter((currentItem) => {
    const key = preparationProgressItemKey(currentItem);
    if (!confirmedKeys.has(key)) return true;
    const submittedItem = submittedByKey.get(key);
    if (!submittedItem) return true;
    if (sameProgressItem(currentItem, submittedItem)) return false;
    changedLocallyKeys.add(key);
    return true;
  });
  const primaryChanged = nextItems.length !== currentProgress.items.length;

  let legacyChanged = false;
  let legacySystemDesignProgress: Readonly<Record<string, unknown>> | null = null;
  if (isRecord(currentLegacySystemDesignProgress)) {
    const nextLegacyEntries: [string, unknown][] = [];
    for (const [storageKey, status] of Object.entries(currentLegacySystemDesignProgress)) {
      const currentItem = legacyProgressItem(storageKey, status);
      const key = currentItem ? preparationProgressItemKey(currentItem) : null;
      const submittedItem = key ? submittedByKey.get(key) : undefined;
      if (key && confirmedKeys.has(key) && submittedItem) {
        if (sameProgressItem(currentItem!, submittedItem)) {
          legacyChanged = true;
          continue;
        }
        changedLocallyKeys.add(key);
      }
      nextLegacyEntries.push([storageKey, status]);
    }
    legacySystemDesignProgress = Object.fromEntries(nextLegacyEntries);
  }

  return {
    progress: primaryChanged ? { ...currentProgress, items: nextItems } : currentProgress,
    legacySystemDesignProgress,
    primaryChanged,
    legacyChanged,
    changedLocallyCount: changedLocallyKeys.size,
  };
}

function countOutcomes(response: PreparationImportResponse, outcome: PreparationImportOutcome): number {
  return response.results.filter((result) => result.outcome === outcome).length;
}

export function preparationImportStatusMessage(
  response: PreparationImportResponse,
  options: Readonly<{ changedLocallyCount: number; localReconciliationFailed: boolean }>,
): string {
  const imported = countOutcomes(response, "imported");
  const existing = countOutcomes(response, "existing");
  const failed = countOutcomes(response, "failed");
  const parts: string[] = [];

  if (imported > 0) parts.push(`${imported} ${imported === 1 ? "activity was" : "activities were"} imported.`);
  if (existing > 0) parts.push(`${existing} ${existing === 1 ? "activity was" : "activities were"} already in your account.`);
  if (failed > 0) parts.push(`${failed} ${failed === 1 ? "activity could not be imported and remains" : "activities could not be imported and remain"} in this browser.`);
  if (options.changedLocallyCount > 0) parts.push(`${options.changedLocallyCount} ${options.changedLocallyCount === 1 ? "activity changed in this browser during the import and remains" : "activities changed in this browser during the import and remain"} here.`);
  if (options.localReconciliationFailed) parts.push("Account results were confirmed, but browser activity could not be fully cleared. Remaining activity can be retried.");
  if (response.plansRequireChoice) parts.push("Saved plans remain in this browser until you choose one on its plan page.");
  if (parts.length === 0) return "No browser activity needed importing.";
  return parts.join(" ");
}

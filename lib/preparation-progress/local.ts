export const preparationProgressStorageKey = "engineering-foundry-preparation-progress-v1";
export const preparationProgressEvent = "engineering-foundry-preparation-progress";
export const preparationProgressVersion = 1;

export const preparationTracks = ["dsa", "system-design", "ml-design", "behavioral"] as const;
export type PreparationTrack = (typeof preparationTracks)[number];
export type LocalProgressStatus = "in-progress" | "completed";

export type LocalProgressItem = {
  track: PreparationTrack;
  itemId: string;
  status: LocalProgressStatus;
  updatedAt: number;
};

export type LocalSavedPlan = {
  track: "dsa" | "system-design";
  href: string;
  label: string;
  savedAt: number;
};

export type LocalPreparationProgress = {
  version: typeof preparationProgressVersion;
  items: LocalProgressItem[];
  plans: LocalSavedPlan[];
};

const itemLimit = 160;
const planLimit = 2;
const trackSet = new Set<string>(preparationTracks);
const statusSet = new Set<LocalProgressStatus>(["in-progress", "completed"]);
const safeTimestamp = (value: unknown) =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= Date.now() + 86_400_000
    ? value
    : null;

function isCanonicalId(value: unknown) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9:_-]{0,199}$/.test(value);
}

function isSafeInternalHref(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
}

export const emptyLocalPreparationProgress = (): LocalPreparationProgress => ({
  version: preparationProgressVersion,
  items: [],
  plans: [],
});

/**
 * Browser storage is untrusted and optional. Invalid rows are ignored, never
 * thrown into a public learning page, and cannot carry private text.
 */
export function parseLocalPreparationProgress(value: unknown): LocalPreparationProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyLocalPreparationProgress();
  const record = value as Record<string, unknown>;
  if (record.version !== preparationProgressVersion) return emptyLocalPreparationProgress();

  const itemsByKey = new Map<string, LocalProgressItem>();
  if (Array.isArray(record.items)) {
    for (const raw of record.items.slice(0, itemLimit)) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const item = raw as Record<string, unknown>;
      if (!trackSet.has(String(item.track)) || !isCanonicalId(item.itemId) || !statusSet.has(item.status as LocalProgressStatus)) continue;
      const updatedAt = safeTimestamp(item.updatedAt);
      if (updatedAt === null) continue;
      const normalized: LocalProgressItem = { track: item.track as PreparationTrack, itemId: item.itemId as string, status: item.status as LocalProgressStatus, updatedAt };
      const key = `${normalized.track}:${normalized.itemId}`;
      const existing = itemsByKey.get(key);
      if (!existing || existing.updatedAt <= normalized.updatedAt) itemsByKey.set(key, normalized);
    }
  }

  const plansByTrack = new Map<LocalSavedPlan["track"], LocalSavedPlan>();
  if (Array.isArray(record.plans)) {
    for (const raw of record.plans.slice(0, planLimit)) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const plan = raw as Record<string, unknown>;
      if ((plan.track !== "dsa" && plan.track !== "system-design") || !isSafeInternalHref(plan.href) || typeof plan.label !== "string" || plan.label.length < 1 || plan.label.length > 120) continue;
      const savedAt = safeTimestamp(plan.savedAt);
      if (savedAt === null) continue;
      const normalized: LocalSavedPlan = { track: plan.track, href: plan.href as string, label: plan.label, savedAt };
      const existing = plansByTrack.get(normalized.track);
      if (!existing || existing.savedAt <= normalized.savedAt) plansByTrack.set(normalized.track, normalized);
    }
  }

  return {
    version: preparationProgressVersion,
    items: [...itemsByKey.values()].sort((left, right) => right.updatedAt - left.updatedAt || left.track.localeCompare(right.track) || left.itemId.localeCompare(right.itemId)),
    plans: [...plansByTrack.values()].sort((left, right) => right.savedAt - left.savedAt || left.track.localeCompare(right.track)),
  };
}

export function readLocalPreparationProgress(storage: Pick<Storage, "getItem">): LocalPreparationProgress {
  try {
    const raw = storage.getItem(preparationProgressStorageKey);
    return parseLocalPreparationProgress(raw ? JSON.parse(raw) : null);
  } catch {
    return emptyLocalPreparationProgress();
  }
}

export function writeLocalPreparationProgress(storage: Pick<Storage, "setItem">, progress: LocalPreparationProgress) {
  storage.setItem(preparationProgressStorageKey, JSON.stringify(progress));
}

export function recordLocalProgress(
  progress: LocalPreparationProgress,
  item: Omit<LocalProgressItem, "updatedAt"> & { updatedAt?: number },
): LocalPreparationProgress {
  const parsed = parseLocalPreparationProgress({ ...progress, items: [...progress.items, { ...item, updatedAt: item.updatedAt ?? Date.now() }] });
  return parsed;
}

export function saveLocalPlan(
  progress: LocalPreparationProgress,
  plan: Omit<LocalSavedPlan, "savedAt"> & { savedAt?: number },
): LocalPreparationProgress {
  return parseLocalPreparationProgress({ ...progress, plans: [...progress.plans.filter((item) => item.track !== plan.track), { ...plan, savedAt: plan.savedAt ?? Date.now() }] });
}

export function removeLocalProgressItems(progress: LocalPreparationProgress, keys: readonly string[]): LocalPreparationProgress {
  const removed = new Set(keys);
  return parseLocalPreparationProgress({
    ...progress,
    items: progress.items.filter((item) => !removed.has(`${item.track}:${item.itemId}`)),
  });
}

/** A quiet seven-day activity count, never a streak or readiness signal. */
export function preparationActivityDaysThisWeek(items: readonly Pick<LocalProgressItem, "updatedAt">[], now = Date.now()): number {
  const today = new Date(now);
  const firstDay = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - 6 * 86_400_000;
  const days = new Set<string>();
  for (const item of items) {
    if (item.updatedAt < firstDay || item.updatedAt > now + 86_400_000) continue;
    days.add(new Date(item.updatedAt).toISOString().slice(0, 10));
  }
  return days.size;
}

/** Converts the shipped pre-P0.2 System Design map without inventing recency. */
export function migrateLegacySystemDesignProgress(value: unknown): LocalProgressItem[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const items: LocalProgressItem[] = [];
  for (const [key, status] of Object.entries(value as Record<string, unknown>)) {
    const separator = key.indexOf(":");
    if (separator <= 0 || (status !== "in-progress" && status !== "completed")) continue;
    const itemId = key.slice(separator + 1);
    if (!isCanonicalId(itemId)) continue;
    items.push({ track: "system-design", itemId, status, updatedAt: 0 });
  }
  return items.slice(0, itemLimit);
}

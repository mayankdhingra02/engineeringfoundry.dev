import type { LocalPreparationProgress, PreparationTrack } from "./local";

export type ContinuationSource = "account" | "local";
export type ContinuationTrack = PreparationTrack | "interview";
export type ContinuationKind = "upcoming-interview" | "active-plan" | "in-progress" | "next" | "recent";

export type PreparationContinuation = {
  track: ContinuationTrack;
  title: string;
  href: string;
  context: string;
  source: ContinuationSource;
  kind: ContinuationKind;
  updatedAt: number;
};

export type AccountPreparationContinuationState =
  | {
    status: "anonymous";
    authenticated: false;
    candidates: [];
    weeklyActivityDays: 0;
  }
  | {
    status: "ready";
    authenticated: true;
    candidates: PreparationContinuation[];
    weeklyActivityDays: number;
  }
  | {
    status: "unavailable";
    candidates: [];
    weeklyActivityDays: 0;
  };

export type AccountPreparationContinuationResolution = {
  authenticated: boolean;
  queryFailed: boolean;
  candidates: readonly PreparationContinuation[];
  weeklyActivityDays: number;
};

export type ContinuationCatalogItem = { id: string; title: string; href: string };
export type ContinuationCatalog = Readonly<Record<PreparationTrack, readonly ContinuationCatalogItem[]>>;

const kindPriority: Record<ContinuationKind, number> = {
  "upcoming-interview": 0,
  "active-plan": 1,
  "in-progress": 2,
  next: 3,
  recent: 4,
};

const continuationTracks = new Set<ContinuationTrack>(["dsa", "system-design", "ml-design", "behavioral", "interview"]);
const continuationKinds = new Set<ContinuationKind>(["upcoming-interview", "active-plan", "in-progress", "next", "recent"]);
const candidateKeys = ["track", "title", "href", "context", "source", "kind", "updatedAt"] as const;
const authenticatedStateKeys = ["status", "authenticated", "candidates", "weeklyActivityDays"] as const;
const unavailableStateKeys = ["status", "candidates", "weeklyActivityDays"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function containsControlCharacter(value: string) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });
}

function isNonemptyDisplayText(value: unknown): value is string {
  return typeof value === "string"
    && value.length > 0
    && value.trim() === value
    && !containsControlCharacter(value);
}

function isSafeInternalHref(value: unknown): value is string {
  return typeof value === "string"
    && value.startsWith("/")
    && !value.startsWith("//")
    && !/[\\\s]/.test(value)
    && !containsControlCharacter(value);
}

function normalizeAccountCandidate(value: unknown): PreparationContinuation | null {
  if (!isRecord(value) || !hasExactKeys(value, candidateKeys)) return null;
  if (typeof value.track !== "string" || !continuationTracks.has(value.track as ContinuationTrack)) return null;
  if (!isNonemptyDisplayText(value.title) || !isSafeInternalHref(value.href) || !isNonemptyDisplayText(value.context)) return null;
  if (value.source !== "account") return null;
  if (typeof value.kind !== "string" || !continuationKinds.has(value.kind as ContinuationKind)) return null;
  if (typeof value.updatedAt !== "number" || !Number.isFinite(value.updatedAt) || value.updatedAt < 0) return null;

  return {
    track: value.track as ContinuationTrack,
    title: value.title,
    href: value.href,
    context: value.context,
    source: "account",
    kind: value.kind as ContinuationKind,
    updatedAt: value.updatedAt,
  };
}

export function createUnavailableAccountPreparationContinuationState(): AccountPreparationContinuationState {
  return { status: "unavailable", candidates: [], weeklyActivityDays: 0 };
}

/**
 * Converts an untrusted API payload into the client-safe continuation state.
 * Malformed or internally inconsistent payloads return null so callers can
 * fail closed to an unavailable transport state rather than anonymous state.
 */
export function normalizeAccountPreparationContinuationResponse(
  value: unknown,
): AccountPreparationContinuationState | null {
  if (!isRecord(value) || !Array.isArray(value.candidates)) return null;

  if (value.status === "unavailable") {
    return hasExactKeys(value, unavailableStateKeys)
      && value.candidates.length === 0
      && value.weeklyActivityDays === 0
      ? createUnavailableAccountPreparationContinuationState()
      : null;
  }

  if (value.status === "anonymous") {
    return hasExactKeys(value, authenticatedStateKeys)
      && value.authenticated === false
      && value.candidates.length === 0
      && value.weeklyActivityDays === 0
      ? { status: "anonymous", authenticated: false, candidates: [], weeklyActivityDays: 0 }
      : null;
  }

  if (value.status !== "ready" || !hasExactKeys(value, authenticatedStateKeys) || value.authenticated !== true) return null;
  if (typeof value.weeklyActivityDays !== "number" || !Number.isInteger(value.weeklyActivityDays) || value.weeklyActivityDays < 0 || value.weeklyActivityDays > 7) return null;
  const candidates = value.candidates.map(normalizeAccountCandidate);
  if (candidates.some((candidate) => candidate === null)) return null;

  return {
    status: "ready",
    authenticated: true,
    candidates: candidates as PreparationContinuation[],
    weeklyActivityDays: value.weeklyActivityDays,
  };
}

/** Resolves trusted account-query outcomes through the same client-safe schema. */
export function resolveAccountPreparationContinuationState(
  input: AccountPreparationContinuationResolution,
): AccountPreparationContinuationState {
  if (input.queryFailed) return createUnavailableAccountPreparationContinuationState();
  if (!input.authenticated) return { status: "anonymous", authenticated: false, candidates: [], weeklyActivityDays: 0 };

  const normalized = normalizeAccountPreparationContinuationResponse({
    status: "ready",
    authenticated: true,
    candidates: input.candidates,
    weeklyActivityDays: input.weeklyActivityDays,
  });
  return normalized?.status === "ready" ? normalized : createUnavailableAccountPreparationContinuationState();
}

export function choosePreparationContinuation(
  accountCandidates: readonly PreparationContinuation[],
  localCandidates: readonly PreparationContinuation[],
): PreparationContinuation | null {
  const candidates = [...accountCandidates, ...localCandidates];
  if (!candidates.length) return null;
  return candidates.sort((left, right) =>
    (left.source === right.source ? 0 : left.source === "account" ? -1 : 1)
      || kindPriority[left.kind] - kindPriority[right.kind]
      || right.updatedAt - left.updatedAt
      || left.track.localeCompare(right.track)
      || left.href.localeCompare(right.href),
  )[0] ?? null;
}

export function localContinuationCandidates(
  progress: LocalPreparationProgress,
  catalog: ContinuationCatalog,
): PreparationContinuation[] {
  const candidates: PreparationContinuation[] = [];

  for (const plan of progress.plans) {
    candidates.push({
      track: plan.track,
      title: `Continue ${plan.label}`,
      href: plan.href,
      context: "Saved in this browser.",
      source: "local",
      kind: "active-plan",
      updatedAt: plan.savedAt,
    });
  }

  for (const track of ["dsa", "system-design", "ml-design", "behavioral"] as const) {
    const items = progress.items.filter((item) => item.track === track);
    const inProgress = items.find((item) => item.status === "in-progress");
    const catalogItems = catalog[track];
    if (inProgress) {
      const current = catalogItems.find((item) => item.id === inProgress.itemId);
      if (current) candidates.push({ track, title: current.title, href: current.href, context: "In progress in this browser.", source: "local", kind: "in-progress", updatedAt: inProgress.updatedAt });
      continue;
    }

    const completed = items.filter((item) => item.status === "completed");
    if (!completed.length) continue;
    const latest = completed[0]!;
    const lastIndex = catalogItems.findIndex((item) => item.id === latest.itemId);
    const next = catalogItems.slice(lastIndex + 1).find((item) => !completed.some((completedItem) => completedItem.itemId === item.id))
      ?? catalogItems.find((item) => !completed.some((completedItem) => completedItem.itemId === item.id));
    const target = next ?? catalogItems[lastIndex];
    if (target) candidates.push({
      track,
      title: next ? `Next: ${target.title}` : `Revisit ${target.title}`,
      href: target.href,
      context: `${completed.length} recorded ${completed.length === 1 ? "activity" : "activities"} in this browser.`,
      source: "local",
      kind: next ? "next" : "recent",
      updatedAt: latest.updatedAt,
    });
  }

  return candidates;
}

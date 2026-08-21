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

export type ContinuationCatalogItem = { id: string; title: string; href: string };
export type ContinuationCatalog = Readonly<Record<PreparationTrack, readonly ContinuationCatalogItem[]>>;

const kindPriority: Record<ContinuationKind, number> = {
  "upcoming-interview": 0,
  "active-plan": 1,
  "in-progress": 2,
  next: 3,
  recent: 4,
};

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

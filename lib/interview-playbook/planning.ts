/**
 * Pure, deterministic adaptive planning-strategy engine for the Interview
 * Playbook.
 *
 * This module consumes an `InterviewDiagnosticSnapshot` (from
 * `./diagnostic.ts`) plus a set of planning targets and decides WHAT to work
 * on and in WHAT ORDER — never exact clock times, never fabricated task
 * durations, and never a numeric score. It never reinterprets or mutates
 * `evidenceState`: confidence, preparation coverage, repeated errors,
 * priorities, and constraints are read to choose an action, but the
 * evidence-state algorithm itself remains the sole property of
 * `./evidence.ts` and `./diagnostic.ts`.
 *
 * There is no `overallReadiness`, score, weighted score, percentage,
 * probability, pass prediction, or hiring prediction anywhere in this
 * module. Ordering uses explicit, comparator-based precedence — never an
 * opaque weighted formula.
 *
 * Pure and dependency-light: no React, Next.js, Supabase, auth, database,
 * queries, overview/timing/round-resolver/dossier/next-action imports,
 * network, storage, current time, or randomness. May import only
 * `./diagnostic.ts` and `./evidence.ts`. The caller supplies normalized
 * `daysUntil` for every planning target — this engine never instantiates
 * the Date constructor or reads the system clock; `./timing.ts` remains the
 * sole owner of date/time interpretation.
 */
import {
  INTERVIEW_PREPARATION_AREAS,
  type InterviewPreparationArea,
} from "./evidence.ts";
import type {
  InterviewDiagnosticConstraint,
  InterviewDiagnosticDimension,
  InterviewDiagnosticSnapshot,
} from "./diagnostic.ts";

export const INTERVIEW_PLAN_HORIZON_BANDS = [
  "one-day",
  "three-day",
  "seven-day",
  "thirty-day",
  "sixty-day",
  "ninety-day",
  "long-range",
  "unscheduled",
] as const;

export type InterviewPlanHorizonBand = (typeof INTERVIEW_PLAN_HORIZON_BANDS)[number];

export type InterviewPlanningTarget = Readonly<{
  id: string;
  daysUntil: number | null;
  areas: readonly InterviewPreparationArea[];
  needsSignalClarification: boolean;
}>;

export const INTERVIEW_PLAN_ACTION_KINDS = [
  "choose-scope",
  "clarify-target",
  "complete-coverage",
  "baseline-check",
  "learn",
  "worked-example",
  "targeted-repair",
  "practice",
  "review",
  "mock",
  "taper",
  "rest",
] as const;

export type InterviewPlanActionKind = (typeof INTERVIEW_PLAN_ACTION_KINDS)[number];

export const INTERVIEW_PLAN_ACTION_STAGES = ["now", "next", "later", "final-phase"] as const;

export type InterviewPlanActionStage = (typeof INTERVIEW_PLAN_ACTION_STAGES)[number];

export const INTERVIEW_PLAN_ACTION_REASONS = [
  "scope-not-selected",
  "target-needs-clarification",
  "coverage-not-started",
  "coverage-partial",
  "repeated-error",
  "negative-observed-evidence",
  "mixed-observed-evidence",
  "low-confidence-without-observed-evidence",
  "insufficient-observed-evidence",
  "supported-maintenance",
  "integrated-rehearsal",
  "explicit-priority",
  "shared-across-targets",
  "scheduled-target-taper",
  "scheduled-target-rest",
] as const;

export type InterviewPlanActionReason = (typeof INTERVIEW_PLAN_ACTION_REASONS)[number];

export type InterviewPlanAction = Readonly<{
  kind: InterviewPlanActionKind;
  stage: InterviewPlanActionStage;
  area: InterviewPreparationArea | null;
  targetIds: readonly string[];
  reasons: readonly InterviewPlanActionReason[];
}>;

export const INTERVIEW_PLAN_DEFERRAL_REASONS = [
  "zero-capacity",
  "supported-lower-need-under-urgent-horizon",
  "explicit-priority-outside-urgent-target",
] as const;

export type InterviewPlanDeferralReason = (typeof INTERVIEW_PLAN_DEFERRAL_REASONS)[number];

export type InterviewPlanDeferral = Readonly<{
  area: InterviewPreparationArea;
  reason: InterviewPlanDeferralReason;
  targetIds: readonly string[];
}>;

export const INTERVIEW_PLAN_WARNINGS = [
  "target-needs-clarification",
  "expired-target-ignored",
  "no-explicit-scope",
  "no-available-capacity",
] as const;

export type InterviewPlanWarning = (typeof INTERVIEW_PLAN_WARNINGS)[number];

export type InterviewAdaptivePlan = Readonly<{
  horizonBand: InterviewPlanHorizonBand;
  earliestDaysUntil: number | null;
  availableHoursPerWeek: number | null;
  constraints: readonly InterviewDiagnosticConstraint[];
  actions: readonly InterviewPlanAction[];
  deferred: readonly InterviewPlanDeferral[];
  warnings: readonly InterviewPlanWarning[];
}>;

export type BuildAdaptiveInterviewPlanInput = Readonly<{
  diagnostic: InterviewDiagnosticSnapshot;
  targets: readonly InterviewPlanningTarget[];
}>;

/**
 * `daysUntil <= 0` bands to `one-day`; fractional positive values round
 * upward (a 1.5-day target is treated as a 2-day target) so the boundary
 * crossing is deterministic in one direction only. `null`/non-finite values
 * (including `NaN`/`±Infinity`) are `unscheduled`.
 */
export function resolveInterviewPlanHorizonBand(daysUntil: number | null): InterviewPlanHorizonBand {
  if (daysUntil === null || !Number.isFinite(daysUntil)) return "unscheduled";
  const days = daysUntil <= 0 ? 0 : Math.ceil(daysUntil);
  if (days <= 1) return "one-day";
  if (days <= 3) return "three-day";
  if (days <= 7) return "seven-day";
  if (days <= 30) return "thirty-day";
  if (days <= 60) return "sixty-day";
  if (days <= 90) return "ninety-day";
  return "long-range";
}

type NormalizedDaysUntil =
  | Readonly<{ kind: "unscheduled" }>
  | Readonly<{ kind: "expired" }>
  | Readonly<{ kind: "scheduled"; days: number }>;

/** null/NaN/±Infinity -> unscheduled; negative finite -> expired; 0 -> 0; positive -> Math.ceil. Never mutates. */
function normalizeTargetDaysUntil(daysUntil: number | null): NormalizedDaysUntil {
  if (daysUntil === null || !Number.isFinite(daysUntil)) return { kind: "unscheduled" };
  if (daysUntil < 0) return { kind: "expired" };
  return { kind: "scheduled", days: daysUntil === 0 ? 0 : Math.ceil(daysUntil) };
}

type ClassifiedTarget = Readonly<{
  target: InterviewPlanningTarget;
  normalized: NormalizedDaysUntil;
  isExpired: boolean;
  needsClarification: boolean;
  resolvedAreas: readonly InterviewPreparationArea[];
}>;

function classifyTarget(target: InterviewPlanningTarget): ClassifiedTarget {
  const normalized = normalizeTargetDaysUntil(target.daysUntil);
  const needsClarification = target.needsSignalClarification === true || target.areas.length === 0;
  const resolvedAreas = needsClarification ? [] : dedupeAreas(target.areas);
  return {
    target,
    normalized,
    isExpired: normalized.kind === "expired",
    needsClarification,
    resolvedAreas,
  };
}

function dedupeAreas(areas: readonly InterviewPreparationArea[]): readonly InterviewPreparationArea[] {
  const seen = new Set<InterviewPreparationArea>();
  const result: InterviewPreparationArea[] = [];
  for (const area of areas) {
    if (seen.has(area)) continue;
    seen.add(area);
    result.push(area);
  }
  return result;
}

/**
 * First-occurrence dedupe for the `targetIds` attached to a shared AREA
 * action or deferral. This only collapses repeated ID strings — it never
 * deduplicates target *objects*, since two distinct target records that
 * happen to share an id would need a separate caller-validation contract to
 * reconcile conflicting metadata.
 */
function dedupeTargetIds(targetIds: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of targetIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

function makeAction(
  kind: InterviewPlanActionKind,
  stage: InterviewPlanActionStage,
  area: InterviewPreparationArea | null,
  targetIds: readonly string[],
  reasons: readonly InterviewPlanActionReason[],
): InterviewPlanAction {
  return { kind, stage, area, targetIds, reasons };
}

function addReasonOnce(
  reasons: readonly InterviewPlanActionReason[],
  reason: InterviewPlanActionReason,
): readonly InterviewPlanActionReason[] {
  return reasons.includes(reason) ? reasons : [...reasons, reason];
}

type PlanningNeed = "repair" | "resolve-mixed" | "establish-evidence" | "maintain";

/** Repeated errors change planning priority; they never mutate `evidenceState`. */
function resolvePlanningNeed(dimension: InterviewDiagnosticDimension): PlanningNeed {
  if (dimension.hasRepeatedError || dimension.evidenceState === "needs-repair") return "repair";
  if (dimension.evidenceState === "mixed-evidence") return "resolve-mixed";
  if (dimension.evidenceState === "unknown" || dimension.evidenceState === "self-reported-only") return "establish-evidence";
  return "maintain";
}

const PLANNING_NEED_ORDER: Readonly<Record<PlanningNeed, number>> = {
  repair: 0,
  "resolve-mixed": 1,
  "establish-evidence": 2,
  maintain: 3,
};

const ACTION_KIND_ORDER: Readonly<Record<InterviewPlanActionKind, number>> = {
  "targeted-repair": 0,
  "complete-coverage": 1,
  learn: 2,
  "baseline-check": 3,
  "worked-example": 4,
  practice: 5,
  review: 6,
  "choose-scope": 7,
  "clarify-target": 7,
  mock: 7,
  taper: 7,
  rest: 8,
};

const STAGE_ORDER: Readonly<Record<InterviewPlanActionStage, number>> = {
  now: 0,
  next: 1,
  later: 2,
  "final-phase": 3,
};

const URGENT_HORIZON_BANDS: ReadonlySet<InterviewPlanHorizonBand> = new Set(["one-day", "three-day", "seven-day"]);
const OVERALL_URGENT_HORIZON_BANDS: ReadonlySet<InterviewPlanHorizonBand> = new Set(["one-day", "three-day"]);
const GENEROUS_LEARNING_HORIZON_BANDS: ReadonlySet<InterviewPlanHorizonBand> = new Set([
  "seven-day",
  "thirty-day",
  "sixty-day",
  "ninety-day",
  "long-range",
  "unscheduled",
]);

function compareNullableAscending(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

type AreaPlan = {
  area: InterviewPreparationArea;
  dimension: InterviewDiagnosticDimension;
  targetIds: readonly string[];
  earliestRelevantDaysUntil: number | null;
  areaHorizonBand: InterviewPlanHorizonBand;
  planningNeed: PlanningNeed;
  priorityIndex: number | null;
  canonicalIndex: number;
};

function comparePriorityIndex(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function compareAreaPlans(a: AreaPlan, b: AreaPlan): number {
  return (
    compareNullableAscending(a.earliestRelevantDaysUntil, b.earliestRelevantDaysUntil) ||
    PLANNING_NEED_ORDER[a.planningNeed] - PLANNING_NEED_ORDER[b.planningNeed] ||
    comparePriorityIndex(a.priorityIndex, b.priorityIndex) ||
    b.targetIds.length - a.targetIds.length ||
    a.canonicalIndex - b.canonicalIndex
  );
}

/** Generates the WHAT for one non-zero-capacity area; the caller applies shared/priority tagging and ordering. */
function generateAreaActions(
  areaPlan: AreaPlan,
  hasHigherNeedAreaInScope: boolean,
  planHorizonBand: InterviewPlanHorizonBand,
): Readonly<{ actions: readonly InterviewPlanAction[]; deferral: InterviewPlanDeferral | null }> {
  const { area, dimension, targetIds, areaHorizonBand, planningNeed } = areaPlan;
  const isBehavioralOrProjectDeepDive = area === "behavioral" || area === "project-deep-dive";
  const coverageGap = dimension.preparationCoverage === "not-started" || dimension.preparationCoverage === "partial";
  const coverageReason: InterviewPlanActionReason =
    dimension.preparationCoverage === "not-started" ? "coverage-not-started" : "coverage-partial";
  const actions: InterviewPlanAction[] = [];

  if (planningNeed === "repair") {
    const reasons: InterviewPlanActionReason[] = [];
    if (dimension.hasRepeatedError) reasons.push("repeated-error");
    if (dimension.evidenceState === "needs-repair") reasons.push("negative-observed-evidence");
    actions.push(makeAction("targeted-repair", "now", area, targetIds, reasons));
    if (areaHorizonBand === "one-day") {
      actions.push(makeAction("review", "next", area, targetIds, []));
    } else if (areaHorizonBand === "three-day") {
      actions.push(makeAction("practice", "next", area, targetIds, []));
    } else {
      actions.push(makeAction("worked-example", "next", area, targetIds, []));
      actions.push(makeAction("practice", "later", area, targetIds, []));
    }
    if (isBehavioralOrProjectDeepDive && coverageGap) {
      actions.push(makeAction("complete-coverage", "next", area, targetIds, [coverageReason]));
    }
    return { actions, deferral: null };
  }

  if (planningNeed === "resolve-mixed") {
    actions.push(makeAction("targeted-repair", "now", area, targetIds, ["mixed-observed-evidence"]));
    if (areaHorizonBand === "one-day") {
      actions.push(makeAction("review", "next", area, targetIds, []));
    } else {
      actions.push(makeAction("practice", "next", area, targetIds, []));
      if (areaHorizonBand !== "three-day") {
        actions.push(makeAction("review", "later", area, targetIds, []));
      }
    }
    if (isBehavioralOrProjectDeepDive && coverageGap) {
      actions.push(makeAction("complete-coverage", "next", area, targetIds, [coverageReason]));
    }
    return { actions, deferral: null };
  }

  if (planningNeed === "establish-evidence") {
    if (isBehavioralOrProjectDeepDive) {
      if (coverageGap) {
        actions.push(makeAction("complete-coverage", "now", area, targetIds, [coverageReason]));
        actions.push(makeAction("baseline-check", "next", area, targetIds, []));
      } else {
        actions.push(makeAction("baseline-check", "now", area, targetIds, []));
      }
      return { actions, deferral: null };
    }

    const confidence = dimension.selfReportedConfidence;
    const generousHorizon = GENEROUS_LEARNING_HORIZON_BANDS.has(areaHorizonBand);
    if (confidence === "low" && generousHorizon) {
      actions.push(makeAction("learn", "now", area, targetIds, ["low-confidence-without-observed-evidence"]));
      actions.push(makeAction("worked-example", "next", area, targetIds, []));
      actions.push(makeAction("practice", "later", area, targetIds, []));
    } else {
      actions.push(makeAction("baseline-check", "now", area, targetIds, ["insufficient-observed-evidence"]));
    }
    return { actions, deferral: null };
  }

  // planningNeed === "maintain"
  const overallUrgent = OVERALL_URGENT_HORIZON_BANDS.has(planHorizonBand);
  if (overallUrgent && hasHigherNeedAreaInScope) {
    return {
      actions: [],
      deferral: { area, reason: "supported-lower-need-under-urgent-horizon", targetIds },
    };
  }
  const reviewStage: InterviewPlanActionStage =
    areaHorizonBand === "one-day" ? "now" : areaHorizonBand === "three-day" ? "next" : "later";
  actions.push(makeAction("review", reviewStage, area, targetIds, ["supported-maintenance"]));
  // Preparation coverage is independent of demonstrated evidence: a supported
  // area can still have an incomplete story/project bank, and that gap does
  // not disappear just because the area is otherwise being maintained.
  if (isBehavioralOrProjectDeepDive && coverageGap) {
    actions.push(makeAction("complete-coverage", "next", area, targetIds, [coverageReason]));
  }
  return { actions, deferral: null };
}

type StagedItem = Readonly<{
  action: InterviewPlanAction;
  stageRank: number;
  categoryRank: number;
  primarySubRank: number;
  secondarySubRank: number;
}>;

function compareStagedItems(a: StagedItem, b: StagedItem): number {
  return (
    a.stageRank - b.stageRank ||
    a.categoryRank - b.categoryRank ||
    a.primarySubRank - b.primarySubRank ||
    a.secondarySubRank - b.secondarySubRank
  );
}

export function buildAdaptiveInterviewPlan(input: BuildAdaptiveInterviewPlanInput): InterviewAdaptivePlan {
  const { diagnostic, targets } = input;

  const warningOrder: InterviewPlanWarning[] = [];
  const addWarning = (warning: InterviewPlanWarning) => {
    if (!warningOrder.includes(warning)) warningOrder.push(warning);
  };

  const classified = targets.map(classifyTarget);
  for (const entry of classified) {
    if (entry.isExpired) addWarning("expired-target-ignored");
  }
  const nonExpired = classified.filter((entry) => !entry.isExpired);

  const scheduledDays = nonExpired
    .filter((entry) => entry.normalized.kind === "scheduled")
    .map((entry) => (entry.normalized as { kind: "scheduled"; days: number }).days);
  const earliestDaysUntil = scheduledDays.length ? Math.min(...scheduledDays) : null;
  const planHorizonBand = resolveInterviewPlanHorizonBand(earliestDaysUntil);

  const clarificationTargets = nonExpired.filter((entry) => entry.needsClarification);
  const resolvedTargets = nonExpired.filter((entry) => !entry.needsClarification);
  if (clarificationTargets.length > 0) addWarning("target-needs-clarification");

  const targetRelevantAreas = new Set<InterviewPreparationArea>();
  for (const entry of resolvedTargets) {
    for (const area of entry.resolvedAreas) targetRelevantAreas.add(area);
  }

  const scopeAreas = new Set<InterviewPreparationArea>();
  const priorityDeferrals: InterviewPlanDeferral[] = [];

  if (targetRelevantAreas.size > 0) {
    for (const area of targetRelevantAreas) scopeAreas.add(area);
    const urgent = URGENT_HORIZON_BANDS.has(planHorizonBand);
    for (const area of diagnostic.priorities) {
      if (targetRelevantAreas.has(area)) continue;
      if (urgent) {
        priorityDeferrals.push({ area, reason: "explicit-priority-outside-urgent-target", targetIds: [] });
      } else {
        scopeAreas.add(area);
      }
    }
  } else {
    for (const area of diagnostic.priorities) scopeAreas.add(area);
  }

  const globalActions: StagedItem[] = [];
  let targetSubRank = 0;

  if (targetRelevantAreas.size === 0 && diagnostic.priorities.length === 0) {
    addWarning("no-explicit-scope");
    globalActions.push({
      action: makeAction("choose-scope", "now", null, [], ["scope-not-selected"]),
      stageRank: STAGE_ORDER.now,
      categoryRank: 0,
      primarySubRank: -1,
      secondarySubRank: 0,
    });
  }

  for (const entry of clarificationTargets) {
    globalActions.push({
      action: makeAction("clarify-target", "now", null, [entry.target.id], ["target-needs-clarification"]),
      stageRank: STAGE_ORDER.now,
      categoryRank: 0,
      primarySubRank: targetSubRank++,
      secondarySubRank: 0,
    });
  }

  const dimensionByArea = new Map<InterviewPreparationArea, InterviewDiagnosticDimension>(
    diagnostic.dimensions.map((dimension) => [dimension.area, dimension]),
  );
  const canonicalIndexByArea = new Map<InterviewPreparationArea, number>(
    INTERVIEW_PREPARATION_AREAS.map((area, index) => [area, index]),
  );
  const priorityIndexByArea = new Map<InterviewPreparationArea, number>(
    diagnostic.priorities.map((area, index) => [area, index]),
  );

  const zeroCapacity = diagnostic.availableHoursPerWeek === 0;
  if (zeroCapacity) addWarning("no-available-capacity");

  const staged: StagedItem[] = [...globalActions];
  const deferred: InterviewPlanDeferral[] = [...priorityDeferrals];
  const deferredAreas = new Set(priorityDeferrals.map((deferral) => deferral.area));

  if (zeroCapacity) {
    for (const area of scopeAreas) {
      if (deferredAreas.has(area)) continue;
      const targetIds = dedupeTargetIds(
        resolvedTargets.filter((entry) => entry.resolvedAreas.includes(area)).map((entry) => entry.target.id),
      );
      deferred.push({ area, reason: "zero-capacity", targetIds });
      deferredAreas.add(area);
    }
  } else {
    const areaPlans: AreaPlan[] = [...scopeAreas].map((area) => {
      const dimension = dimensionByArea.get(area) as InterviewDiagnosticDimension;
      const owningTargets = resolvedTargets.filter((entry) => entry.resolvedAreas.includes(area));
      const targetIds = dedupeTargetIds(owningTargets.map((entry) => entry.target.id));
      const relevantDays = owningTargets
        .map((entry) => entry.normalized)
        .filter((normalized): normalized is { kind: "scheduled"; days: number } => normalized.kind === "scheduled")
        .map((normalized) => normalized.days);
      const earliestRelevantDaysUntil = relevantDays.length ? Math.min(...relevantDays) : null;
      return {
        area,
        dimension,
        targetIds,
        earliestRelevantDaysUntil,
        areaHorizonBand: resolveInterviewPlanHorizonBand(earliestRelevantDaysUntil),
        planningNeed: resolvePlanningNeed(dimension),
        priorityIndex: priorityIndexByArea.get(area) ?? null,
        canonicalIndex: canonicalIndexByArea.get(area) ?? INTERVIEW_PREPARATION_AREAS.length,
      };
    });

    const sortedAreaPlans = [...areaPlans].sort(compareAreaPlans);
    const hasHigherNeedAreaInScope = areaPlans.some((plan) => plan.planningNeed !== "maintain");

    sortedAreaPlans.forEach((areaPlan, areaOrderIndex) => {
      const { actions: rawActions, deferral } = generateAreaActions(areaPlan, hasHigherNeedAreaInScope, planHorizonBand);
      if (deferral) {
        if (!deferredAreas.has(deferral.area)) {
          deferred.push(deferral);
          deferredAreas.add(deferral.area);
        }
        return;
      }

      const isShared = areaPlan.targetIds.length > 1;
      const isExplicitPriority = areaPlan.priorityIndex !== null;

      for (const action of rawActions) {
        let reasons = action.reasons;
        if (isShared) reasons = addReasonOnce(reasons, "shared-across-targets");
        if (isExplicitPriority) reasons = addReasonOnce(reasons, "explicit-priority");
        staged.push({
          action: { ...action, reasons },
          stageRank: STAGE_ORDER[action.stage],
          categoryRank: 1,
          primarySubRank: areaOrderIndex,
          secondarySubRank: ACTION_KIND_ORDER[action.kind],
        });
      }
    });

    for (const entry of resolvedTargets) {
      if (entry.normalized.kind !== "scheduled") continue;
      const targetHorizonBand = resolveInterviewPlanHorizonBand(entry.normalized.days);
      if (targetHorizonBand === "one-day") continue;

      if (targetHorizonBand === "three-day") {
        const hasRepairOrMixed = entry.resolvedAreas.some((area) => {
          const plan = areaPlans.find((candidate) => candidate.area === area);
          return plan && (plan.planningNeed === "repair" || plan.planningNeed === "resolve-mixed");
        });
        if (hasRepairOrMixed) continue;
        staged.push({
          action: makeAction("mock", "next", null, [entry.target.id], ["integrated-rehearsal"]),
          stageRank: STAGE_ORDER.next,
          categoryRank: 2,
          primarySubRank: targetSubRank++,
          secondarySubRank: 0,
        });
        continue;
      }

      staged.push({
        action: makeAction("mock", "later", null, [entry.target.id], ["integrated-rehearsal"]),
        stageRank: STAGE_ORDER.later,
        categoryRank: 2,
        primarySubRank: targetSubRank++,
        secondarySubRank: 0,
      });
    }
  }

  for (const entry of nonExpired) {
    if (entry.normalized.kind !== "scheduled") continue;
    staged.push({
      action: makeAction("taper", "final-phase", null, [entry.target.id], ["scheduled-target-taper"]),
      stageRank: STAGE_ORDER["final-phase"],
      categoryRank: 3,
      primarySubRank: targetSubRank++,
      secondarySubRank: 0,
    });
    staged.push({
      action: makeAction("rest", "final-phase", null, [entry.target.id], ["scheduled-target-rest"]),
      stageRank: STAGE_ORDER["final-phase"],
      categoryRank: 4,
      primarySubRank: targetSubRank++,
      secondarySubRank: 0,
    });
  }

  const actions = [...staged].sort(compareStagedItems).map((item) => item.action);

  return {
    horizonBand: planHorizonBand,
    earliestDaysUntil,
    availableHoursPerWeek: diagnostic.availableHoursPerWeek,
    constraints: [...diagnostic.constraints],
    actions,
    deferred,
    warnings: warningOrder,
  };
}

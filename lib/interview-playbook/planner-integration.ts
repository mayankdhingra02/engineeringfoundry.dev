/**
 * Phase 3A: pure, deterministic projection that connects REAL active
 * interview-round context to the merged adaptive planning engine.
 *
 * This module only converts already-resolved round signals
 * (`executionGuideSlugs`, `needsSignalClarification`, scheduling) into
 * `InterviewPlanningTarget`s and runs them through an intentionally NEUTRAL
 * diagnostic — it never infers evidence, confidence, available hours, or
 * preparation coverage from checklist completion, saved DSA/System Design
 * progress, Behavioral story content, or any other existing product
 * surface. Those inputs remain unowned until a later slice explicitly
 * collects them. The strategy this produces describes round-context and
 * horizon adaptivity only, never demonstrated performance.
 *
 * Pure and dependency-light: no React, Next.js, Supabase, auth, database,
 * `queries.ts`, network, storage, current time, or randomness. May import
 * only `./overview.ts`, `./timing.ts`, `./evidence.ts`, `./diagnostic.ts`,
 * and `./planning.ts`.
 */
import type { InterviewPlaybookOverviewBase, InterviewPlaybookRoundSummary } from "./overview.ts";
import { resolveInterviewPlaybookTiming } from "./timing.ts";
import { INTERVIEW_PREPARATION_AREAS, type InterviewPreparationArea } from "./evidence.ts";
import { buildInterviewDiagnosticSnapshot } from "./diagnostic.ts";
import {
  buildAdaptiveInterviewPlan,
  type InterviewAdaptivePlan,
  type InterviewPlanAction,
  type InterviewPlanActionKind,
  type InterviewPlanActionStage,
  type InterviewPlanDeferral,
  type InterviewPlanHorizonBand,
  type InterviewPlanningTarget,
} from "./planning.ts";

export const INTERVIEW_PLAYBOOK_PLANNING_SOURCE_MODE = "round-context-only" as const;

/** Presentation-safe round metadata only — never notes or other private round content. */
export type InterviewPlaybookPlanningRoundMetadata = Readonly<{
  roundId: string;
  applicationId: string;
  companyName: string;
  roleTitle: string;
  roundName: string;
  roundType: string;
  scheduledAt: string | null;
  timezone: string | null;
  preparationHref: string;
}>;

export type BuildInterviewPlaybookPlanningProjectionInput = Readonly<{
  overview: Pick<InterviewPlaybookOverviewBase, "upcomingRounds" | "unscheduledRounds">;
  now: Date;
}>;

export type InterviewPlaybookPresentedPlanAction = Readonly<{
  kind: InterviewPlanActionKind;
  stage: InterviewPlanActionStage;
  area: InterviewPreparationArea | null;
  title: string;
  description: string;
  href: string | null;
  targetIds: readonly string[];
}>;

export type InterviewPlaybookPresentedDeferral = Readonly<{
  area: InterviewPreparationArea;
  title: string;
  description: string;
}>;

export type InterviewPlaybookPlanningProjection = Readonly<{
  sourceMode: "round-context-only";
  horizonBand: InterviewPlanHorizonBand;
  earliestDaysUntil: number | null;
  targetCount: number;
  actions: readonly InterviewPlaybookPresentedPlanAction[];
  hiddenActionCount: number;
  hiddenFinalPhaseActionCount: number;
  deferred: readonly InterviewPlaybookPresentedDeferral[];
  hiddenDeferralCount: number;
}>;

const INTERVIEW_PREPARATION_AREA_SET: ReadonlySet<string> = new Set(INTERVIEW_PREPARATION_AREAS);

function isInterviewPreparationArea(slug: string): slug is InterviewPreparationArea {
  return INTERVIEW_PREPARATION_AREA_SET.has(slug);
}

/** Filters and deduplicates already-resolved execution-guide slugs against the canonical nine areas — never a second area list. */
function canonicalAreasFromExecutionGuideSlugs(slugs: readonly string[]): readonly InterviewPreparationArea[] {
  const seen = new Set<InterviewPreparationArea>();
  const result: InterviewPreparationArea[] = [];
  for (const slug of slugs) {
    if (!isInterviewPreparationArea(slug)) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);
    result.push(slug);
  }
  return result;
}

/**
 * A round with zero canonical areas and no clarification need is not a
 * nine-area adaptive-planning candidate (e.g. a resolved Recruiter Screen or
 * Hiring Manager round) — it is excluded here rather than becoming a
 * misleading `clarify-target`.
 */
function isAdaptivePlanningCandidate(canonicalAreas: readonly InterviewPreparationArea[], needsSignalClarification: boolean): boolean {
  return canonicalAreas.length > 0 || needsSignalClarification;
}

function buildTargetForUpcomingRound(round: InterviewPlaybookRoundSummary, now: Date): InterviewPlanningTarget | null {
  const canonicalAreas = canonicalAreasFromExecutionGuideSlugs(round.executionGuideSlugs);
  if (!isAdaptivePlanningCandidate(canonicalAreas, round.needsSignalClarification)) return null;
  const timing = resolveInterviewPlaybookTiming({ scheduledAt: round.scheduledAt, timezone: round.timezone, now });
  return {
    id: round.id,
    daysUntil: timing.calendarDaysUntil,
    areas: canonicalAreas,
    needsSignalClarification: round.needsSignalClarification,
  };
}

function buildTargetForUnscheduledRound(round: InterviewPlaybookRoundSummary): InterviewPlanningTarget | null {
  const canonicalAreas = canonicalAreasFromExecutionGuideSlugs(round.executionGuideSlugs);
  if (!isAdaptivePlanningCandidate(canonicalAreas, round.needsSignalClarification)) return null;
  return {
    id: round.id,
    daysUntil: null,
    areas: canonicalAreas,
    needsSignalClarification: round.needsSignalClarification,
  };
}

/**
 * Upcoming rounds first, then unscheduled — matching the existing Playbook
 * queue order. Overdue rounds are never read here; they remain owned by the
 * existing "Needs a status update" surface.
 */
export function buildInterviewPlaybookPlanningTargets(
  overview: Pick<InterviewPlaybookOverviewBase, "upcomingRounds" | "unscheduledRounds">,
  now: Date,
): readonly InterviewPlanningTarget[] {
  const targets: InterviewPlanningTarget[] = [];
  for (const round of overview.upcomingRounds) {
    const target = buildTargetForUpcomingRound(round, now);
    if (target) targets.push(target);
  }
  for (const round of overview.unscheduledRounds) {
    const target = buildTargetForUnscheduledRound(round);
    if (target) targets.push(target);
  }
  return targets;
}

function buildRoundMetadataMap(
  overview: Pick<InterviewPlaybookOverviewBase, "upcomingRounds" | "unscheduledRounds">,
): ReadonlyMap<string, InterviewPlaybookPlanningRoundMetadata> {
  const map = new Map<string, InterviewPlaybookPlanningRoundMetadata>();
  for (const round of [...overview.upcomingRounds, ...overview.unscheduledRounds]) {
    map.set(round.id, {
      roundId: round.id,
      applicationId: round.applicationId,
      companyName: round.companyName,
      roleTitle: round.roleTitle,
      roundName: round.roundName,
      roundType: round.roundType,
      scheduledAt: round.scheduledAt,
      timezone: round.timezone,
      preparationHref: round.preparationHref,
    });
  }
  return map;
}

/**
 * The single intentionally-neutral diagnostic for Phase 3A: every dimension
 * of self-report, coverage, and evidence is `unknown`/empty. No existing
 * product surface (checklist completion, saved DSA/System Design progress,
 * Behavioral story content, application or round outcome) is read here.
 */
function buildNeutralDiagnostic() {
  return buildInterviewDiagnosticSnapshot({
    availableHoursPerWeek: null,
    confidenceByArea: {},
    constraints: [],
    priorities: [],
    evidence: [],
    coverage: { behavioralStories: "unknown", projectDeepDive: "unknown" },
  });
}

const AREA_DISPLAY_LABELS: Readonly<Record<InterviewPreparationArea, string>> = {
  "algorithmic-coding": "Algorithmic coding",
  "practical-coding": "Practical coding",
  debugging: "Debugging",
  "code-review": "Code review",
  "low-level-design": "Low-level design",
  "system-design": "System design",
  "ml-system-design": "ML system design",
  behavioral: "Behavioral",
  "project-deep-dive": "Project deep dive",
};

const AREA_HREF_OVERRIDES: Partial<Record<InterviewPreparationArea, string>> = {
  "algorithmic-coding": "/dsa",
  "system-design": "/system-design",
  "ml-system-design": "/ml-design",
  behavioral: "/behavioral/workspace",
};

/** Falls back to the generic execution-guide route for areas without a dedicated learning surface. */
function areaHref(area: InterviewPreparationArea): string {
  return AREA_HREF_OVERRIDES[area] ?? `/interview-tips/rounds/${area}`;
}

/**
 * `taper`/`rest` never reach this function — final-phase actions are
 * filtered out before presentation, since the existing final-preparation
 * panel already owns that user-facing surface.
 */
function actionTitle(action: InterviewPlanAction): string {
  const areaLabel = action.area ? AREA_DISPLAY_LABELS[action.area] : "";
  switch (action.kind) {
    case "choose-scope":
      return "Choose a preparation focus";
    case "clarify-target":
      return "Confirm the round focus";
    case "complete-coverage":
      return `Complete ${areaLabel} preparation coverage`;
    case "baseline-check":
      return `Run a ${areaLabel} baseline check`;
    case "learn":
      return `Learn the missing ${areaLabel} foundation`;
    case "worked-example":
      return `Work through a ${areaLabel} example`;
    case "targeted-repair":
      return `Repair the known ${areaLabel} gap`;
    case "practice":
      return `Practice ${areaLabel} deliberately`;
    case "review":
      return `Review ${areaLabel}`;
    case "mock":
      return "Run an integrated mock interview";
    case "taper":
    case "rest":
      return "";
  }
}

function actionDescription(action: InterviewPlanAction): string {
  switch (action.kind) {
    case "choose-scope":
      return "Select which preparation areas this planning view should cover.";
    case "clarify-target":
      return "Confirm what this round evaluates before assigning specialist preparation.";
    case "complete-coverage":
      return "Close the remaining preparation-material gap without treating coverage as performance.";
    case "baseline-check":
      return "Establish current evidence before deciding whether to learn, repair, or maintain.";
    case "learn":
      return "Build the missing foundation before attempting deliberate practice.";
    case "worked-example":
      return "Walk through a complete worked example before independent practice.";
    case "targeted-repair":
      return "Address an already identified execution problem before adding broader practice.";
    case "practice":
      return "Practice this area deliberately before the next review.";
    case "review":
      return "Maintain already supported evidence without reopening broad curriculum.";
    case "mock":
      return "Use one integrated rehearsal after the higher-priority preparation work.";
    case "taper":
    case "rest":
      return "";
  }
}

function actionHref(
  action: InterviewPlanAction,
  roundMetadata: ReadonlyMap<string, InterviewPlaybookPlanningRoundMetadata>,
): string | null {
  switch (action.kind) {
    case "choose-scope":
      return "/prepare";
    case "clarify-target": {
      const firstTargetId = action.targetIds[0];
      if (!firstTargetId) return null;
      const metadata = roundMetadata.get(firstTargetId);
      if (!metadata) return null;
      return `/applications/${metadata.applicationId}/rounds/${metadata.roundId}/edit`;
    }
    case "mock":
      return "/mock-interviews";
    case "complete-coverage":
    case "baseline-check":
    case "learn":
    case "worked-example":
    case "targeted-repair":
    case "practice":
    case "review":
      return action.area ? areaHref(action.area) : null;
    case "taper":
    case "rest":
      return null;
  }
}

function presentAction(
  action: InterviewPlanAction,
  roundMetadata: ReadonlyMap<string, InterviewPlaybookPlanningRoundMetadata>,
): InterviewPlaybookPresentedPlanAction {
  return {
    kind: action.kind,
    stage: action.stage,
    area: action.area,
    title: actionTitle(action),
    description: actionDescription(action),
    href: actionHref(action, roundMetadata),
    targetIds: action.targetIds,
  };
}

function deferralTitle(deferral: InterviewPlanDeferral): string {
  const areaLabel = AREA_DISPLAY_LABELS[deferral.area];
  switch (deferral.reason) {
    case "supported-lower-need-under-urgent-horizon":
      return `${areaLabel} deferred for now`;
    case "explicit-priority-outside-urgent-target":
      return `${areaLabel} kept outside the urgent target`;
    case "zero-capacity":
      return `${areaLabel} deferred`;
  }
}

function deferralDescription(deferral: InterviewPlanDeferral): string {
  switch (deferral.reason) {
    case "supported-lower-need-under-urgent-horizon":
      return "A nearer higher-need area takes precedence under the current interview horizon.";
    case "explicit-priority-outside-urgent-target":
      return "The current short-horizon round does not require this area, so it is not expanding the plan.";
    case "zero-capacity":
      return "No preparation capacity is available in the diagnostic.";
  }
}

function presentDeferral(deferral: InterviewPlanDeferral): InterviewPlaybookPresentedDeferral {
  return {
    area: deferral.area,
    title: deferralTitle(deferral),
    description: deferralDescription(deferral),
  };
}

const MAX_VISIBLE_ACTIONS = 6;
const MAX_VISIBLE_DEFERRALS = 2;

export type InterviewPlaybookPlanPresentation = Readonly<{
  actions: readonly InterviewPlaybookPresentedPlanAction[];
  hiddenActionCount: number;
  hiddenFinalPhaseActionCount: number;
  deferred: readonly InterviewPlaybookPresentedDeferral[];
  hiddenDeferralCount: number;
}>;

/**
 * Converts a raw `InterviewAdaptivePlan` into presentation-safe output:
 * `final-phase` (taper/rest) actions are dropped — the existing
 * final-preparation panel already owns that surface — and the remaining
 * `now`/`next`/`later` actions and deferrals are capped for a low-overwhelm
 * private view, preserving planner order. Exported separately from
 * `buildInterviewPlaybookPlanningProjection` so this presentation step can
 * be exercised directly (for example, to prove an action whose target id
 * has no matching round metadata safely resolves to `href: null` instead
 * of fabricating an application link).
 */
export function presentInterviewAdaptivePlan(
  plan: InterviewAdaptivePlan,
  roundMetadata: ReadonlyMap<string, InterviewPlaybookPlanningRoundMetadata>,
): InterviewPlaybookPlanPresentation {
  const visibleActions = plan.actions.filter((action) => action.stage !== "final-phase");
  const hiddenFinalPhaseActionCount = plan.actions.length - visibleActions.length;

  const presentedActions = visibleActions.slice(0, MAX_VISIBLE_ACTIONS).map((action) => presentAction(action, roundMetadata));
  const hiddenActionCount = Math.max(0, visibleActions.length - MAX_VISIBLE_ACTIONS);

  const presentedDeferrals = plan.deferred.slice(0, MAX_VISIBLE_DEFERRALS).map(presentDeferral);
  const hiddenDeferralCount = Math.max(0, plan.deferred.length - MAX_VISIBLE_DEFERRALS);

  return {
    actions: presentedActions,
    hiddenActionCount,
    hiddenFinalPhaseActionCount,
    deferred: presentedDeferrals,
    hiddenDeferralCount,
  };
}

/**
 * Returns `null` when no round currently qualifies for nine-area adaptive
 * planning (e.g. an active process containing only a Recruiter Screen) —
 * the existing dominant action and queue remain sufficient on their own,
 * and this Phase 3A surface never calls the planner with an empty target
 * list merely to produce a generic `choose-scope` action.
 */
export function buildInterviewPlaybookPlanningProjection(
  input: BuildInterviewPlaybookPlanningProjectionInput,
): InterviewPlaybookPlanningProjection | null {
  const targets = buildInterviewPlaybookPlanningTargets(input.overview, input.now);
  if (targets.length === 0) return null;

  const roundMetadata = buildRoundMetadataMap(input.overview);
  const diagnostic = buildNeutralDiagnostic();
  const plan = buildAdaptiveInterviewPlan({ diagnostic, targets });
  const presentation = presentInterviewAdaptivePlan(plan, roundMetadata);

  return {
    sourceMode: INTERVIEW_PLAYBOOK_PLANNING_SOURCE_MODE,
    horizonBand: plan.horizonBand,
    earliestDaysUntil: plan.earliestDaysUntil,
    targetCount: targets.length,
    ...presentation,
  };
}

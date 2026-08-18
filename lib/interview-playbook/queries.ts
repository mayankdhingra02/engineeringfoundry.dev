import "server-only";

import { isActiveApplication, isActiveInterviewProcess } from "@/lib/applications/insights";
import { UPCOMING_ROUND_STATUSES } from "@/lib/applications/options";
import { getApplications, type ApplicationWithRounds } from "@/lib/applications/queries";
import { resolveRoundPreparationContext } from "@/lib/interview-preparation/model";
import { chooseRoundPreparationNextAction } from "@/lib/interview-preparation/next-action";
import { getInterviewPreparationHub, getPreparationCounts } from "@/lib/interview-preparation/queries";
import {
  buildInterviewPlaybookOverview,
  type InterviewPlaybookApplicationInput,
  type InterviewPlaybookOverviewBase,
  type InterviewPlaybookPreparationCount,
  type InterviewPlaybookPrimaryRoundReason,
  type InterviewPlaybookRoundInput,
  type InterviewPlaybookRoundSummary,
} from "./overview";

export type InterviewPlaybookPrimaryAction = Readonly<{
  href: string;
  label: string;
  roundId: string;
  applicationId: string;
  reason: InterviewPlaybookPrimaryRoundReason;
}>;

export type InterviewPlaybookOverview = InterviewPlaybookOverviewBase &
  Readonly<{
    primaryAction: InterviewPlaybookPrimaryAction | null;
  }>;

type ApplicationRoundRow = ApplicationWithRounds["interview_rounds"][number];

const UPCOMING_ROUND_STATUS_SET: readonly string[] = UPCOMING_ROUND_STATUSES;

function toRoundInput(round: ApplicationRoundRow, applicationId: string): InterviewPlaybookRoundInput {
  // Resolved exactly once per round from the canonical taxonomy; every
  // downstream field (modules, clarification, execution guides) is derived
  // from this single call rather than re-resolving the round label.
  const roundContext = resolveRoundPreparationContext(round.round_type);
  return {
    id: round.id,
    applicationId,
    roundNumber: round.round_number,
    roundName: round.round_name,
    roundType: round.round_type,
    scheduledAt: round.scheduled_at,
    // getApplications() intentionally selects a summary embed of
    // interview_rounds that does not include duration_minutes. The Playbook
    // overview does not need it to classify or select a primary round, and a
    // second direct table read solely for this display field would duplicate
    // the applications product rather than reuse it.
    durationMinutes: null,
    timezone: round.timezone,
    status: round.status,
    result: round.result,
    active: UPCOMING_ROUND_STATUS_SET.includes(round.status),
    modules: roundContext.modules,
    needsSignalClarification: roundContext.needsSignalClarification,
    clarificationPrompt: roundContext.clarificationPrompt,
    executionGuideSlugs: roundContext.executionGuideSlugs,
  };
}

function toApplicationInput(application: ApplicationWithRounds): InterviewPlaybookApplicationInput {
  return {
    id: application.id,
    companyName: application.company_name,
    companySlug: application.company_slug,
    roleTitle: application.role_title,
    roleLevel: application.role_level,
    status: application.status,
    updatedAt: application.updated_at,
    open: isActiveApplication(application.status),
    interviewProcessActive: isActiveInterviewProcess({
      status: application.status,
      interview_rounds: application.interview_rounds.map((round) => ({ status: round.status })),
    }),
    rounds: application.interview_rounds.map((round) => toRoundInput(round, application.id)),
  };
}

/** Normalizes getPreparationCounts' Map into the overview's checklist-progress-only shape. */
function toPreparationCounts(
  counts: Map<string, { completed: number; total: number }>,
): ReadonlyMap<string, InterviewPlaybookPreparationCount> {
  return counts;
}

export async function getInterviewPlaybookOverview(now = new Date()): Promise<InterviewPlaybookOverview> {
  // Step 1: owner-scoped applications and their rounds. getApplications()
  // resolves the authenticated actor and enforces ownership itself; this
  // module never derives ownership on its own and accepts no user identifier.
  const applications = (await getApplications()).map(toApplicationInput);

  // Step 2: a pure shell build with no preparation-count data yet, purely to
  // learn which round is primary before deciding what else to fetch.
  const shellOverview = buildInterviewPlaybookOverview({
    applications,
    preparationCounts: new Map(),
    now,
  });
  const primaryRound = shellOverview.primaryRound;

  // Step 3: bounded secondary reads. At most one getPreparationCounts call
  // (batched across every round at once) and at most one
  // getInterviewPreparationHub call (for the single primary round only).
  const roundIds = applications.flatMap((application) => application.rounds.map((round) => round.id));
  const [preparationCountsResult, primaryHub] = await Promise.all([
    roundIds.length ? getPreparationCounts(roundIds) : Promise.resolve(new Map<string, { completed: number; total: number }>()),
    primaryRound ? getInterviewPreparationHub(primaryRound.id) : Promise.resolve(null),
  ]);

  // Step 4/5: rebuild with real checklist-progress counts. Selection is
  // deterministic given the same applications/now, so the primary round
  // chosen here matches the shell build.
  const finalOverview = buildInterviewPlaybookOverview({
    applications,
    preparationCounts: toPreparationCounts(preparationCountsResult),
    now,
  });

  // Step 6: the detailed action always comes from the existing selector, never
  // recomputed here. If the primary round was deleted concurrently, the hub
  // lookup returns null and no primary action is fabricated.
  const primaryAction = buildPrimaryAction(finalOverview.primaryRound, finalOverview.primaryRoundReason, primaryHub);

  return { ...finalOverview, primaryAction };
}

function buildPrimaryAction(
  primaryRound: InterviewPlaybookRoundSummary | null,
  primaryRoundReason: InterviewPlaybookPrimaryRoundReason | null,
  primaryHub: Awaited<ReturnType<typeof getInterviewPreparationHub>>,
): InterviewPlaybookPrimaryAction | null {
  if (!primaryRound || !primaryRoundReason || !primaryHub) return null;

  // Only the fields chooseRoundPreparationNextAction needs are read from the
  // hub. Private notes, story/answer content, reflections, interviewer and
  // meeting details, and custom task titles are never touched here.
  const firstDsa = primaryHub.dsa?.recommendations[0]?.question ?? null;
  const firstAttempt = primaryHub.systemDesign?.attempts[0] ?? null;
  const firstConcept = primaryHub.systemDesign?.concepts[0] ?? null;

  const action = chooseRoundPreparationNextAction({
    applicationId: primaryRound.applicationId,
    dsaQuestion: firstDsa ? { id: firstDsa.id, title: firstDsa.title } : null,
    systemDesignAttempt: firstAttempt ? { id: firstAttempt.id, problemId: firstAttempt.problem_id, title: firstAttempt.title } : null,
    behavioralAvailable: Boolean(primaryHub.behavioral),
    systemDesignConcept: firstConcept ? { href: firstConcept.href, title: firstConcept.title } : null,
  });

  return {
    href: action.href,
    label: action.label,
    roundId: primaryRound.id,
    applicationId: primaryRound.applicationId,
    reason: primaryRoundReason,
  };
}

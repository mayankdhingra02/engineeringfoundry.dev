import "server-only";

import { isActiveApplication, isActiveInterviewProcess } from "@/lib/applications/insights";
import { UPCOMING_ROUND_STATUSES } from "@/lib/applications/options";
import { getApplications, type ApplicationWithRounds } from "@/lib/applications/queries";
import { resolveRoundPreparationContext } from "@/lib/interview-preparation/model";
import { chooseRoundPreparationNextAction } from "@/lib/interview-preparation/next-action";
import type { PreparationCount, PreparationCountsStatus } from "@/lib/interview-preparation/preparation-counts";
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
    preparationCountsStatus: PreparationCountsStatus;
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

/** Normalizes ready preparation counts into the overview's checklist-progress-only shape. */
function toPreparationCounts(
  counts: ReadonlyMap<string, PreparationCount>,
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
    getPreparationCounts(roundIds),
    primaryRound ? getInterviewPreparationHub(primaryRound.id) : Promise.resolve(null),
  ]);

  // Step 4/5: only ready persistence data is fed into the overview. When the
  // protected read is unavailable, retain the shell selected solely from the
  // application/round data rather than converting the failure into zeros.
  const finalOverview = preparationCountsResult.status === "ready"
    ? buildInterviewPlaybookOverview({
      applications,
      preparationCounts: toPreparationCounts(preparationCountsResult.counts),
      now,
    })
    : shellOverview;

  // Step 6: the detailed action always comes from the existing selector, never
  // recomputed here. If the primary round was deleted concurrently, the hub
  // lookup returns null and no primary action is fabricated.
  const primaryAction = buildPrimaryAction(shellOverview.primaryRound, shellOverview.primaryRoundReason, primaryHub);

  return { ...finalOverview, primaryAction, preparationCountsStatus: preparationCountsResult.status };
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

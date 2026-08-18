/**
 * Pure, deterministic model for the cross-application Interview Playbook
 * overview. No Supabase, no auth, no implicit clock, no network, no React or
 * Next.js. Every date-dependent decision receives `now` explicitly so the
 * result is reproducible from its inputs alone.
 *
 * This file selects which application/round currently deserves attention and
 * normalizes existing checklist-completion counts. It does not compute
 * readiness, a probability, or any score — see the module-level exclusions in
 * the Interview Playbook implementation notes.
 */

export type InterviewPlaybookPreparationCount = Readonly<{
  completed: number;
  total: number;
}>;

export type InterviewPlaybookRoundInput = Readonly<{
  id: string;
  applicationId: string;
  roundNumber: number;
  roundName: string;
  roundType: string;
  scheduledAt: string | null;
  durationMinutes: number | null;
  timezone: string | null;
  status: string;
  result: string;
  /** Whether this round is in a live/non-terminal status (not Completed or Cancelled). */
  active: boolean;
  modules: readonly string[];
}>;

export type InterviewPlaybookApplicationInput = Readonly<{
  id: string;
  companyName: string;
  companySlug: string | null;
  roleTitle: string;
  roleLevel: string | null;
  status: string;
  updatedAt: string;
  active: boolean;
  rounds: readonly InterviewPlaybookRoundInput[];
}>;

export type BuildInterviewPlaybookOverviewInput = Readonly<{
  applications: readonly InterviewPlaybookApplicationInput[];
  preparationCounts: ReadonlyMap<string, InterviewPlaybookPreparationCount>;
  now: Date;
}>;

export type InterviewPlaybookRoundState =
  | "upcoming"
  | "unscheduled"
  | "overdue"
  | "completed"
  | "cancelled";

export type InterviewPlaybookRoundSummary = Readonly<{
  id: string;
  applicationId: string;
  companyName: string;
  companySlug: string | null;
  roleTitle: string;
  roleLevel: string | null;
  applicationStatus: string;
  roundNumber: number;
  roundName: string;
  roundType: string;
  scheduledAt: string | null;
  durationMinutes: number | null;
  timezone: string | null;
  status: string;
  result: string;
  state: InterviewPlaybookRoundState;
  modules: readonly string[];
  preparationHref: string;
  preparation: InterviewPlaybookPreparationCount;
}>;

export type InterviewPlaybookApplicationSummary = Readonly<{
  id: string;
  companyName: string;
  companySlug: string | null;
  roleTitle: string;
  roleLevel: string | null;
  status: string;
  updatedAt: string;
  active: boolean;
  applicationHref: string;
  rounds: readonly InterviewPlaybookRoundSummary[];
  nextRound: InterviewPlaybookRoundSummary | null;
  totalRoundCount: number;
  activeRoundCount: number;
  completedRoundCount: number;
  cancelledRoundCount: number;
  overdueRoundCount: number;
}>;

export type InterviewPlaybookPrimaryRoundReason =
  | "next-scheduled-round"
  | "planned-round-without-date";

export type InterviewPlaybookOverviewBase = Readonly<{
  applications: readonly InterviewPlaybookApplicationSummary[];
  activeApplications: readonly InterviewPlaybookApplicationSummary[];
  upcomingRounds: readonly InterviewPlaybookRoundSummary[];
  unscheduledRounds: readonly InterviewPlaybookRoundSummary[];
  overdueRounds: readonly InterviewPlaybookRoundSummary[];
  primaryRound: InterviewPlaybookRoundSummary | null;
  primaryRoundReason: InterviewPlaybookPrimaryRoundReason | null;
}>;

const EMPTY_PREPARATION_COUNT: InterviewPlaybookPreparationCount = { completed: 0, total: 0 };

/** A `scheduledAt` value only counts as scheduled when it parses to a real instant. */
function parseScheduledAt(scheduledAt: string | null): number | null {
  if (scheduledAt === null) return null;
  const parsed = Date.parse(scheduledAt);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Completed and cancelled are read directly from status, ahead of any
 * scheduling check, so a stale or malformed date can never reclassify a
 * resolved round. Everything else is live/active for this closed status
 * enum (see UPCOMING_ROUND_STATUSES), so scheduling alone decides the rest.
 */
function classifyRoundState(round: InterviewPlaybookRoundInput, now: Date): InterviewPlaybookRoundState {
  if (round.status === "Completed") return "completed";
  if (round.status === "Cancelled") return "cancelled";

  const scheduledMs = parseScheduledAt(round.scheduledAt);
  if (scheduledMs === null) return "unscheduled";
  return scheduledMs >= now.getTime() ? "upcoming" : "overdue";
}

function roundPreparationCount(
  roundId: string,
  preparationCounts: ReadonlyMap<string, InterviewPlaybookPreparationCount>,
): InterviewPlaybookPreparationCount {
  return preparationCounts.get(roundId) ?? EMPTY_PREPARATION_COUNT;
}

function buildRoundSummary(
  round: InterviewPlaybookRoundInput,
  application: InterviewPlaybookApplicationInput,
  now: Date,
  preparationCounts: ReadonlyMap<string, InterviewPlaybookPreparationCount>,
): InterviewPlaybookRoundSummary {
  return {
    id: round.id,
    applicationId: round.applicationId,
    companyName: application.companyName,
    companySlug: application.companySlug,
    roleTitle: application.roleTitle,
    roleLevel: application.roleLevel,
    applicationStatus: application.status,
    roundNumber: round.roundNumber,
    roundName: round.roundName,
    roundType: round.roundType,
    scheduledAt: round.scheduledAt,
    durationMinutes: round.durationMinutes,
    timezone: round.timezone,
    status: round.status,
    result: round.result,
    state: classifyRoundState(round, now),
    modules: round.modules,
    preparationHref: `/interviews/${round.id}/prepare`,
    preparation: roundPreparationCount(round.id, preparationCounts),
  };
}

function compareByRoundNumberThenId(a: InterviewPlaybookRoundSummary, b: InterviewPlaybookRoundSummary) {
  return a.roundNumber - b.roundNumber || a.id.localeCompare(b.id);
}

/**
 * A single application's own "next round" uses the same two-tier precedence
 * as the global primary-round selection (earliest upcoming, else earliest
 * unscheduled), scoped to this application's rounds only. `rounds` is already
 * sorted by round number then id, which supplies the correct tie-break for
 * both tiers without a further sort.
 */
function selectNextRound(rounds: readonly InterviewPlaybookRoundSummary[]): InterviewPlaybookRoundSummary | null {
  const upcoming = rounds.filter((round) => round.state === "upcoming");
  if (upcoming.length) {
    return [...upcoming].sort((a, b) => {
      const left = parseScheduledAt(a.scheduledAt) ?? Number.POSITIVE_INFINITY;
      const right = parseScheduledAt(b.scheduledAt) ?? Number.POSITIVE_INFINITY;
      return left - right || compareByRoundNumberThenId(a, b);
    })[0];
  }
  return rounds.find((round) => round.state === "unscheduled") ?? null;
}

function buildApplicationSummary(
  application: InterviewPlaybookApplicationInput,
  now: Date,
  preparationCounts: ReadonlyMap<string, InterviewPlaybookPreparationCount>,
): InterviewPlaybookApplicationSummary {
  const rounds = [...application.rounds]
    .map((round) => buildRoundSummary(round, application, now, preparationCounts))
    .sort(compareByRoundNumberThenId);

  let completedRoundCount = 0;
  let cancelledRoundCount = 0;
  let overdueRoundCount = 0;
  let activeRoundCount = 0;
  for (const round of rounds) {
    if (round.state === "completed") completedRoundCount += 1;
    else if (round.state === "cancelled") cancelledRoundCount += 1;
    else {
      activeRoundCount += 1;
      if (round.state === "overdue") overdueRoundCount += 1;
    }
  }

  return {
    id: application.id,
    companyName: application.companyName,
    companySlug: application.companySlug,
    roleTitle: application.roleTitle,
    roleLevel: application.roleLevel,
    status: application.status,
    updatedAt: application.updatedAt,
    active: application.active,
    applicationHref: `/applications/${application.id}`,
    rounds,
    nextRound: selectNextRound(rounds),
    totalRoundCount: rounds.length,
    activeRoundCount,
    completedRoundCount,
    cancelledRoundCount,
    overdueRoundCount,
  };
}

export function buildInterviewPlaybookOverview(
  input: BuildInterviewPlaybookOverviewInput,
): InterviewPlaybookOverviewBase {
  const { now, preparationCounts } = input;

  // Preserve the input application order (`getApplications` already orders by
  // most recently updated).
  const applications = input.applications.map((application) => buildApplicationSummary(application, now, preparationCounts));
  const activeApplications = applications.filter((application) => application.active);

  const upcomingRounds = activeApplications
    .flatMap((application) => application.rounds.filter((round) => round.state === "upcoming"))
    .sort((a, b) => {
      const left = parseScheduledAt(a.scheduledAt) ?? Number.POSITIVE_INFINITY;
      const right = parseScheduledAt(b.scheduledAt) ?? Number.POSITIVE_INFINITY;
      return left - right || compareByRoundNumberThenId(a, b);
    });

  const unscheduledRounds = activeApplications
    .flatMap((application) => application.rounds.filter((round) => round.state === "unscheduled").map((round) => ({ round, appUpdatedAt: application.updatedAt })))
    .sort((a, b) => b.appUpdatedAt.localeCompare(a.appUpdatedAt) || compareByRoundNumberThenId(a.round, b.round))
    .map((entry) => entry.round);

  const overdueRounds = activeApplications
    .flatMap((application) => application.rounds.filter((round) => round.state === "overdue"))
    .sort((a, b) => {
      const left = parseScheduledAt(a.scheduledAt) ?? Number.NEGATIVE_INFINITY;
      const right = parseScheduledAt(b.scheduledAt) ?? Number.NEGATIVE_INFINITY;
      return right - left || a.id.localeCompare(b.id);
    });

  const primaryRound = upcomingRounds[0] ?? unscheduledRounds[0] ?? null;
  const primaryRoundReason: InterviewPlaybookPrimaryRoundReason | null = upcomingRounds[0]
    ? "next-scheduled-round"
    : unscheduledRounds[0]
      ? "planned-round-without-date"
      : null;

  return {
    applications,
    activeApplications,
    upcomingRounds,
    unscheduledRounds,
    overdueRounds,
    primaryRound,
    primaryRoundReason,
  };
}

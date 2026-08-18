// Relative import (not the usual "@/..." alias): the static regression that
// exercises this resolver runs under plain `node`, with no path-alias loader,
// so this module must resolve without one.
import { dayKey, validIanaTimeZone } from "../interview-calendar/model.ts";

/**
 * Pure date-driven timing model for the Playbook's final-preparation panel.
 *
 * This answers one question — what changes about preparation because the
 * interview is now close? — and nothing else. It never reads readiness,
 * confidence, application status, or round result, and it never calls
 * `new Date()` internally: every classification is a function of its
 * explicit `now` input, so the same inputs always produce the same phase
 * regardless of when or where this code runs.
 */

export type InterviewPlaybookTimingPhase =
  | "unscheduled"
  | "standard"
  | "final-week"
  | "final-three-days"
  | "day-before"
  | "interview-day"
  | "pre-round"
  | "passed";

export type InterviewPlaybookFinalPreparationPhase =
  | "final-week"
  | "final-three-days"
  | "day-before"
  | "interview-day"
  | "pre-round";

export type InterviewPlaybookFinalPreparationGuidance = Readonly<{
  phase: InterviewPlaybookFinalPreparationPhase;
  label: string;
  title: string;
  description: string;
  actions: readonly string[];
}>;

export type ResolveInterviewPlaybookTimingInput = Readonly<{
  scheduledAt: string | null;
  timezone: string | null;
  now: Date;
}>;

export type InterviewPlaybookTimingResult = Readonly<{
  phase: InterviewPlaybookTimingPhase;
  millisecondsUntil: number | null;
  calendarDaysUntil: number | null;
  guidance: InterviewPlaybookFinalPreparationGuidance | null;
}>;

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Informational guidance only — never saved tasks, scores, or quotas. */
const FINAL_PREPARATION_GUIDANCE: Readonly<Record<InterviewPlaybookFinalPreparationPhase, InterviewPlaybookFinalPreparationGuidance>> = {
  "final-week": {
    phase: "final-week",
    label: "Final week",
    title: "Shift from broad learning to interview-specific repair.",
    description: "Use the remaining days to verify the loop, expose repeated errors, and finish preparation already in progress.",
    actions: [
      "Confirm the schedule, timezone, round types, permitted tools, and any company-provided instructions.",
      "Use one realistic round-specific rehearsal to expose a repeated error, then repair that error deliberately.",
      "Finish high-value review work already in progress instead of opening a broad new curriculum.",
      "Check travel, equipment, accessibility, and backup-contact needs while there is still time to resolve them.",
    ],
  },
  "final-three-days": {
    phase: "final-three-days",
    label: "Final three days",
    title: "Prioritize repair, rehearsal, and logistics.",
    description: "Preparation should now become narrower, more familiar, and directly connected to the scheduled rounds.",
    actions: [
      "Prioritize due reviews, repeated mistakes, and the weakest high-impact scheduled round.",
      "Use a targeted mock only when its result will change the next preparation decision; otherwise repair the known gap.",
      "Confirm the coding or presentation environment and prepare a backup device or contact path where practical.",
      "Reduce low-quality repetition when attention or execution is deteriorating.",
    ],
  },
  "day-before": {
    phase: "day-before",
    label: "Day before",
    title: "Finish preparation without creating new uncertainty.",
    description: "Use a short familiar review, complete logistics, and stop broad preparation early enough to disengage from the interview.",
    actions: [
      "Stop heavy practice after a short confidence-building review of familiar material.",
      "Review a compact error log, behavioral story map, and round-specific framework rather than an entire curriculum.",
      "Confirm the exact start time, timezone, link or location, identification requirements, and permitted materials.",
      "Prepare the workspace or travel plan and the backup contact method, then close the preparation workspace.",
    ],
  },
  "interview-day": {
    phase: "interview-day",
    label: "Interview day",
    title: "Protect execution instead of adding more material.",
    description: "Keep preparation light, verify the environment, and treat each scheduled round as a separate task.",
    actions: [
      "Limit review to familiar notes, frameworks, and previously identified mistakes; do not begin a new topic.",
      "Recheck the invitation, timezone, route or meeting link, equipment, and recruiter contact.",
      "Prepare permitted materials and the interview environment before the final hour.",
      "Do not predict the outcome of the day from anticipation or from the result of an earlier round.",
    ],
  },
  "pre-round": {
    phase: "pre-round",
    label: "Within one hour",
    title: "Stop studying and prepare to enter the round.",
    description: "The final hour is for environment checks, a brief reset, and opening only the materials permitted for this interview.",
    actions: [
      "Close broad study material and open only the tools and references permitted for the round.",
      "Check audio, video, room setup, power, network, and the backup contact path once.",
      "Use the remaining minutes for a brief reset rather than another full problem, design, or mock interview.",
      "Begin with the current round; do not replay an earlier round or evaluate your performance during the loop.",
    ],
  },
};

/** `dayKey` requires a valid IANA zone; an invalid or missing one deterministically falls back to UTC. */
function resolveTimeZone(timezone: string | null): string {
  return timezone && validIanaTimeZone(timezone) ? timezone : "UTC";
}

/** Local-calendar-day difference, independent of absolute elapsed hours. */
function calendarDaysBetween(scheduledAt: string, now: Date, timeZone: string): number {
  const nowKey = dayKey(now.toISOString(), timeZone);
  const scheduledKey = dayKey(scheduledAt, timeZone);
  // Both keys are YYYY-MM-DD in the same zone; reparsing as UTC midnight makes
  // the subtraction immune to daylight-saving offset changes between the two
  // dates, which a raw millisecond diff would not be.
  const toUtcMidnight = (key: string) => Date.parse(`${key}T00:00:00.000Z`);
  return Math.round((toUtcMidnight(scheduledKey) - toUtcMidnight(nowKey)) / ONE_DAY_MS);
}

export function resolveInterviewPlaybookTiming(
  input: ResolveInterviewPlaybookTimingInput,
): InterviewPlaybookTimingResult {
  const { scheduledAt, timezone, now } = input;

  const scheduledMs = scheduledAt === null ? NaN : Date.parse(scheduledAt);
  if (!Number.isFinite(scheduledMs)) {
    return { phase: "unscheduled", millisecondsUntil: null, calendarDaysUntil: null, guidance: null };
  }

  const millisecondsUntil = scheduledMs - now.getTime();
  if (millisecondsUntil < 0) {
    return { phase: "passed", millisecondsUntil, calendarDaysUntil: null, guidance: null };
  }

  // The final-hour rule outranks calendar-day classification: an interview
  // 61 minutes into tomorrow's calendar day is still "pre-round," not
  // "day-before."
  if (millisecondsUntil <= ONE_HOUR_MS) {
    return { phase: "pre-round", millisecondsUntil, calendarDaysUntil: 0, guidance: FINAL_PREPARATION_GUIDANCE["pre-round"] };
  }

  const timeZone = resolveTimeZone(timezone);
  const calendarDaysUntil = calendarDaysBetween(scheduledAt as string, now, timeZone);

  if (calendarDaysUntil <= 0) {
    return { phase: "interview-day", millisecondsUntil, calendarDaysUntil, guidance: FINAL_PREPARATION_GUIDANCE["interview-day"] };
  }
  if (calendarDaysUntil === 1) {
    return { phase: "day-before", millisecondsUntil, calendarDaysUntil, guidance: FINAL_PREPARATION_GUIDANCE["day-before"] };
  }
  if (calendarDaysUntil <= 3) {
    return { phase: "final-three-days", millisecondsUntil, calendarDaysUntil, guidance: FINAL_PREPARATION_GUIDANCE["final-three-days"] };
  }
  if (calendarDaysUntil <= 7) {
    return { phase: "final-week", millisecondsUntil, calendarDaysUntil, guidance: FINAL_PREPARATION_GUIDANCE["final-week"] };
  }
  return { phase: "standard", millisecondsUntil, calendarDaysUntil, guidance: null };
}

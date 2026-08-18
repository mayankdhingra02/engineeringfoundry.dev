export type ApplicationInsightRow = {
  status: string;
  updated_at: string;
};

const TERMINAL_STATUSES = new Set(["Offer", "Accepted", "Rejected", "Withdrawn", "Ghosted"]);
const WAITING_STATUSES = new Set(["Applied", "Recruiter Screen", "On Hold"]);
const UPCOMING_INTERVIEW_STATUSES = new Set(["Planned", "Scheduled", "Rescheduled"]);

export function isActiveApplication(status: string) {
  return !TERMINAL_STATUSES.has(status);
}

export function daysSince(value: string, now = new Date()) {
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / 86_400_000));
}

export function applicationNeedsAttention(application: ApplicationInsightRow, now = new Date()) {
  return WAITING_STATUSES.has(application.status) && daysSince(application.updated_at, now) >= 7;
}

export function attentionLabel(application: ApplicationInsightRow, now = new Date()) {
  const days = daysSince(application.updated_at, now);
  if (application.status === "Recruiter Screen") return `Waiting ${days} day${days === 1 ? "" : "s"} for recruiter feedback`;
  if (application.status === "On Hold") return `On hold for ${days} day${days === 1 ? "" : "s"}`;
  return `No update for ${days} day${days === 1 ? "" : "s"}`;
}

export function roundProgress(rounds: Array<{ status: string }>) {
  const completed = rounds.filter((round) => round.status === "Completed").length;
  return {
    completed,
    total: rounds.length,
    label: rounds.length
      ? `${completed} of ${rounds.length} round${rounds.length === 1 ? "" : "s"} completed`
      : "No interview rounds added",
  };
}

export function isUpcomingInterview(round: { scheduled_at: string | null; status: string }, now = new Date()) {
  if (!round.scheduled_at || !UPCOMING_INTERVIEW_STATUSES.has(round.status)) return false;
  const scheduled = new Date(round.scheduled_at);
  return !Number.isNaN(scheduled.getTime()) && scheduled >= now;
}

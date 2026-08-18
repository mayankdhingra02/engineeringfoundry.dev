import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { StatusPill } from "@/components/page-shell";
import { formatInterviewDate } from "@/lib/applications/format";
import type { InterviewPlaybookFinalPreparationGuidance } from "@/lib/interview-playbook/timing";
import type { InterviewPlaybookRoundSummary } from "@/lib/interview-playbook/overview";

/**
 * Subordinate, date-derived preparation context for the Playbook's primary
 * round. This is presentation only: it renders guidance already computed by
 * `resolveInterviewPlaybookTiming` and never queries, scores, or persists
 * anything itself. It intentionally accepts only the round fields it needs,
 * not the full overview or any private round data.
 */
export function InterviewPlaybookFinalPreparationMode({
  guidance,
  round,
}: {
  guidance: InterviewPlaybookFinalPreparationGuidance;
  round: Pick<InterviewPlaybookRoundSummary, "companyName" | "roundName" | "scheduledAt" | "timezone" | "preparationHref">;
}) {
  return <section className="prep-module" aria-labelledby="playbook-final-preparation-heading">
    <header>
      <CalendarClock size={21} aria-hidden="true" />
      <div>
        <h2 id="playbook-final-preparation-heading">Final preparation</h2>
        <p>{round.companyName} · {round.roundName} · {formatInterviewDate(round.scheduledAt, round.timezone)}</p>
      </div>
      <StatusPill tone="accent">{guidance.label}</StatusPill>
    </header>
    <div>
      <p><strong>{guidance.title}</strong></p>
      <p>{guidance.description}</p>
      <ul>
        {guidance.actions.map((action) => <li key={action}>{action}</li>)}
      </ul>
    </div>
    <div>
      <Link className="button button-secondary" href={round.preparationHref}>Open the round plan</Link>
      <Link className="text-link" href="/interview-tips#checklists">Open final-preparation checklists</Link>
      <Link className="text-link" href="/calendar">Review schedule</Link>
    </div>
    <p className="prep-privacy">This mode is generated from the scheduled round time. It does not measure readiness or predict the interview outcome.</p>
  </section>;
}

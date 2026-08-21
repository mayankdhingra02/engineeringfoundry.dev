import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  CircleAlert,
  Compass,
  ListChecks,
  MessagesSquare,
} from "lucide-react";
import { AccountUnavailable } from "@/components/account-unavailable";
import { StatusPill } from "@/components/page-shell";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { formatInterviewDate } from "@/lib/applications/format";
import { requireMemberProfile } from "@/lib/auth/guards";
import { getInterviewPlaybookOverview } from "@/lib/interview-playbook/queries";
import type { InterviewPlaybookPreparationCount, InterviewPlaybookRoundSummary } from "@/lib/interview-playbook/overview";
import { resolveInterviewPlaybookTiming } from "@/lib/interview-playbook/timing";
import {
  buildInterviewPlaybookPlanningProjection,
  type InterviewPlaybookPresentedPlanAction,
} from "@/lib/interview-playbook/planner-integration";
import { getInterviewPlaybookDiagnosticInputs } from "@/lib/interview-playbook/diagnostic-inputs.ts";
import { getDsaInterviewEvidence } from "@/lib/interview-playbook/dsa-evidence-query.ts";
import { InterviewPlaybookFinalPreparationMode } from "@/components/interview-playbook/final-preparation-mode";
import { InterviewPlaybookDiagnosticInputForm } from "@/components/interview-playbook/diagnostic-input-form";

export const metadata: Metadata = {
  title: "Interview Playbook",
  description: "Your private cross-round interview preparation command center.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** `formatInterviewDate` already reads "Not scheduled"; this page's own copy is "Date not scheduled". */
function scheduleText(round: Pick<InterviewPlaybookRoundSummary, "scheduledAt" | "timezone">) {
  return round.scheduledAt ? formatInterviewDate(round.scheduledAt, round.timezone) : "Date not scheduled";
}

/** Checklist-completion progress only — never described as readiness, mastery, or a probability. */
function preparationCountText(preparation: InterviewPlaybookPreparationCount) {
  return preparation.total > 0
    ? `${preparation.completed} of ${preparation.total} round-preparation tasks complete`
    : "Round checklist not started";
}

function queueStateLabel(round: InterviewPlaybookRoundSummary) {
  if (round.needsSignalClarification) return "Focus unconfirmed";
  return round.state === "upcoming" ? "Scheduled" : "Date needed";
}

/** The presentation layer already excludes `final-phase`, so only these three stages ever reach the page. */
function strategyStageLabel(stage: InterviewPlaybookPresentedPlanAction["stage"]) {
  if (stage === "now") return "Now";
  if (stage === "next") return "Next";
  return "Later";
}

/** Describes exactly what fed the plan below without describing self-report as observed performance. */
function planningSourceCopy(sourceMode: "round-context-only" | "round-context-and-user-inputs" | "round-context-and-dsa-self-report" | "round-context-user-inputs-and-dsa-self-report") {
  if (sourceMode === "round-context-user-inputs-and-dsa-self-report") {
    return "Built from confirmed active round signals, interview timing, your saved planning inputs, and DSA practice you marked solved. DSA status is self-reported and still calls for stronger evidence.";
  }
  if (sourceMode === "round-context-and-dsa-self-report") {
    return "Built from confirmed active round signals, interview timing, and DSA practice you marked solved. DSA status is self-reported and still calls for stronger evidence.";
  }
  return sourceMode === "round-context-and-user-inputs"
    ? "Built from confirmed active round signals, interview timing, and the hours, confidence, priorities, and coverage you saved below. Evidence state still comes only from observed practice, never from these self-reported inputs."
    : "Built from confirmed active round signals and interview timing. This view does not infer performance evidence, confidence, or available study time.";
}

export default async function InterviewPlaybookPage() {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  await requireMemberProfile("/interview-playbook");

  // Shared clock: the overview's round classification and the final-preparation
  // timing model must agree on "now," or a round could look upcoming to one and
  // already passed to the other.
  const now = new Date();
  const [overview, diagnosticInputs, dsaEvidence] = await Promise.all([
    getInterviewPlaybookOverview(now),
    getInterviewPlaybookDiagnosticInputs(),
    getDsaInterviewEvidence(),
  ]);
  // Read-only round-context projection: converts confirmed round signals into
  // the merged adaptive planner's targets. When the user has saved diagnostic
  // inputs below, their real hours/confidence/priorities/constraints/coverage
  // are used; otherwise this stays the intentionally neutral Phase 3A
  // diagnostic. Neither path infers evidence from any other product surface —
  // see planner-integration.ts and diagnostic-inputs.ts.
  const planningProjection = buildInterviewPlaybookPlanningProjection({
    overview,
    now,
    diagnosticInput: diagnosticInputs.hasSavedInputs ? diagnosticInputs.diagnosticInput : undefined,
    dsaEvidence,
  });

  const primaryRound = overview.primaryRound;
  const primaryAction = overview.primaryAction;
  const primaryTiming = primaryRound
    ? resolveInterviewPlaybookTiming({ scheduledAt: primaryRound.scheduledAt, timezone: primaryRound.timezone, now })
    : null;

  const preparationQueue = [...overview.upcomingRounds, ...overview.unscheduledRounds]
    .filter((round) => round.id !== primaryRound?.id)
    .slice(0, 6);

  const overdueRounds = overview.overdueRounds.slice(0, 3);

  const firstActiveInterviewProcessWithoutRound = overview.activeInterviewProcesses.find((application) => application.nextRound === null) ?? null;
  const firstPreInterviewApplication = overview.preInterviewApplications[0] ?? null;

  function renderDominantAction() {
    // Branch A: a primary round and its detailed action both exist.
    if (primaryRound && primaryAction) {
      const selectionLabel = primaryAction.reason === "next-scheduled-round" ? "Next scheduled round" : "Round date not set";
      return <section className="prep-next-action" aria-labelledby="playbook-primary-heading">
        <div>
          {primaryRound.needsSignalClarification ? <StatusPill tone="warning">Focus unconfirmed</StatusPill> : <StatusPill tone="accent">{selectionLabel}</StatusPill>}
          <h2 id="playbook-primary-heading">{primaryRound.companyName} — {primaryRound.roleTitle}</h2>
          <p>{primaryRound.roundName} · {primaryRound.roundType} · {scheduleText(primaryRound)}</p>
          <p>{preparationCountText(primaryRound.preparation)}</p>
          {primaryRound.needsSignalClarification && <p>{primaryRound.clarificationPrompt} <Link className="text-link" href={`/applications/${primaryRound.applicationId}/rounds/${primaryRound.id}/edit`}>Update round details</Link></p>}
        </div>
        <div>
          <Link className="button" href={primaryAction.href}>{primaryAction.label}<ArrowRight size={15} /></Link>
          <Link className="text-link" href={primaryRound.preparationHref}>Open the full round plan<ArrowRight size={14} /></Link>
        </div>
      </section>;
    }

    // Branch B: the round changed (or its hub disappeared) between reads.
    if (primaryRound && !primaryAction) {
      return <section className="prep-next-action" aria-labelledby="playbook-primary-heading">
        <div>
          <h2 id="playbook-primary-heading">{primaryRound.companyName} — {primaryRound.roleTitle}</h2>
          <p>{primaryRound.roundName} · {primaryRound.roundType} · {scheduleText(primaryRound)}</p>
          <p>The round changed while this page was loading. Review the application before continuing.</p>
        </div>
        <div>
          <Link className="button" href={`/applications/${primaryRound.applicationId}`}>Review application details<ArrowRight size={15} /></Link>
        </div>
      </section>;
    }

    // Branch C: nothing to prepare for next, but a scheduled round has already elapsed.
    if (overdueRounds.length) {
      const overdueRound = overdueRounds[0];
      return <section className="prep-next-action" aria-labelledby="playbook-primary-heading">
        <div>
          <h2 id="playbook-primary-heading">Needs a status update</h2>
          <p>{overdueRound.companyName} — {overdueRound.roleTitle} · {overdueRound.roundName} · {overdueRound.roundType}</p>
          <p>The scheduled time has passed while this round remains active. Confirm what happened before preparing further.</p>
        </div>
        <div>
          <Link className="button" href={`/applications/${overdueRound.applicationId}`}>Update interview status<ArrowRight size={15} /></Link>
        </div>
      </section>;
    }

    // Branch D: an active interview process exists, but no round is scheduled or planned yet.
    if (firstActiveInterviewProcessWithoutRound) {
      return <section className="prep-next-action" aria-labelledby="playbook-primary-heading">
        <div>
          <h2 id="playbook-primary-heading">Add the next known interview round</h2>
          <p>{firstActiveInterviewProcessWithoutRound.companyName} — {firstActiveInterviewProcessWithoutRound.roleTitle}</p>
          <p>This interview process is active, but no scheduled or planned round is available yet.</p>
        </div>
        <div>
          <Link className="button" href={firstActiveInterviewProcessWithoutRound.applicationHref}>Review application<ArrowRight size={15} /></Link>
        </div>
      </section>;
    }

    // Branch E: no active interview process yet, but an open pre-interview application exists.
    if (firstPreInterviewApplication) {
      return <section className="prep-next-action" aria-labelledby="playbook-primary-heading">
        <div>
          <h2 id="playbook-primary-heading">Keep preparing while the interview process is not confirmed.</h2>
          <p>{firstPreInterviewApplication.companyName} — {firstPreInterviewApplication.roleTitle}</p>
        </div>
        <div>
          <Link className="button" href="/prepare">Choose a general preparation track<ArrowRight size={15} /></Link>
          <Link className="text-link" href={firstPreInterviewApplication.applicationHref}>Review application</Link>
        </div>
      </section>;
    }

    // Branch F: applications exist, but none are currently open.
    if (overview.applications.length > 0) {
      return <section className="prep-next-action" aria-labelledby="playbook-primary-heading">
        <div>
          <h2 id="playbook-primary-heading">No active interview process right now</h2>
          <p>Every tracked application has reached a final outcome. Add a new one when your next process starts.</p>
        </div>
        <div>
          <Link className="button" href="/applications/new">Add an application<ArrowRight size={15} /></Link>
          <Link className="text-link" href="/applications">View application history</Link>
        </div>
      </section>;
    }

    // Branch G: first-use state — no applications tracked at all.
    return <section className="prep-next-action" aria-labelledby="playbook-primary-heading">
      <div>
        <h2 id="playbook-primary-heading">Start with the interview process you are pursuing.</h2>
        <p>Adding a company and role lets Engineering Foundry connect dates, rounds, and preparation work.</p>
      </div>
      <div>
        <Link className="button" href="/applications/new">Add an application<ArrowRight size={15} /></Link>
        <Link className="text-link" href="/prepare">Explore preparation tracks</Link>
        <Link className="text-link" href="/interview-tips">Open the interview execution guide</Link>
      </div>
    </section>;
  }

  return <section className="member-dashboard"><div className="page-width member-dashboard-shell">
    <header className="member-dashboard-header">
      <div>
        <span>Interview preparation</span>
        <h1>Your interview playbook</h1>
        <p>One next action across every active interview process.</p>
      </div>
      <nav aria-label="Interview playbook actions">
        <Link className="button button-secondary" href="/applications">All applications</Link>
        <Link className="button button-secondary" href="/calendar"><CalendarDays size={15} />Calendar</Link>
      </nav>
    </header>

    {overview.applications.length > 0 && <section className="pipeline-summary" aria-label="Interview playbook overview">
      <article><span><BriefcaseBusiness size={17} aria-hidden="true" /></span><div><strong>{overview.openApplications.length}</strong><p>Open applications</p></div></article>
      <article><span><CalendarClock size={17} aria-hidden="true" /></span><div><strong>{overview.activeInterviewProcesses.length}</strong><p>Active interview processes</p></div></article>
      <article><span><CalendarDays size={17} aria-hidden="true" /></span><div><strong>{overview.upcomingRounds.length}</strong><p>Scheduled rounds</p></div></article>
      <article><span><CircleAlert size={17} aria-hidden="true" /></span><div><strong>{overview.overdueRounds.length}</strong><p>Need an update</p></div></article>
    </section>}

    {renderDominantAction()}

    {primaryRound && primaryAction && primaryTiming?.guidance ? (
      <InterviewPlaybookFinalPreparationMode guidance={primaryTiming.guidance} round={primaryRound} />
    ) : null}

    <InterviewPlaybookDiagnosticInputForm
      hasSavedInputs={diagnosticInputs.hasSavedInputs}
      availableHoursPerWeek={diagnosticInputs.availableHoursPerWeek}
      confidenceByArea={diagnosticInputs.confidenceByArea}
      priorities={diagnosticInputs.priorities}
      constraints={diagnosticInputs.constraints}
      coverage={diagnosticInputs.coverage}
    />

    {planningProjection && <section className="prep-module" aria-labelledby="playbook-strategy-heading">
      <header>
        <Compass size={21} aria-hidden="true" />
        <div>
          <h2 id="playbook-strategy-heading">Adaptive preparation strategy</h2>
          <p>Broader strategy across the confirmed active interview rounds.</p>
        </div>
      </header>
      <p className="prep-privacy">{planningSourceCopy(planningProjection.sourceMode)}</p>
      {diagnosticInputs.hasSavedInputs && diagnosticInputs.availableHoursPerWeek === 0 && (
        <p className="prep-privacy">You saved 0 available hours per week, so new preparation actions stay suppressed until you add capacity above.</p>
      )}
      <ol>
        {planningProjection.actions.map((action, index) => <li key={`${action.kind}-${action.area ?? "none"}-${index}`}>
          {action.href ? <Link href={action.href}>
            <span>
              <strong>{action.title}</strong>
              <small>{action.description}</small>
            </span>
            <span className="prep-item-state">{strategyStageLabel(action.stage)}<ArrowRight size={14} aria-hidden="true" /></span>
          </Link> : <div>
            <span>
              <strong>{action.title}</strong>
              <small>{action.description}</small>
            </span>
            <span className="prep-item-state">{strategyStageLabel(action.stage)}</span>
          </div>}
        </li>)}
      </ol>
      {planningProjection.hiddenActionCount > 0 && <p className="prep-privacy">{planningProjection.hiddenActionCount} additional strategy action{planningProjection.hiddenActionCount === 1 ? "" : "s"} become relevant later.</p>}
      {planningProjection.deferred.length > 0 && <div>
        <h3>Intentionally deferred</h3>
        <ol>
          {planningProjection.deferred.map((deferral, index) => <li key={`${deferral.area}-${index}`}>
            <span>
              <strong>{deferral.title}</strong>
              <small>{deferral.description}</small>
            </span>
          </li>)}
        </ol>
        {planningProjection.hiddenDeferralCount > 0 && <p className="prep-privacy">{planningProjection.hiddenDeferralCount} more area{planningProjection.hiddenDeferralCount === 1 ? "" : "s"} are intentionally deferred.</p>}
      </div>}
    </section>}

    {overview.activeInterviewProcesses.length > 0 && <section className="prep-module">
      <header>
        <ListChecks size={21} aria-hidden="true" />
        <div>
          <h2>Upcoming preparation queue</h2>
          <p>Scheduled rounds appear first. Planned rounds without dates follow.</p>
        </div>
      </header>
      {preparationQueue.length ? <ol>
        {preparationQueue.map((round) => <li key={round.id}>
          <Link href={round.preparationHref}>
            <span>
              <strong>{round.companyName} — {round.roleTitle}</strong>
              <small>{round.roundName} · {round.roundType} · {scheduleText(round)}</small>
              <small>{preparationCountText(round.preparation)}</small>
            </span>
            <span className="prep-item-state">{queueStateLabel(round)}</span>
          </Link>
        </li>)}
      </ol> : <div className="prep-empty-inline"><p>No other rounds are waiting on preparation right now.</p></div>}
    </section>}

    {overdueRounds.length > 0 && <section className="prep-module">
      <header>
        <AlertTriangle size={21} aria-hidden="true" />
        <div>
          <h2>Needs a status update</h2>
          <p>These scheduled times passed while the rounds remained active. Confirm whether each round was completed, rescheduled, or cancelled.</p>
        </div>
      </header>
      <ol>
        {overdueRounds.map((round) => <li key={round.id}>
          <Link href={`/applications/${round.applicationId}`}>
            <span>
              <strong>{round.companyName}</strong>
              <small>{round.roundName} · {round.roundType} · {scheduleText(round)}</small>
            </span>
            <span className="prep-item-state">Update application<ArrowRight size={14} aria-hidden="true" /></span>
          </Link>
        </li>)}
      </ol>
    </section>}

    <section className="prep-module">
      <header>
        <BookOpenCheck size={21} aria-hidden="true" />
        <div>
          <h2>Execution and rehearsal</h2>
          <p>Owning sections for how to run the interview itself, not another curriculum.</p>
        </div>
      </header>
      <ol>
        <li><Link href="/interview-tips"><span><strong>Interview execution guide</strong><small>Communication, recovery, and closing guidance for the day of the interview.</small></span><ArrowRight size={14} aria-hidden="true" /></Link></li>
        <li><Link href="/mock-interviews"><span><strong>Mock interview lab</strong><small><MessagesSquare size={12} aria-hidden="true" /> Session-only rehearsal prompts and timers.</small></span><ArrowRight size={14} aria-hidden="true" /></Link></li>
        <li><Link href="/calendar"><span><strong>Calendar and reminders</strong><small>Every scheduled round with export and reminder controls.</small></span><ArrowRight size={14} aria-hidden="true" /></Link></li>
        <li><Link href="/applications"><span><strong>Application tracker</strong><small>Full application history and round records.</small></span><ArrowRight size={14} aria-hidden="true" /></Link></li>
      </ol>
    </section>

    <section aria-labelledby="playbook-explanation-heading">
      <h2 id="playbook-explanation-heading">How the next action is chosen</h2>
      <ol>
        <li>The earliest scheduled active round is prioritized.</li>
        <li>When no round is scheduled, a planned round without a date is selected.</li>
        <li>Overdue records are separated for correction rather than treated as preparation targets.</li>
        <li>The detailed action comes from the selected round&apos;s existing preparation evidence.</li>
      </ol>
      <p className="prep-privacy">Checklist completion is planning progress, not interview readiness or a probability of passing.</p>
    </section>
  </div></section>;
}

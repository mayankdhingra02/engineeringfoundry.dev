/*
THESIS: A quiet preparation flight plan turns one real interview into the shortest useful route through existing work.
OWN-WORLD: Engineering Foundry's warm paper, rust, ink, and workshop-green Operate surface.
STORY: Establish the round, continue the single best action, move down only the relevant modules, then close gaps in the private checklist.
FIRST VIEWPORT: Compact round band, calm timing, one primary continuation, and the start of the preparation route.
FORM: Preparation Flight Plan · surface seed 68d019a3.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BellRing, BookOpenCheck, Boxes, Building2, CalendarClock, Code2, Compass, ExternalLink, ListChecks, MessageSquareText, TriangleAlert, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { AccountUnavailable } from "@/components/account-unavailable";
import { addPreparationTaskAction, deletePreparationTaskAction, savePreparationNotesAction, savePreparationReflectionAction, togglePreparationChecklistAction, togglePreparationTaskAction } from "@/features/interview-preparation/actions";
import { PreparationAddTaskForm, PreparationChecklistControl, PreparationTaskControl, PreparationTaskDeleteControl } from "@/features/interview-preparation/mutation-controls";
import { PreparationNotesForm, PreparationReflectionForm } from "@/features/interview-preparation/text-form";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { formatCountdown, formatInterviewDate } from "@/lib/applications/format";
import { requireMemberProfile } from "@/lib/auth/guards";
import { chooseRoundPreparationNextAction } from "@/lib/interview-preparation/next-action";
import { getInterviewPreparationHub } from "@/lib/interview-preparation/queries";
import { PREPARATION_TEXT_ABSENT_REVISION } from "@/lib/interview-preparation/text-action-input";
import { getRoundReminderStates } from "@/lib/interview-calendar/queries";
import { getRoundExecutionGuide, roundExecutionGuideHref } from "@/lib/interview-playbook/round-execution-presentation";
import { behavioralContentStatusLabel } from "@/lib/behavioral/readiness";

export const metadata: Metadata = { title: "Interview preparation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function InterviewPreparationPage({ params }: { params: Promise<{ roundId: string }> }) {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  const { roundId } = await params;
  await requireMemberProfile(`/interviews/${roundId}/prepare`);
  const hub = await getInterviewPreparationHub(roundId);
  if (!hub) notFound();
  const { round, roundContext, preparation, tasks, checklist } = hub;
  const executionGuides = roundContext.executionGuideSlugs
    .map((slug) => getRoundExecutionGuide(slug))
    .filter((guide): guide is NonNullable<typeof guide> => guide !== null);
  const reminderState = (await getRoundReminderStates([round.id])).get(round.id)?.filter((item) => item.status === "pending") ?? [];
  const applicationId = round.application.id;
  const completedIds = preparation?.completed_template_item_ids ?? [];
  const context = `application=${applicationId}`;
  const firstDsa = hub.dsa?.recommendations[0]?.question ?? null;
  const firstAttempt = hub.systemDesign?.attempts[0] ?? null;
  const firstConcept = hub.systemDesign?.concepts[0] ?? null;
  const primary = chooseRoundPreparationNextAction({
    applicationId,
    dsaQuestion: firstDsa ? { id: firstDsa.id, title: firstDsa.title } : null,
    systemDesignAttempt: firstAttempt ? { id: firstAttempt.id, problemId: firstAttempt.problem_id, title: firstAttempt.title } : null,
    behavioralAvailable: Boolean(hub.behavioral),
    systemDesignConcept: firstConcept ? { href: firstConcept.href, title: firstConcept.title } : null,
  });
  const notesAction = savePreparationNotesAction.bind(null, round.id, applicationId);
  const reflectionAction = savePreparationReflectionAction.bind(null, round.id, applicationId);
  const latestHref = `/interviews/${round.id}/prepare`;
  const stateLabel = round.status === "Cancelled" ? "This round was cancelled. Your preparation is preserved." : round.status === "Completed" ? "Round completed. Capture what happened while it is fresh." : round.status === "Rescheduled" ? "Rescheduled round. Your checklist and notes carried forward." : null;

  return <div className="prep-hub" data-direction-seed="68d019a3"><div className="page-width prep-shell">
    <Link className="prep-back" href={`/applications/${applicationId}`}><ArrowLeft size={15} />Back to application</Link>
    <header className="prep-flight-band"><div><h1>{round.application.company_name} — {round.application.role_title}</h1><p>{round.round_type} · {round.round_name}</p></div><dl><div><dt>Interview</dt><dd>{formatInterviewDate(round.scheduled_at, round.timezone)}</dd></div><div><dt>Timing</dt><dd>{round.scheduled_at ? formatCountdown(round.scheduled_at, round.timezone) : "Not scheduled"}</dd></div>{round.duration_minutes && <div><dt>Duration</dt><dd>{round.duration_minutes} minutes</dd></div>}</dl></header>
    {stateLabel && <aside className={`prep-lifecycle ${round.status.toLowerCase()}`}><CalendarClock size={18} /><p>{stateLabel}</p></aside>}
    {round.scheduled_at && round.status !== "Cancelled" && <aside className="prep-calendar-cue"><BellRing size={18} /><div><strong>{reminderState.length ? `${reminderState.length} reminders scheduled` : "No reminders scheduled"}</strong><p>Calendar exports are manual snapshots. Re-export after a reschedule.</p></div><nav><a href={`/api/calendar/interviews/${round.id}/ics`}>Download .ics</a><a href={`/api/calendar/interviews/${round.id}/google`} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a><Link href="/settings/interviews">Reminder settings</Link></nav></aside>}
    {roundContext.needsSignalClarification && <aside className="prep-lifecycle"><TriangleAlert size={18} /><p><strong>Round focus needs confirmation.</strong> {roundContext.clarificationPrompt} <Link href={`/applications/${applicationId}/rounds/${round.id}/edit`}>Update round details</Link></p></aside>}
    <section className="prep-next-action" aria-labelledby="prep-next-heading"><div><h2 id="prep-next-heading">Continue with the most useful preparation.</h2><p>Recommendations are selected from this round type, your saved progress, and reliable application context.</p></div><Link className="button" href={primary.href}>{primary.label}<ArrowRight size={15} /></Link></section>

    <div className="prep-grid"><div className="prep-route" aria-label="Round preparation route">
      {executionGuides.length > 0 && <section className="prep-module"><header><Compass size={21} /><div><h2>Round execution</h2><p>Canonical execution guidance for this round’s confirmed signals</p></div></header><ul>{executionGuides.map((guide) => <li key={guide.slug}><Link href={roundExecutionGuideHref(guide.slug)}><span><strong>{guide.title}</strong><small>{guide.description}</small></span><ArrowRight size={14} /></Link></li>)}</ul></section>}

      {hub.dsa && <section className="prep-module"><header><Code2 size={21} /><div><h2>DSA route</h2><p>{hub.dsa.roadmapLevel === "sde3plus" ? "SDE III+" : hub.dsa.roadmapLevel.toUpperCase()} focus · saved review and company-relevant questions first</p></div><Link href={`/dsa/practice?${context}`}>Open practice<ArrowRight size={14} /></Link></header>{hub.dsa.recommendations.length ? <ol>{hub.dsa.recommendations.map(({ question, progress: item }) => <li key={question.id}><Link href={`/dsa/questions/${question.id}?${context}`}><span><strong>{question.title}</strong><small>{question.difficulty} · {question.topics.slice(0, 2).join(" · ")}</small></span><span className="prep-item-state">{item?.status === "review" ? "Review" : item?.bookmarked ? "Bookmarked" : item?.status === "attempted" ? "Attempted" : "Company match"}</span></Link></li>)}</ol> : <div className="prep-empty-inline"><p>No saved or reliable company-matched questions yet.</p><Link href={`/dsa/questions?${context}`}>Choose from the question library</Link></div>}</section>}

      {hub.systemDesign && <section className="prep-module"><header><Boxes size={21} /><div><h2>System Design route</h2><p>Saved attempts and concepts that deserve another pass</p></div><Link href={`/system-design/practice?${context}`}>Open practice<ArrowRight size={14} /></Link></header>{hub.systemDesign.attempts.length > 0 && <div className="prep-subroute"><h3>Attempts to review</h3><ul>{hub.systemDesign.attempts.map((attempt) => <li key={attempt.id}><Link href={`/system-design/problems/${attempt.problem_id}/practice/${attempt.id}`}><span><strong>{attempt.title}</strong><small>{attempt.application_id === applicationId ? "Linked to this application" : "Recent practice"}</small></span><span className="prep-item-state">{attempt.status}</span></Link></li>)}</ul></div>}<div className="prep-subroute"><h3>Concept pass</h3><ul>{hub.systemDesign.concepts.map((concept) => <li key={concept!.id}><Link href={concept!.href}><span><strong>{concept!.title}</strong><small>{concept!.category} · {concept!.estimatedMinutes} min</small></span><ArrowRight size={14} /></Link></li>)}</ul></div></section>}

      {hub.behavioral && <section className="prep-module"><header><MessageSquareText size={21} /><div><h2>Behavioral route</h2><p>{hub.behavioral.readyStoryCount} content-complete stories · {hub.behavioral.applicationAnswers} answers linked to this application</p></div><Link href={`/behavioral/workspace?${context}`}>Open workspace<ArrowRight size={14} /></Link></header>{hub.behavioral.stories.length ? <ul>{hub.behavioral.stories.map((story) => <li key={story.id}><Link href={`/behavioral/stories/${story.id}`}><span><strong>{story.title}</strong><small>{story.short_summary || "Open the story to review its concise framing."}</small></span><span className="prep-item-state">{behavioralContentStatusLabel(story.status)}</span></Link></li>)}</ul> : <div className="prep-empty-inline"><p>No stories yet. Start with one flexible example you can tell clearly.</p><Link href="/behavioral/stories/new">Create a story</Link></div>}<Link className="prep-secondary-link" href={`/behavioral/questions?${context}`}>Check question coverage<ArrowRight size={14} /></Link></section>}

      {hub.modules.includes("company") && <section className="prep-module prep-company"><header><Building2 size={21} /><div><h2>Company context</h2><p>Use only the research Engineering Foundry can resolve confidently.</p></div></header>{hub.company.hasGuide && hub.company.slug ? <Link className="prep-company-link" href={`/companies/${hub.company.slug}`}><BookOpenCheck size={18} /><span><strong>Review the {round.application.company_name} interview guide</strong><small>Process context, themes, and reliable preparation guidance</small></span><ExternalLink size={14} /></Link> : <div className="prep-empty-inline"><p>No verified company guide matches this application. Your application notes remain the source of truth.</p><Link href={`/applications/${applicationId}`}>Review application</Link></div>}</section>}

      {round.status === "Completed" && <section className="prep-reflection"><header><UserRound size={21} /><div><h2>Private post-interview reflection</h2><p>Record evidence for your next round. This stays private to your account.</p></div></header><PreparationReflectionForm action={reflectionAction} values={{ topicsAsked: preparation?.topics_asked ?? "", wentWell: preparation?.went_well ?? "", needsImprovement: preparation?.needs_improvement ?? "", followUpNotes: preparation?.follow_up_notes ?? "" }} revision={preparation?.reflection_updated_at ?? PREPARATION_TEXT_ABSENT_REVISION} latestHref={latestHref} /></section>}
    </div>

    <aside className="prep-side"><section className="prep-checklist"><header><ListChecks size={20} /><div><h2>Round checklist</h2><p>{hub.completedCount} of {hub.totalCount} complete</p></div></header><div className="prep-progress-track" aria-label={`${hub.completedCount} of ${hub.totalCount} preparation tasks complete`}><span style={{ width: `${hub.totalCount ? (hub.completedCount / hub.totalCount) * 100 : 0}%` }} /></div><ul>{checklist.map((item) => { const complete = completedIds.includes(item.id); const action = togglePreparationChecklistAction.bind(null, round.id, item.id, !complete); return <li key={item.id}><PreparationChecklistControl action={action} complete={complete} label={item.label} /></li>; })}{tasks.map((task) => { const toggle = togglePreparationTaskAction.bind(null, round.id, task.id, !task.completed); const remove = deletePreparationTaskAction.bind(null, round.id, task.id, task.updated_at); return <li key={task.id} className="custom"><PreparationTaskControl action={toggle} complete={task.completed} label={task.title} /><PreparationTaskDeleteControl action={remove} latestHref={latestHref} /></li>; })}</ul>{tasks.length < 12 && <PreparationAddTaskForm action={addPreparationTaskAction.bind(null, round.id, applicationId)} />}</section>
      <section className="prep-notes"><PreparationNotesForm action={notesAction} value={preparation?.private_notes ?? ""} revision={preparation?.private_notes_updated_at ?? PREPARATION_TEXT_ABSENT_REVISION} latestHref={latestHref} /></section>
      <p className="prep-privacy">Checklist, custom tasks, notes, and reflections are private to your account.</p>
    </aside></div>
  </div></div>;
}

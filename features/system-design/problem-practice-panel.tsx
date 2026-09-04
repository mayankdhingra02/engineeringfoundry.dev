import Link from "next/link";
import { ArrowRight, History, LockKeyhole, Plus } from "lucide-react";
import { RevisionConfirmAction } from "@/features/applications/revision-confirm-action";
import { createSystemDesignAttemptAction, deleteSystemDesignAttemptAction } from "./actions";
import { getSystemDesignProblemAttempts } from "@/lib/system-design/queries";

const date = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export async function SystemDesignProblemPracticePanel({ problemId, problemTitle, applicationId }: { problemId: string; problemTitle: string; applicationId?: string | null }) {
  const state = await getSystemDesignProblemAttempts(problemId);
  if (!state.signedIn) return state.accountPlatformAvailable
    ? <aside className="sd-attempt-entry signed-out"><LockKeyhole size={19} /><div><h2>Build a private design attempt</h2><p>Public walkthroughs stay open. Sign in to save your own requirements, calculations, architecture decisions, and review notes.</p></div><Link className="button" href={`/signin?next=${encodeURIComponent(`/system-design/problems/${problemId}`)}`}>Sign in to practice</Link></aside>
    : <aside className="sd-attempt-entry signed-out"><LockKeyhole size={19} aria-hidden="true" /><div><h2>Private design attempts are unavailable right now</h2><p>Use the prompt and public walkthrough below for an unsaved rehearsal. Account notes, calculations, and review history are not stored.</p></div></aside>;
  const selectedApplication = state.applications.find((item) => item.id === applicationId);
  const create = createSystemDesignAttemptAction.bind(null, problemId);
  return <section className="sd-attempt-entry" aria-labelledby="design-attempts-heading">
    <header><div><h2 id="design-attempts-heading">Your design attempts</h2><p>Start from a blank worksheet. Each attempt remains independent from the public walkthrough and your other rehearsals.</p></div><Link href="/system-design/practice">Open My Practice<ArrowRight size={14} /></Link></header>
    <form action={create} className="sd-start-attempt-form">
      <label>Attempt title<input name="title" maxLength={160} defaultValue={`${problemTitle} design attempt`} /></label>
      <label>Application context <span>Optional</span><select name="application_id" defaultValue={selectedApplication?.id ?? ""}><option value="">No application</option>{state.applications.map((application) => <option key={application.id} value={application.id}>{application.company_name} · {application.role_title}</option>)}</select></label>
      <button className="button"><Plus size={15} />Start design attempt</button>
    </form>
    {state.attempts.length ? <div className="sd-attempt-history"><div className="sd-attempt-history-heading"><History size={16} /><strong>Attempt history</strong><span>{state.attempts.length} saved</span></div>{state.attempts.map((attempt) => {
      const application = state.applications.find((item) => item.id === attempt.application_id);
      const attemptHref = `/system-design/problems/${problemId}/practice/${attempt.id}`;
      return <article key={attempt.id}><div><strong>{attempt.title}</strong><span>{attempt.status}{attempt.confidence ? ` · ${attempt.confidence} confidence` : ""}{application ? ` · ${application.company_name}` : ""}</span><small>Updated {date(attempt.updated_at)}</small></div><div><Link className="button button-secondary button-sm" href={attemptHref}>{attempt.status === "draft" ? "Continue" : "Open"}</Link><RevisionConfirmAction action={deleteSystemDesignAttemptAction.bind(null, attempt.id, problemId, attempt.revision)} label="Delete" confirmLabel="Delete attempt" latestHref={attemptHref} /></div></article>;
    })}</div> : <p className="sd-attempt-empty">No attempts yet. Your first worksheet will stay private to this account.</p>}
  </section>;
}

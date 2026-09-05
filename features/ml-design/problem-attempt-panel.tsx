import Link from "next/link";
import { ArrowRight, History, LockKeyhole } from "lucide-react";
import { RevisionConfirmAction } from "@/features/applications/revision-confirm-action";
import { getMlDesignProblemAttempts } from "@/lib/ml-design/queries";
import { createMlDesignAttemptAction, deleteMlDesignAttemptAction } from "./actions";
import { MlDesignStartAttemptForm } from "./start-attempt-form";

const date = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export async function MlDesignProblemAttemptPanel({ problemId, problemTitle }: { problemId: string; problemTitle: string }) {
  const state = await getMlDesignProblemAttempts(problemId);
  if (!state.signedIn) return state.accountPlatformAvailable
    ? <aside className="ml-attempt-entry signed-out"><LockKeyhole size={19} aria-hidden="true" /><div><h2>Save a private attempt</h2><p>The public rehearsal below stays tab-only. Sign in to keep a separate worksheet with DECIDE progress and dimension evidence.</p></div><Link className="button" href={`/signin?next=${encodeURIComponent(`/ml-design/problems/${problemId}`)}`}>Sign in to save</Link></aside>
    : <aside className="ml-attempt-entry signed-out"><LockKeyhole size={19} aria-hidden="true" /><div><h2>Private attempts are unavailable right now</h2><p>You can still use the complete tab-only rehearsal below. Refreshing discards its notes and self-review.</p></div></aside>;
  const create = createMlDesignAttemptAction.bind(null, problemId);
  return <section className="ml-attempt-entry" aria-labelledby="ml-attempts-heading">
    <header><div><h2 id="ml-attempts-heading">Your private attempts</h2><p>Each worksheet is owner-scoped and separate from the public dossier. Attempt text is excluded from analytics.</p></div></header>
    <MlDesignStartAttemptForm action={create} defaultTitle={`${problemTitle} practice`} />
    {state.attempts.length ? <div className="ml-attempt-history"><div className="ml-attempt-history-heading"><History size={16} aria-hidden="true" /><strong>Attempt history</strong><span>{state.attempts.length} saved</span></div>{state.attempts.map((attempt) => {
      const href = `/ml-design/problems/${problemId}/practice/${attempt.id}`;
      return <article key={attempt.id}><div><strong>{attempt.title}</strong><span>{attempt.status} · {attempt.mode}{attempt.duration_minutes ? ` · ${attempt.duration_minutes} min` : ""}</span><small>Updated {date(attempt.updated_at)}</small></div><div><Link className="button button-secondary button-sm" href={href}>{attempt.status === "draft" ? "Continue" : "Open"}<ArrowRight size={13} aria-hidden="true" /></Link><RevisionConfirmAction action={deleteMlDesignAttemptAction.bind(null, attempt.id, problemId, attempt.revision)} label="Delete" confirmLabel="Delete attempt" latestHref={href} /></div></article>;
    })}</div> : <p className="ml-attempt-empty">No saved attempts yet. Start one without changing the public rehearsal.</p>}
  </section>;
}

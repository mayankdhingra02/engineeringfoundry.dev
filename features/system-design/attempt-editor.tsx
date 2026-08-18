"use client";

import Link from "next/link";
import { Check, LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import type { Application } from "@/lib/supabase/database.types";
import type { SystemDesignAttempt } from "@/lib/system-design/workspace";
import { formatLines, formatRows } from "@/lib/system-design/workspace";
import { saveSystemDesignAttemptAction, type SystemDesignActionState } from "./actions";

const initial: SystemDesignActionState = { status: "idle", message: "" };
type ApplicationOption = Pick<Application, "id" | "company_name" | "role_title">;

function Field({ id, title, guidance, rows = 5, defaultValue, formatHint, describedBy }: { id: string; title: string; guidance: string; rows?: number; defaultValue: string; formatHint?: string; describedBy?: string }) {
  return <section className="sd-attempt-section" id={`section-${id}`}><header><h2>{title}</h2><p>{guidance}</p></header>{formatHint && <small>{formatHint}</small>}<label className="sr-only" htmlFor={id}>{title}</label><textarea id={id} name={id} rows={rows} defaultValue={defaultValue} aria-describedby={describedBy} /></section>;
}

export function SystemDesignAttemptEditor({ attempt, problemTitle, applications }: { attempt: SystemDesignAttempt; problemTitle: string; applications: ApplicationOption[] }) {
  const action = saveSystemDesignAttemptAction.bind(null, attempt.id, attempt.problem_id);
  const [dirty, setDirty] = useState(false);
  const [state, formAction, pending] = useActionState(async (previous: SystemDesignActionState, formData: FormData) => {
    const result = await action(previous, formData);
    if (result.status === "success") setDirty(false);
    return result;
  }, initial);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    const protectNavigation = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest("a");
      if (dirty && link && link.href && !window.confirm("Leave without saving this design attempt?")) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", protectNavigation, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", protectNavigation, true); };
  }, [dirty]);

  const attemptDocument = attempt.document;
  const errorDescription = state.status === "error" ? "attempt-save-error" : undefined;
  return <form action={formAction} className="sd-attempt-editor" onChange={() => setDirty(true)}>
    <input type="hidden" name="expected_revision" value={state.revision ?? attempt.revision} />
    <header className="sd-attempt-editor-header"><div><Link href={`/system-design/problems/${attempt.problem_id}`}>← {problemTitle}</Link><input aria-label="Attempt title" name="title" required maxLength={160} defaultValue={attempt.title} aria-describedby={errorDescription} /></div><div><label>Status<select name="status" defaultValue={attempt.status} aria-describedby={errorDescription}><option value="draft">Draft</option><option value="practiced">Practiced</option><option value="review">Needs review</option></select></label><label>Confidence<select name="confidence" defaultValue={attempt.confidence ?? ""} aria-describedby={errorDescription}><option value="">Not set</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Application<select name="application_id" defaultValue={attempt.application_id ?? ""} aria-describedby={errorDescription}><option value="">No application</option>{applications.map((application) => <option key={application.id} value={application.id}>{application.company_name} · {application.role_title}</option>)}</select></label></div></header>
    <aside className="sd-attempt-integrity-note">This worksheet is private. The public walkthrough remains unchanged, and saving here never changes another attempt.</aside>
    <div className="sd-attempt-editor-grid"><fieldset className="sd-attempt-sections" aria-label="Structured design attempt sections" aria-describedby={errorDescription}>
      <Field id="functional_requirements" title="Functional requirements" guidance="One user-visible capability per line. Keep scope explicit." defaultValue={formatLines(attemptDocument.functional_requirements)} />
      <Field id="non_functional_requirements" title="Non-functional requirements" guidance="Name measurable latency, availability, durability, consistency, and scale constraints." defaultValue={formatLines(attemptDocument.non_functional_requirements)} />
      <section className="sd-attempt-section" id="section-capacity"><header><h2>Capacity assumptions and calculations</h2><p>Keep assumptions separate from derived arithmetic so every number can be challenged.</p></header><div className="sd-attempt-split"><label>Assumptions <small>label | value | unit</small><textarea name="capacity_assumptions" rows={6} defaultValue={formatRows(attemptDocument.capacity.assumptions, ["label","value","unit"])} placeholder="Daily active users | 10,000,000 | users/day" /></label><label>Derived calculations <small>label | formula | result</small><textarea name="capacity_calculations" rows={6} defaultValue={formatRows(attemptDocument.capacity.calculations, ["label","formula","result"])} placeholder="Average read RPS | 10M × 20 ÷ 86,400 | 2,315 RPS" /></label></div></section>
      <Field id="apis" title="API contracts" guidance="Capture the interface before choosing internal components." formatHint="method | path | purpose" defaultValue={formatRows(attemptDocument.apis, ["method","path","purpose"])} />
      <Field id="data_models" title="Data models" guidance="Name entities, key fields, access patterns, and ownership." formatHint="entity | fields | notes" defaultValue={formatRows(attemptDocument.data_models, ["entity","fields","notes"])} />
      <Field id="high_level_design" title="High-level components and request flow" guidance="Describe the simplest complete path, component responsibilities, and where state lives." rows={12} defaultValue={attemptDocument.high_level_design} />
      <Field id="deep_dives" title="Deep dives" guidance="One subsystem or design question per line." defaultValue={formatLines(attemptDocument.deep_dives)} />
      <Field id="bottlenecks" title="Bottlenecks" guidance="Identify the first limit, its signal, and what scale makes it relevant." defaultValue={formatLines(attemptDocument.bottlenecks)} />
      <Field id="failure_modes" title="Failure modes" guidance="Describe behavior during partial failure, not only prevention." formatHint="failure | impact | mitigation" defaultValue={formatRows(attemptDocument.failure_modes, ["failure","impact","mitigation"])} />
      <Field id="tradeoffs" title="Trade-offs" guidance="Record what each major choice improves and what it costs." formatHint="choice | benefit | cost" defaultValue={formatRows(attemptDocument.tradeoffs, ["choice","benefit","cost"])} />
      <Field id="follow_ups" title="Interviewer follow-ups" guidance="One follow-up question or unresolved design branch per line." defaultValue={formatLines(attemptDocument.follow_ups)} />
      <Field id="final_review_notes" title="Final review notes" guidance="After practice, capture the clearest explanation, weakest assumption, and next change." rows={8} defaultValue={attemptDocument.final_review_notes} />
    </fieldset><nav aria-label="Attempt sections"><strong>Worksheet</strong>{[["functional_requirements","Requirements"],["capacity","Capacity"],["apis","APIs"],["data_models","Data models"],["high_level_design","Architecture"],["failure_modes","Failures"],["tradeoffs","Trade-offs"],["final_review_notes","Review"]].map(([id,label]) => <a key={id} href={`#section-${id}`}>{label}</a>)}</nav></div>
    <footer className="sd-attempt-savebar"><div role="status" aria-live="polite" aria-atomic="true">{dirty ? <><span className="sd-unsaved-dot" />Unsaved changes</> : state.status === "success" ? <><Check size={14} />Saved</> : "No unsaved changes"}{state.message && <small id={errorDescription} className={state.status === "error" ? "error" : ""}>{state.message}</small>}</div><button className="button" disabled={pending || state.conflict}>{pending ? <><LoaderCircle className="spin" size={15} />Saving…</> : "Save attempt"}</button></footer>
  </form>;
}

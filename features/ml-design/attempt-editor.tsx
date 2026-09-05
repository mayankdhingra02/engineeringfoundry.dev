"use client";

import Link from "next/link";
import { Check, LoaderCircle, LockKeyhole } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import {
  mlDesignAttemptDraftSignature,
  resolveMlDesignAttemptDisplayState,
} from "@/lib/ml-design/attempt-action-input";
import {
  mlDesignDecideSections,
  mlDesignRubricBands,
  mlDesignRubricDimensions,
  type MlDesignAttempt,
} from "@/lib/ml-design/attempt";
import { saveMlDesignAttemptAction, type MlDesignActionState } from "./actions";

const initial: MlDesignActionState = { status: "idle", message: "" };
const decideLabels = {
  define: "Define the product decision",
  establish: "Establish success criteria",
  construct: "Construct the learning signal",
  integrate: "Integrate learning into the system",
  derisk: "De-risk the launch",
  evolve: "Evolve the production system",
} as const;

export function MlDesignAttemptEditor({ attempt, problemTitle }: { attempt: MlDesignAttempt; problemTitle: string }) {
  const action = saveMlDesignAttemptAction.bind(null, attempt.id, attempt.problem_id);
  const [mode, setMode] = useState(attempt.mode);
  const [dirty, setDirty] = useState(false);
  const [changedSinceSubmit, setChangedSinceSubmit] = useState(false);
  const changedRef = useRef(false);
  const submittedSignature = useRef<string | null>(null);
  const submissionPending = useRef(false);
  const [state, formAction, pending] = useActionState(async (previous: MlDesignActionState, formData: FormData) => {
    const result = await action(previous, formData);
    if (result.status === "success" && !changedRef.current) setDirty(false);
    return result;
  }, { ...initial, revision: attempt.revision });

  useEffect(() => { if (!pending) submissionPending.current = false; }, [pending]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    const protectNavigation = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest("a");
      if (dirty && link?.href && !window.confirm("Leave without saving this ML Design attempt?")) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", protectNavigation, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", protectNavigation, true); };
  }, [dirty]);

  function updateDraft(form: HTMLFormElement) {
    setDirty(true);
    if (submittedSignature.current === null) return;
    const changed = mlDesignAttemptDraftSignature(new FormData(form)) !== submittedSignature.current;
    changedRef.current = changed;
    setChangedSinceSubmit(changed);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionPending.current || state.conflict) return;
    submissionPending.current = true;
    const formData = new FormData(event.currentTarget);
    submittedSignature.current = mlDesignAttemptDraftSignature(formData);
    changedRef.current = false;
    setChangedSinceSubmit(false);
    startTransition(() => formAction(formData));
  }

  const attemptDocument = attempt.document;
  const displayState = resolveMlDesignAttemptDisplayState(state, pending, changedSinceSubmit);
  const errorId = state.status === "error" ? "ml-attempt-save-error" : undefined;
  const latestHref = `/ml-design/problems/${attempt.problem_id}/practice/${attempt.id}`;
  return <form action={formAction} className="ml-attempt-editor" onSubmit={submit} onChange={(event) => updateDraft(event.currentTarget)} aria-busy={pending}>
    <input type="hidden" name="expected_revision" value={state.revision ?? attempt.revision} />
    <header className="ml-attempt-editor-header"><div><Link href={`/ml-design/problems/${attempt.problem_id}`}>← {problemTitle}</Link><span>PRIVATE WORKSHEET · VERSION {attempt.problem_version}</span><input aria-label="Attempt title" name="title" required maxLength={160} defaultValue={attempt.title} aria-describedby={errorId} /></div><div>
      <label>Status<select name="status" defaultValue={attempt.status} aria-describedby={errorId}><option value="draft">Draft</option><option value="practiced">Practiced</option><option value="review">Needs review</option></select></label>
      <label>Mode<select name="mode" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)} aria-describedby={errorId}><option value="guided">Guided</option><option value="untimed">Untimed</option><option value="timed">Timed</option></select></label>
      {mode === "timed" ? <label>Duration<select name="duration_minutes" defaultValue={attempt.duration_minutes ?? 45} aria-describedby={errorId}><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option></select></label> : <input type="hidden" name="duration_minutes" value="" />}
      <label>Exposure<select name="fresh_exposure" defaultValue={attemptDocument.fresh_exposure ? "fresh" : "repeat"} aria-describedby={errorId}><option value="fresh">Fresh</option><option value="repeat">Repeat</option></select></label>
    </div></header>
    <aside className="ml-attempt-private-note"><LockKeyhole size={16} aria-hidden="true" /><p>This worksheet is visible only to your account. Notes, evidence, and self-review are never sent to analytics.</p></aside>
    <div className="ml-attempt-layout"><main>
      <section className="ml-attempt-copy" id="ml-attempt-framing"><header><span>01</span><div><h2>Frame the decision</h2><p>Record facts you assumed separately from the design they support.</p></div></header><label>Assumptions and clarifications<textarea name="assumptions" rows={8} maxLength={16000} defaultValue={attemptDocument.assumptions} /></label><label>Design notes<textarea name="design_notes" rows={18} maxLength={50000} defaultValue={attemptDocument.design_notes} /></label></section>
      <section className="ml-attempt-copy" id="ml-attempt-decide"><header><span>02</span><div><h2>DECIDE coverage</h2><p>Mark a stage only when your notes contain the corresponding decision evidence.</p></div></header><fieldset className="ml-attempt-checklist" aria-label="Completed DECIDE stages">{mlDesignDecideSections.map((section, index) => <label key={section}><input type="checkbox" name={`decide_${section}`} value="yes" defaultChecked={attemptDocument.completed_decide_sections.includes(section)} /><span><strong>{index + 1}. {section.toUpperCase()}</strong>{decideLabels[section]}</span></label>)}</fieldset><label className="ml-attempt-hints">Hints used<input name="hints_used" type="number" min={0} max={6} step={1} defaultValue={attemptDocument.hints_used} /></label></section>
      <section className="ml-attempt-copy" id="ml-attempt-review"><header><span>03</span><div><h2>Dimension evidence</h2><p>Choose descriptive bands independently. No total score or readiness probability is calculated.</p></div></header><div className="ml-attempt-review-grid">{mlDesignRubricDimensions.map(([id, label]) => <fieldset key={id}><legend>{label}</legend><select aria-label={`${label} band`} name={`review_${id}`} defaultValue={attemptDocument.self_review[id] ?? ""}><option value="">Not reviewed</option>{mlDesignRubricBands.map((band) => <option key={band} value={band}>{band}</option>)}</select><label>Evidence<textarea name={`evidence_${id}`} rows={3} maxLength={5000} defaultValue={attemptDocument.dimension_evidence[id] ?? ""} placeholder="What in this attempt supports the selected band?" /></label></fieldset>)}</div></section>
      <section className="ml-attempt-copy" id="ml-attempt-follow-up"><header><span>04</span><div><h2>Next rehearsal</h2><p>One concrete correction, experiment, or question per line.</p></div></header><label>Follow-up actions<textarea name="follow_up_actions" rows={6} defaultValue={attemptDocument.follow_up_actions.join("\n")} /></label></section>
    </main><nav aria-label="Attempt sections"><strong>Worksheet</strong><a href="#ml-attempt-framing">Frame</a><a href="#ml-attempt-decide">DECIDE</a><a href="#ml-attempt-review">Evidence</a><a href="#ml-attempt-follow-up">Next rehearsal</a></nav></div>
    <footer className="ml-attempt-savebar"><div role={displayState.status === "error" ? "alert" : "status"} aria-live={displayState.status === "error" ? "assertive" : "polite"} aria-atomic="true">{dirty ? <><span className="sd-unsaved-dot" />Unsaved changes</> : state.status === "success" ? <><Check size={14} />Saved</> : "No unsaved changes"}{displayState.message && <small id={errorId} className={displayState.status === "error" ? "error" : ""}>{displayState.message}{!pending && state.conflict && <><br /><Link href={latestHref} target="_blank" rel="noopener noreferrer">Review latest in a new tab</Link></>}</small>}</div><button className="button" type="submit" aria-disabled={pending || Boolean(state.conflict)}>{pending ? <><LoaderCircle className="spin" size={15} />Saving…</> : "Save attempt"}</button></footer>
  </form>;
}

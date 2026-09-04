"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { BEHAVIORAL_CATEGORIES } from "@/lib/behavioral/catalog";
import { TRACKER_COMPANIES, normalizeCompanySlug } from "@/lib/applications/options";
import {
  BEHAVIORAL_QUESTION_ABSENT_REVISION,
  BEHAVIORAL_QUESTION_EXPECTED_REVISION_FIELD,
  BEHAVIORAL_QUESTION_ID_FIELD,
  resolveBehavioralQuestionDisplayState,
} from "@/lib/behavioral/question-action-input";
import type { BehavioralCustomQuestion } from "@/lib/supabase/database.types";
import { saveQuestionAction, type BehavioralActionState } from "./actions";
import { BehavioralFieldError, behavioralErrorProps } from "./form-parts";

const companyName = (slug: string | null) => TRACKER_COMPANIES.find((name) => normalizeCompanySlug(name) === slug) ?? slug ?? "";

export function QuestionForm({ questionId, question }: { questionId: string; question?: BehavioralCustomQuestion }) {
  const initialRevision = question?.updated_at ?? BEHAVIORAL_QUESTION_ABSENT_REVISION;
  const [state, formAction, pending] = useActionState(saveQuestionAction, {
    status: "idle",
    message: "",
    questionId,
    revision: initialRevision,
  } satisfies BehavioralActionState);
  const submissionPending = useRef(false);
  const [changedSinceSubmit, setChangedSinceSubmit] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!pending) submissionPending.current = false;
  }, [pending]);
  useEffect(() => () => {
    submissionPending.current = false;
  }, []);
  const hasUnsavedChanges = dirty || state.status === "error";
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !pending) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges, pending]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionPending.current) return;
    submissionPending.current = true;
    setChangedSinceSubmit(false);
    setDirty(false);
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };
  const displayState = resolveBehavioralQuestionDisplayState(
    state,
    pending,
    changedSinceSubmit,
  );
  const currentQuestionId = state.questionId ?? questionId;
  const currentRevision = state.revision ?? initialRevision;
  const saved = currentRevision !== BEHAVIORAL_QUESTION_ABSENT_REVISION;
  const questionHref = `/behavioral/questions/${currentQuestionId}`;
  const cancelHref = question ? questionHref : "/behavioral/questions";
  return <form action={formAction} onSubmit={submit} onChangeCapture={() => {
    setDirty(true);
    if (submissionPending.current) setChangedSinceSubmit(true);
  }} aria-busy={pending} className="behavioral-form form-shell behavioral-question-form">
    <input type="hidden" name={BEHAVIORAL_QUESTION_ID_FIELD} value={currentQuestionId} />
    <input type="hidden" name={BEHAVIORAL_QUESTION_EXPECTED_REVISION_FIELD} value={currentRevision} />
    <div className="behavioral-form-section"><div><h2>Question details</h2><p>Add prompts from recruiters, interview loops, or your own preparation.</p></div><div className="form-grid">
    <div className="form-group full"><label htmlFor="question-text">Question <span>Required</span></label><textarea id="question-text" name="question_text" rows={4} required maxLength={1000} defaultValue={question?.question_text ?? ""} {...behavioralErrorProps(state, "question_text")} /><BehavioralFieldError state={state} name="question_text" /></div>
    <div className="form-group"><label htmlFor="question-category">Category</label><input id="question-category" name="category" list="behavioral-categories" maxLength={100} defaultValue={question?.category ?? ""} {...behavioralErrorProps(state, "category")} /><BehavioralFieldError state={state} name="category" /><datalist id="behavioral-categories">{BEHAVIORAL_CATEGORIES.map((category) => <option key={category} value={category} />)}</datalist></div>
    <div className="form-group"><label htmlFor="question-company">Company <span>Optional</span></label><input id="question-company" name="company_slug" list="behavioral-companies" maxLength={80} defaultValue={companyName(question?.company_slug ?? null)} {...behavioralErrorProps(state, "company_slug")} /><BehavioralFieldError state={state} name="company_slug" /><datalist id="behavioral-companies">{TRACKER_COMPANIES.map((company) => <option key={company} value={company} />)}</datalist></div>
    <div className="form-group full"><label htmlFor="question-description">Context or guidance</label><textarea id="question-description" name="description" rows={4} maxLength={5000} defaultValue={question?.description ?? ""} {...behavioralErrorProps(state, "description")} /><BehavioralFieldError state={state} name="description" /></div>
    <div className="form-group full"><label htmlFor="question-notes">Private notes</label><textarea id="question-notes" name="notes" rows={5} maxLength={20000} defaultValue={question?.notes ?? ""} {...behavioralErrorProps(state, "notes")} /><BehavioralFieldError state={state} name="notes" /></div>
  </div></div>{(pending || displayState.message) && <p className={displayState.status === "error" ? "form-error" : "behavioral-save-status"} role={displayState.status === "error" ? "alert" : "status"} aria-live={displayState.status === "error" ? "assertive" : "polite"} aria-atomic="true">{displayState.message}{!pending && state.conflict && <><br /><Link href={questionHref} target="_blank" rel="noopener noreferrer">Review latest question in a new tab</Link></>}</p>}<div className="tracker-form-actions"><button className="button" type="submit" aria-disabled={pending}>{pending ? <><LoaderCircle className="spin" size={16} />Saving…</> : saved ? "Save question" : "Add question"}</button><Link className="button button-secondary" href={cancelHref} onClick={(event) => { if (hasUnsavedChanges && !window.confirm("Discard your unsaved changes?")) event.preventDefault(); }}>Cancel</Link>{state.status === "success" && <Link className="button button-secondary" href={questionHref}>View question</Link>}{hasUnsavedChanges && <span className="behavioral-unsaved">Unsaved changes</span>}</div></form>;
}

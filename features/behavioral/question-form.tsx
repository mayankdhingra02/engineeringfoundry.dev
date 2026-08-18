"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { BEHAVIORAL_CATEGORIES } from "@/lib/behavioral/catalog";
import { TRACKER_COMPANIES, normalizeCompanySlug } from "@/lib/applications/options";
import type { BehavioralCustomQuestion } from "@/lib/supabase/database.types";
import type { BehavioralActionState } from "./actions";
import { BehavioralFieldError, behavioralErrorProps } from "./form-parts";

type QuestionAction = (state: BehavioralActionState, formData: FormData) => Promise<BehavioralActionState>;
const initialState: BehavioralActionState = { status: "idle", message: "" };
const companyName = (slug: string | null) => TRACKER_COMPANIES.find((name) => normalizeCompanySlug(name) === slug) ?? slug ?? "";

export function QuestionForm({ action, question }: { action: QuestionAction; question?: BehavioralCustomQuestion }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="behavioral-form form-shell"><div className="behavioral-form-section"><div><h2>Question details</h2><p>Add prompts from recruiters, interview loops, or your own preparation.</p></div><div className="form-grid">
    <div className="form-group full"><label htmlFor="question-text">Question <span>Required</span></label><textarea id="question-text" name="question_text" rows={4} required maxLength={1000} defaultValue={question?.question_text ?? ""} {...behavioralErrorProps(state, "question_text")} /><BehavioralFieldError state={state} name="question_text" /></div>
    <div className="form-group"><label htmlFor="question-category">Category</label><input id="question-category" name="category" list="behavioral-categories" maxLength={100} defaultValue={question?.category ?? ""} /><datalist id="behavioral-categories">{BEHAVIORAL_CATEGORIES.map((category) => <option key={category} value={category} />)}</datalist></div>
    <div className="form-group"><label htmlFor="question-company">Company <span>Optional</span></label><input id="question-company" name="company_slug" list="behavioral-companies" defaultValue={companyName(question?.company_slug ?? null)} /><datalist id="behavioral-companies">{TRACKER_COMPANIES.map((company) => <option key={company} value={company} />)}</datalist></div>
    <div className="form-group full"><label htmlFor="question-description">Context or guidance</label><textarea id="question-description" name="description" rows={4} maxLength={5000} defaultValue={question?.description ?? ""} /></div>
    <div className="form-group full"><label htmlFor="question-notes">Private notes</label><textarea id="question-notes" name="notes" rows={5} maxLength={20000} defaultValue={question?.notes ?? ""} /></div>
  </div></div>{state.message && <p className="form-error" role="alert">{state.message}</p>}<div className="tracker-form-actions"><button className="button" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={16} />Saving…</> : question ? "Save question" : "Add question"}</button><Link className="button button-secondary" href={question ? `/behavioral/questions/${question.id}` : "/behavioral/questions"}>Cancel</Link></div></form>;
}

"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";
import { ANSWER_STATUSES } from "@/lib/behavioral/options";
import { AnswerIntegrityReview } from "./answer-integrity-review";
import { AnswerPresentationGuidance } from "./preparation-guidance";
import { TRACKER_COMPANIES, normalizeCompanySlug } from "@/lib/applications/options";
import { storyReadiness } from "@/lib/behavioral/readiness";
import type { Application, BehavioralAnswer, BehavioralStory } from "@/lib/supabase/database.types";
import type { BehavioralActionState } from "./actions";
import { BehavioralFieldError, behavioralErrorProps } from "./form-parts";

type AnswerAction = (state: BehavioralActionState, formData: FormData) => Promise<BehavioralActionState>;
type AnswerStoryOption = Pick<BehavioralStory, "id" | "title" | "situation" | "task" | "action" | "result" | "reflection" | "short_summary">;
type AnswerApplicationOption = Pick<Application, "id" | "company_name" | "company_slug" | "role_title">;
const initialState: BehavioralActionState = { status: "idle", message: "" };

export function AnswerForm({ action, questionId, stories, applications, defaultCompany, defaultApplication, defaultStory, answer }: { action: AnswerAction; questionId: string; stories: AnswerStoryOption[]; applications: AnswerApplicationOption[]; defaultCompany?: string | null; defaultApplication?: string | null; defaultStory?: string | null; answer?: BehavioralAnswer }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const initialApplication = answer?.application_id ?? defaultApplication ?? "";
  const [applicationId, setApplicationId] = useState(initialApplication);
  const [storyId, setStoryId] = useState(answer?.story_id ?? defaultStory ?? "");
  const [draft, setDraft] = useState({ opening_framing: answer?.opening_framing ?? "", details_to_emphasize: answer?.details_to_emphasize ?? "", details_to_avoid: answer?.details_to_avoid ?? "", notes: answer?.notes ?? "", answer_text: answer?.answer_text ?? "" });
  const [factIntegrityConfirmed, setFactIntegrityConfirmed] = useState(false);
  const application = applications.find((item) => item.id === applicationId);
  const requestedCompany = application?.company_slug ?? answer?.company_slug ?? defaultCompany;
  const company = TRACKER_COMPANIES.find((name) => normalizeCompanySlug(name) === requestedCompany) ?? application?.company_name ?? requestedCompany ?? "";
  return <form action={formAction} className="behavioral-form form-shell"><div className="behavioral-form-section"><div><h2>Prepare this question</h2><p>Choose reusable evidence and save only the framing you need. Company and application context are optional.</p></div><div className="form-grid">
    <div className="form-group"><label htmlFor="answer-title">Preparation title <span>Required</span></label><input id="answer-title" name="title" required maxLength={200} placeholder="General conflict framing" defaultValue={answer?.title ?? ""} {...behavioralErrorProps(state, "title")} /><BehavioralFieldError state={state} name="title" /></div>
    <div className="form-group"><label htmlFor="answer-status">Status</label><select id="answer-status" name="status" defaultValue={answer?.status ?? "Draft"}>{ANSWER_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>
    <div className="form-group"><label htmlFor="answer-company">Company <span>Optional</span></label><input key={company} id="answer-company" name="company_slug" list="answer-companies" defaultValue={company} readOnly={Boolean(application)} aria-describedby="answer-company-help" /><small id="answer-company-help">{application ? "Set by the selected application." : "Use this for company-specific prep without an application."}</small><datalist id="answer-companies">{TRACKER_COMPANIES.map((name) => <option key={name} value={name} />)}</datalist></div>
    <div className="form-group"><label htmlFor="answer-application">Application <span>Optional</span></label><select id="answer-application" name="application_id" value={applicationId} onChange={(event) => setApplicationId(event.target.value)}><option value="">No application</option>{applications.map((item) => <option key={item.id} value={item.id}>{item.company_name} · {item.role_title}</option>)}</select></div>
    <div className="form-group full"><label htmlFor="answer-story">Source story <span>Required</span></label><select id="answer-story" name="story_id" value={storyId} onChange={(event) => { setStoryId(event.target.value); setFactIntegrityConfirmed(false); }} required {...behavioralErrorProps(state, "story_id")}><option value="" disabled>Choose the factual source for this variant</option>{stories.map((story) => <option key={story.id} value={story.id}>{story.title} · {storyReadiness(story)}</option>)}</select><small>The story holds facts. This answer saves question-specific framing and rehearsal notes.</small><BehavioralFieldError state={state} name="story_id" /></div>
    <label className="behavioral-primary-choice full" htmlFor="answer-primary"><input id="answer-primary" type="checkbox" name="is_primary" defaultChecked={answer?.is_primary ?? false} /><span>Use this as the primary story for this question<small>Optional. Saving replaces the previous primary choice for this question.</small></span></label>
    <div className="form-group full"><label htmlFor="answer-opening">Opening framing</label><textarea id="answer-opening" name="opening_framing" rows={3} maxLength={10000} placeholder="The one-sentence setup that makes this story relevant…" defaultValue={answer?.opening_framing ?? ""} onChange={(event) => { setDraft((current) => ({ ...current, opening_framing: event.target.value })); setFactIntegrityConfirmed(false); }} {...behavioralErrorProps(state, "opening_framing")} /><BehavioralFieldError state={state} name="opening_framing" /></div>
    <div className="form-group"><label htmlFor="answer-emphasize">Details to emphasize</label><textarea id="answer-emphasize" name="details_to_emphasize" rows={5} maxLength={20000} placeholder="Decisions, tradeoffs, or evidence to foreground…" defaultValue={answer?.details_to_emphasize ?? ""} onChange={(event) => { setDraft((current) => ({ ...current, details_to_emphasize: event.target.value })); setFactIntegrityConfirmed(false); }} {...behavioralErrorProps(state, "details_to_emphasize")} /><BehavioralFieldError state={state} name="details_to_emphasize" /></div>
    <div className="form-group"><label htmlFor="answer-avoid">Details to avoid</label><textarea id="answer-avoid" name="details_to_avoid" rows={5} maxLength={20000} placeholder="Tangents, confidential details, or weak framing…" defaultValue={answer?.details_to_avoid ?? ""} onChange={(event) => { setDraft((current) => ({ ...current, details_to_avoid: event.target.value })); setFactIntegrityConfirmed(false); }} {...behavioralErrorProps(state, "details_to_avoid")} /><BehavioralFieldError state={state} name="details_to_avoid" /></div>
    <div className="form-group full"><label htmlFor="answer-notes">Answer notes</label><textarea id="answer-notes" name="notes" rows={5} maxLength={50000} placeholder="Question-specific reminders that should not duplicate the STAR story…" defaultValue={answer?.notes ?? ""} onChange={(event) => { setDraft((current) => ({ ...current, notes: event.target.value })); setFactIntegrityConfirmed(false); }} /></div>
    <details className="tracker-form-optional full" open={Boolean(answer?.answer_text)}><summary>Full rehearsal draft <span>Optional</span></summary><div className="form-group"><label htmlFor="answer-text">Answer draft</label><textarea id="answer-text" name="answer_text" rows={12} maxLength={50000} defaultValue={answer?.answer_text ?? ""} onChange={(event) => { setDraft((current) => ({ ...current, answer_text: event.target.value })); setFactIntegrityConfirmed(false); }} {...behavioralErrorProps(state, "answer_text")} /><BehavioralFieldError state={state} name="answer_text" /></div></details>
    <div className="full"><AnswerPresentationGuidance /><AnswerIntegrityReview story={stories.find((story) => story.id === storyId)} draft={draft} confirmed={factIntegrityConfirmed} onConfirmChange={setFactIntegrityConfirmed} /><BehavioralFieldError state={state} name="fact_integrity_confirmed" /></div>
  </div></div>{state.message && <p className="form-error" role="alert">{state.message}</p>}<div className="tracker-form-actions"><button className="button" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={16} />Saving…</> : answer ? "Save answer" : "Create answer"}</button><Link className="button button-secondary" href={`/behavioral/questions/${questionId}`}>Cancel</Link></div></form>;
}

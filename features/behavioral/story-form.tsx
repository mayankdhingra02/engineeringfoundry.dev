"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { STORY_THEMES } from "@/lib/behavioral/options";
import { storyReadiness } from "@/lib/behavioral/readiness";
import {
  BEHAVIORAL_STORY_EXPECTED_REVISION_FIELD,
  BEHAVIORAL_STORY_THEMES_PRESENT_FIELD,
} from "@/lib/behavioral/story-action-input";
import type { BehavioralStory } from "@/lib/supabase/database.types";
import type { BehavioralActionState } from "./actions";
import { BehavioralFieldError, behavioralErrorProps } from "./form-parts";

type StoryAction = (state: BehavioralActionState, formData: FormData) => Promise<BehavioralActionState>;
const initialState: BehavioralActionState = { status: "idle", message: "" };

export function StoryForm({ action, story, themes = [] }: { action: StoryAction; story?: BehavioralStory; themes?: string[] }) {
  const [state, formAction, pending] = useActionState(action, initialState); const [dirty, setDirty] = useState(false);
  const submissionPending = useRef(false);
  useEffect(() => { if (!pending) submissionPending.current = false; }, [pending]);
  useEffect(() => () => { submissionPending.current = false; }, []);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty && !pending) event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty, pending]);
  const cancelHref = story ? `/behavioral/stories/${story.id}` : "/behavioral/stories";
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionPending.current) return;
    submissionPending.current = true;
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };
  const liveStatus = pending ? "idle" : state.status;
  return <form action={formAction} className="behavioral-form form-shell" onSubmit={submit} onChangeCapture={() => setDirty(true)} aria-busy={pending}>
    {story && <input type="hidden" name={BEHAVIORAL_STORY_EXPECTED_REVISION_FIELD} value={story.updated_at} />}
    <input type="hidden" name={BEHAVIORAL_STORY_THEMES_PRESENT_FIELD} value="true" />
    <div className="behavioral-form-section"><div><h2>Name the moment</h2><p>Capture the facts you can reuse: context, your responsibility, actions, outcome, and reflection.</p>{story && <p className="behavioral-readiness-note"><strong>{storyReadiness(story) === "Ready" ? "Content complete" : storyReadiness(story)}</strong> is based only on the detail currently in Situation, Task, Action, and Result.</p>}</div><div className="form-grid">
      <div className="form-group full"><label htmlFor="story-title">Story title <span>Required</span></label><input id="story-title" name="title" required maxLength={200} defaultValue={story?.title ?? ""} placeholder="Stabilized checkout before peak traffic" {...behavioralErrorProps(state, "title")} /><BehavioralFieldError state={state} name="title" /></div>
      <div className="form-group"><label htmlFor="story-context">Company or context</label><input id="story-context" name="company_or_context" maxLength={200} defaultValue={story?.company_or_context ?? ""} {...behavioralErrorProps(state, "company_or_context")} /><BehavioralFieldError state={state} name="company_or_context" /></div>
      <div className="form-group"><label htmlFor="story-role">Your role</label><input id="story-role" name="role" maxLength={160} defaultValue={story?.role ?? ""} {...behavioralErrorProps(state, "role")} /><BehavioralFieldError state={state} name="role" /></div>
      <div className="form-group"><label htmlFor="story-period">Approximate period</label><input id="story-period" name="approximate_period" maxLength={100} placeholder="Q2 2025" defaultValue={story?.approximate_period ?? ""} {...behavioralErrorProps(state, "approximate_period")} /><BehavioralFieldError state={state} name="approximate_period" /></div>
      <div className="form-group"><label htmlFor="story-project">Project</label><input id="story-project" name="project" maxLength={200} defaultValue={story?.project ?? ""} {...behavioralErrorProps(state, "project")} /><BehavioralFieldError state={state} name="project" /></div>
    </div></div>
    <fieldset className="behavioral-theme-fieldset"><legend>Story themes</legend><p>Choose every competency this story can credibly demonstrate.</p><div className="behavioral-theme-grid">{STORY_THEMES.map((theme) => <label key={theme}><input type="checkbox" name="themes" value={theme} defaultChecked={themes.includes(theme)} /><span>{theme}</span></label>)}</div><BehavioralFieldError state={state} name="themes" /></fieldset>
    <div className="behavioral-star-grid">{([
      ["situation", "Situation", "What was happening? Give only the context the interviewer needs."], ["task", "Task", "What were you responsible for?"],
      ["action", "Action", "What did you personally do? Focus on your decisions and contribution."], ["result", "Result", "What changed? Use measurable evidence where you actually have it."],
      ["reflection", "Reflection", "What did you learn or what would you do differently?"],
    ] as const).map(([name, label, hint]) => <div className="form-group" key={name}><label htmlFor={`story-${name}`}>{label}</label><small>{hint}</small><textarea id={`story-${name}`} name={name} rows={7} maxLength={50000} defaultValue={story?.[name] ?? ""} {...behavioralErrorProps(state, name)} /><BehavioralFieldError state={state} name={name} /></div>)}</div>
    <details className="tracker-form-optional" open={Boolean(story?.short_summary || story?.notes || state.fieldErrors?.short_summary || state.fieldErrors?.notes)}><summary>Short version and private notes <span>Optional</span></summary><div className="form-grid"><div className="form-group full"><label htmlFor="story-summary">60-second summary</label><textarea id="story-summary" name="short_summary" rows={4} maxLength={5000} defaultValue={story?.short_summary ?? ""} {...behavioralErrorProps(state, "short_summary")} /><BehavioralFieldError state={state} name="short_summary" /></div><div className="form-group full"><label htmlFor="story-notes">Private notes</label><textarea id="story-notes" name="notes" rows={5} maxLength={50000} defaultValue={story?.notes ?? ""} {...behavioralErrorProps(state, "notes")} /><BehavioralFieldError state={state} name="notes" /></div></div></details>
    {(pending || state.message) && <p className={liveStatus === "error" ? "form-error" : "behavioral-save-status"} role={liveStatus === "error" ? "alert" : "status"} aria-live={liveStatus === "error" ? "assertive" : "polite"} aria-atomic="true">{pending ? "Saving story…" : state.message}{!pending && state.conflict && <><br /><Link href={cancelHref} target="_blank" rel="noopener noreferrer">Review latest story in a new tab</Link></>}</p>}
    <div className="tracker-form-actions"><button className="button" type="submit" aria-disabled={pending}>{pending ? <><LoaderCircle className="spin" size={16} />Saving…</> : story ? "Save story" : "Create story"}</button><Link className="button button-secondary" href={cancelHref} onClick={(event) => { if (dirty && !window.confirm("Discard your unsaved changes?")) event.preventDefault(); }}>Cancel</Link>{dirty && <span className="behavioral-unsaved">Unsaved changes</span>}</div>
  </form>;
}

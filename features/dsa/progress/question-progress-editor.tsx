"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { Bookmark, Save } from "lucide-react";
import { updateDsaQuestionProgressAction, type DsaProgressActionState } from "./actions";
import {
  DSA_PROGRESS_ABSENT_REVISION,
  DSA_PROGRESS_BOOKMARK_PRESENT_FIELD,
  DSA_PROGRESS_CONFIDENCE_PRESENT_FIELD,
  DSA_PROGRESS_EXPECTED_REVISION_FIELD,
} from "@/lib/dsa/question-progress-action-input";
import type { DsaQuestionProgressRow } from "@/lib/supabase/database.types";
import { track } from "@/lib/analytics";

export function QuestionProgressEditor({ questionId, progress }: { questionId: string; progress: DsaQuestionProgressRow }) {
  const initialRevision = progress.updated_at || DSA_PROGRESS_ABSENT_REVISION;
  const [state, action, pending] = useActionState(updateDsaQuestionProgressAction, {
    status: "idle",
    message: "",
    revision: initialRevision,
  } satisfies DsaProgressActionState);
  const recordedActions = useRef(new Set<string>());
  const submissionPending = useRef(false);

  useEffect(() => {
    if (!pending) submissionPending.current = false;
  }, [pending]);

  useEffect(() => () => {
    submissionPending.current = false;
  }, []);

  useEffect(() => {
    if (!state.analytics || state.analytics.recordedStatus === "not_started") return;
    const key = `${state.analytics.questionId}:${state.analytics.recordedStatus}`;
    if (recordedActions.current.has(key)) return;
    recordedActions.current.add(key);
    track("preparation_activity_recorded", { track: "dsa", item_id: state.analytics.questionId, status: state.analytics.recordedStatus, persistence: "account" });
  }, [state.analytics]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionPending.current) return;
    submissionPending.current = true;
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
  const liveStatus = pending ? "idle" : state.status;

  return <form action={action} onSubmit={submit} className="dsa-progress-editor" aria-busy={pending}>
    <input type="hidden" name="question_id" value={questionId} />
    <input type="hidden" name={DSA_PROGRESS_EXPECTED_REVISION_FIELD} value={state.revision ?? initialRevision} />
    <input type="hidden" name={DSA_PROGRESS_CONFIDENCE_PRESENT_FIELD} value="true" />
    <input type="hidden" name={DSA_PROGRESS_BOOKMARK_PRESENT_FIELD} value="true" />
    <fieldset><legend>Practice status</legend><div className="dsa-choice-row">{(["not_started", "attempted", "solved", "review"] as const).map((status) => <label key={status}><input type="radio" name="status" value={status} defaultChecked={progress.status === status} required /><span>{status.replace("_", " ")}</span></label>)}</div></fieldset>
    <fieldset><legend>Confidence <small>Self-reported</small></legend><div className="dsa-choice-row">{(["low", "medium", "high"] as const).map((confidence) => <label key={confidence}><input type="radio" name="confidence" value={confidence} defaultChecked={progress.confidence === confidence} /><span>{confidence}</span></label>)}</div></fieldset>
    <label className="dsa-bookmark-field"><input type="checkbox" name="bookmarked" value="true" defaultChecked={progress.bookmarked} /><Bookmark size={15} />Bookmark for later</label>
    <label><span>Private notes</span><textarea name="notes" rows={7} maxLength={5000} defaultValue={progress.notes ?? ""} placeholder="Capture the invariant, mistake, or follow-up to revisit…" /><small>Only visible in your account. Up to 5,000 characters.</small></label>
    {(pending || state.message) && <p className={`form-message ${liveStatus}`} role={liveStatus === "error" ? "alert" : "status"} aria-live={liveStatus === "error" ? "assertive" : "polite"} aria-atomic="true">{pending ? "Saving practice progress…" : state.message}{!pending && state.conflict && <><br /><Link href={`/dsa/questions/${questionId}`} target="_blank" rel="noopener noreferrer">Review latest in a new tab</Link></>}</p>}
    <button className="button" type="submit" aria-disabled={pending}><Save size={15} />{pending ? "Saving…" : "Save practice"}</button>
  </form>;
}

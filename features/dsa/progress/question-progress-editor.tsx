"use client";

import { useActionState, useEffect, useRef } from "react";
import { Bookmark, Save } from "lucide-react";
import { updateDsaQuestionProgressAction, type DsaProgressActionState } from "./actions";
import type { DsaQuestionProgressRow } from "@/lib/supabase/database.types";
import { track } from "@/lib/analytics";

const initialState: DsaProgressActionState = { status: "idle", message: "" };

export function QuestionProgressEditor({ questionId, progress }: { questionId: string; progress: DsaQuestionProgressRow }) {
  const [state, action, pending] = useActionState(updateDsaQuestionProgressAction, initialState);
  const recordedActions = useRef(new Set<string>());
  useEffect(() => {
    if (!state.analytics || state.analytics.recordedStatus === "not_started") return;
    const key = `${state.analytics.questionId}:${state.analytics.recordedStatus}`;
    if (recordedActions.current.has(key)) return;
    recordedActions.current.add(key);
    track("preparation_activity_recorded", { track: "dsa", item_id: state.analytics.questionId, status: state.analytics.recordedStatus, persistence: "account" });
  }, [state.analytics]);
  return <form action={action} className="dsa-progress-editor">
    <input type="hidden" name="question_id" value={questionId} />
    <fieldset><legend>Practice status</legend><div className="dsa-choice-row">{(["not_started", "attempted", "solved", "review"] as const).map((status) => <label key={status}><input type="radio" name="status" value={status} defaultChecked={progress.status === status} /><span>{status.replace("_", " ")}</span></label>)}</div></fieldset>
    <fieldset><legend>Confidence <small>Self-reported</small></legend><div className="dsa-choice-row">{(["low", "medium", "high"] as const).map((confidence) => <label key={confidence}><input type="radio" name="confidence" value={confidence} defaultChecked={progress.confidence === confidence} /><span>{confidence}</span></label>)}</div></fieldset>
    <label className="dsa-bookmark-field"><input type="checkbox" name="bookmarked" defaultChecked={progress.bookmarked} /><Bookmark size={15} />Bookmark for later</label>
    <label><span>Private notes</span><textarea name="notes" rows={7} maxLength={5000} defaultValue={progress.notes ?? ""} placeholder="Capture the invariant, mistake, or follow-up to revisit…" /><small>Only visible in your account. Up to 5,000 characters.</small></label>
    {state.message && <p className={`form-message ${state.status}`} role="status">{state.message}</p>}
    <button className="button" type="submit" disabled={pending}><Save size={15} />{pending ? "Saving…" : "Save practice"}</button>
  </form>;
}

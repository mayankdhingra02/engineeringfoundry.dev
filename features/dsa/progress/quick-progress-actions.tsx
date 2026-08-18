"use client";

import { useState, useTransition } from "react";
import { Bookmark, Check } from "lucide-react";
import { quickDsaStatusAction, toggleDsaBookmarkAction, type DsaProgressActionState } from "./actions";
import type { DsaQuestionStatus } from "@/lib/dsa/progress";

const initialState: DsaProgressActionState = { status: "idle", message: "" };

function InlineActionMessage({ state }: { state: DsaProgressActionState }) {
  return state.status === "error" ? <span className="dsa-quick-action-error" role="alert">{state.message}</span> : null;
}

export function QuickDsaStatusControl({ questionId, status, compact = false }: { questionId: string; status: DsaQuestionStatus | "not-started"; compact?: boolean }) {
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const nextStatus = status === "solved" ? "review" : "solved";
  const label = status === "solved" ? "Move to review" : "Mark solved";
  return <form action={(formData) => startTransition(async () => setState(await quickDsaStatusAction(formData)))}>
    <input type="hidden" name="question_id" value={questionId} />
    <input type="hidden" name="status" value={nextStatus} />
    <button type="submit" disabled={pending} title={label}>{compact && <Check size={13} />}{pending ? "Saving…" : compact ? (status === "solved" ? "Review" : "Solved") : label}</button>
    <InlineActionMessage state={state} />
  </form>;
}

export function QuickDsaBookmarkControl({ questionId, questionTitle, bookmarked }: { questionId: string; questionTitle: string; bookmarked: boolean }) {
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const label = `${bookmarked ? "Remove" : "Add"} ${questionTitle} bookmark`;
  return <form action={(formData) => startTransition(async () => setState(await toggleDsaBookmarkAction(formData)))}>
    <input type="hidden" name="question_id" value={questionId} />
    <button type="submit" disabled={pending} className={bookmarked ? "active" : undefined} aria-label={pending ? `Saving ${questionTitle} bookmark` : label}><Bookmark size={13} fill={bookmarked ? "currentColor" : "none"} /></button>
    <InlineActionMessage state={state} />
  </form>;
}

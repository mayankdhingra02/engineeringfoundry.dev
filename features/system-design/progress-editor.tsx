"use client";

import Link from "next/link";
import { Bookmark, LoaderCircle } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  type FormEvent,
} from "react";
import type { SystemDesignItemProgressRow } from "@/lib/supabase/database.types";
import {
  saveSystemDesignProgressAction,
  type SystemDesignProgressActionState,
} from "./actions";
import { track } from "@/lib/analytics";
import {
  SYSTEM_DESIGN_PROGRESS_ABSENT_REVISION,
  SYSTEM_DESIGN_PROGRESS_BOOKMARK_PRESENT_FIELD,
  SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD,
} from "@/lib/system-design/item-progress-action-input";

const labels = { not_started: "Not started", reviewed: "Reviewed", review: "Needs review", comfortable: "Comfortable" } as const;

export function SystemDesignProgressEditor({ itemId, itemType, progress, latestHref, compact = false }: { itemId: string; itemType: "concept" | "design_problem"; progress: SystemDesignItemProgressRow | null; latestHref: string; compact?: boolean }) {
  const initialRevision = progress?.updated_at ?? SYSTEM_DESIGN_PROGRESS_ABSENT_REVISION;
  const [state, action, pending] = useActionState(saveSystemDesignProgressAction, {
    status: "idle",
    message: "",
    revision: initialRevision,
  } satisfies SystemDesignProgressActionState);
  const details = useRef<HTMLDetailsElement>(null);
  const recordedActions = useRef(new Set<string>());
  const submissionPending = useRef(false);

  useEffect(() => {
    if (!pending) submissionPending.current = false;
  }, [pending]);
  useEffect(() => () => {
    submissionPending.current = false;
  }, []);
  useEffect(() => { if (state.status === "error") details.current?.setAttribute("open", ""); }, [state.status]);
  useEffect(() => {
    if (!state.analytics || state.analytics.recordedStatus === "not_started") return;
    const key = `${state.analytics.itemType}:${state.analytics.itemId}:${state.analytics.recordedStatus}`;
    if (recordedActions.current.has(key)) return;
    recordedActions.current.add(key);
    track("preparation_activity_recorded", { track: "system-design", item_id: state.analytics.itemId, status: state.analytics.recordedStatus, persistence: "account" });
  }, [state.analytics]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionPending.current) return;
    submissionPending.current = true;
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
  const liveStatus = pending ? "pending" : state.status;

  return <details ref={details} className={`sd-private-progress ${compact ? "compact" : ""}`}>
    <summary><span>{labels[progress?.status ?? "not_started"]}{progress?.confidence ? ` · ${progress.confidence} confidence` : ""}</span><Bookmark size={14} fill={progress?.bookmarked ? "currentColor" : "none"} aria-label={progress?.bookmarked ? "Bookmarked" : undefined} /></summary>
    <form action={action} onSubmit={submit} aria-busy={pending}>
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="item_type" value={itemType} />
      <input type="hidden" name={SYSTEM_DESIGN_PROGRESS_EXPECTED_REVISION_FIELD} value={state.revision ?? initialRevision} />
      <input type="hidden" name={SYSTEM_DESIGN_PROGRESS_BOOKMARK_PRESENT_FIELD} value="true" />
      <label>Status<select name="status" defaultValue={progress?.status ?? "not_started"}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Confidence<select name="confidence" defaultValue={progress?.confidence ?? ""}><option value="">Not set</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
      <label className="sd-progress-bookmark"><input type="checkbox" name="bookmarked" value="true" defaultChecked={progress?.bookmarked ?? false} />Bookmark for review</label>
      <label>Private notes<textarea name="notes" rows={4} maxLength={10000} defaultValue={progress?.notes ?? ""} placeholder="Decisions, gaps, or a reminder for next time…" /></label>
      {(pending || state.message) && <p role={liveStatus === "error" ? "alert" : "status"} aria-live={liveStatus === "error" ? "assertive" : "polite"} aria-atomic="true" className={liveStatus === "error" ? "form-error" : liveStatus === "success" ? "form-success" : undefined}>{pending ? "Saving progress…" : state.message}{!pending && state.conflict && <><br /><Link href={latestHref} target="_blank" rel="noopener noreferrer">Review latest in a new tab</Link></>}</p>}
      <button className="button button-sm" type="submit" aria-disabled={pending}>{pending ? <><LoaderCircle className="spin" size={14} />Saving…</> : "Save progress"}</button>
    </form>
  </details>;
}

export function SystemDesignSignedOutProgress({ accountPlatformAvailable }: { accountPlatformAvailable: boolean }) {
  return accountPlatformAvailable
    ? <Link className="sd-progress-signin" href="/signin?next=/system-design/practice">Sign in to track progress</Link>
    : <span className="sd-progress-loading">Account progress unavailable</span>;
}

"use client";

import Link from "next/link";
import { Bookmark, LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import type { SystemDesignItemProgressRow } from "@/lib/supabase/database.types";
import { saveSystemDesignProgressAction, type SystemDesignActionState } from "./actions";
import { track } from "@/lib/analytics";

const initial: SystemDesignActionState = { status: "idle", message: "" };
const labels = { not_started: "Not started", reviewed: "Reviewed", review: "Needs review", comfortable: "Comfortable" } as const;

export function SystemDesignProgressEditor({ itemId, itemType, progress, compact = false }: { itemId: string; itemType: "concept" | "design_problem"; progress: SystemDesignItemProgressRow | null; compact?: boolean }) {
  const [state, action, pending] = useActionState(saveSystemDesignProgressAction, initial);
  const details = useRef<HTMLDetailsElement>(null);
  const recordedActions = useRef(new Set<string>());
  useEffect(() => { if (state.status === "error") details.current?.setAttribute("open", ""); }, [state.status]);
  useEffect(() => {
    if (!state.analytics || state.analytics.recordedStatus === "not_started") return;
    const key = `${state.analytics.itemType}:${state.analytics.itemId}:${state.analytics.recordedStatus}`;
    if (recordedActions.current.has(key)) return;
    recordedActions.current.add(key);
    track("preparation_activity_recorded", { track: "system-design", item_id: state.analytics.itemId, status: state.analytics.recordedStatus, persistence: "account" });
  }, [state.analytics]);
  return <details ref={details} className={`sd-private-progress ${compact ? "compact" : ""}`}>
    <summary><span>{labels[progress?.status ?? "not_started"]}{progress?.confidence ? ` · ${progress.confidence} confidence` : ""}</span><Bookmark size={14} fill={progress?.bookmarked ? "currentColor" : "none"} aria-label={progress?.bookmarked ? "Bookmarked" : undefined} /></summary>
    <form action={action}>
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="item_type" value={itemType} />
      <label>Status<select name="status" defaultValue={progress?.status ?? "not_started"}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Confidence<select name="confidence" defaultValue={progress?.confidence ?? ""}><option value="">Not set</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
      <label className="sd-progress-bookmark"><input type="checkbox" name="bookmarked" defaultChecked={progress?.bookmarked ?? false} />Bookmark for review</label>
      <label>Private notes<textarea name="notes" rows={4} maxLength={10000} defaultValue={progress?.notes ?? ""} placeholder="Decisions, gaps, or a reminder for next time…" /></label>
      {state.message && <p role="status" className={state.status === "error" ? "form-error" : "form-success"}>{state.message}</p>}
      <button className="button button-sm" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={14} />Saving…</> : "Save progress"}</button>
    </form>
  </details>;
}

export function SystemDesignSignedOutProgress({ accountPlatformAvailable }: { accountPlatformAvailable: boolean }) {
  return accountPlatformAvailable
    ? <Link className="sd-progress-signin" href="/signin?next=/system-design/practice">Sign in to track progress</Link>
    : <span className="sd-progress-loading">Account progress unavailable</span>;
}

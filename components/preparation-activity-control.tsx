"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { recordPreparationActivityAction } from "@/features/preparation-progress/actions";
import { track as trackAnalytics } from "@/lib/analytics";
import {
  preparationActivityKey,
  resolvePreparationActivitySaveOutcome,
  type PreparationActivitySaveAttempts,
} from "@/lib/preparation-progress/activity-save";
import {
  preparationProgressEvent,
  readLocalPreparationProgress,
  recordLocalProgress,
  writeLocalPreparationProgress,
  type LocalProgressStatus,
  type PreparationTrack,
} from "@/lib/preparation-progress/local";

type PreparationActivityControlProps = {
  track: PreparationTrack;
  itemId: string;
  noun?: string;
  accountPlatformAvailable: boolean;
};

type ActivityStatusState = {
  activityKey: string;
  status: LocalProgressStatus | "not-started";
};

type ActivitySaveState = {
  requestId: number;
  activityKey: string;
  status: "pending" | "settled";
  message: string | null;
};

export function PreparationActivityControl({ track, itemId, noun = "activity", accountPlatformAvailable }: PreparationActivityControlProps) {
  const currentActivityKey = preparationActivityKey(track, itemId);
  const [activityStatus, setActivityStatus] = useState<ActivityStatusState>({ activityKey: currentActivityKey, status: "not-started" });
  const [saveState, setSaveState] = useState<ActivitySaveState | null>(null);
  const pendingRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const current = readLocalPreparationProgress(window.localStorage);
        setActivityStatus({ activityKey: currentActivityKey, status: current.items.find((item) => item.track === track && item.itemId === itemId)?.status ?? "not-started" });
      } catch { setActivityStatus({ activityKey: currentActivityKey, status: "not-started" }); }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentActivityKey, itemId, track]);

  async function update(next: LocalProgressStatus) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    const requestId = ++requestIdRef.current;
    const requestedActivityKey = currentActivityKey;
    setActivityStatus({ activityKey: requestedActivityKey, status: next });
    setSaveState({ requestId, activityKey: requestedActivityKey, status: "pending", message: null });

    function saveLocally(): "saved" | "failed" {
      try {
        const current = readLocalPreparationProgress(window.localStorage);
        const updated = recordLocalProgress(current, { track, itemId, status: next });
        const recorded = updated.items.some((item) => item.track === track && item.itemId === itemId && item.status === next);
        if (!recorded) return "failed";
        writeLocalPreparationProgress(window.localStorage, updated);
        window.dispatchEvent(new CustomEvent(preparationProgressEvent));
        return "saved";
      } catch {
        return "failed";
      }
    }

    let attempts: PreparationActivitySaveAttempts;
    if (accountPlatformAvailable) {
      try {
        const result = await recordPreparationActivityAction({ track, itemId, status: next });
        if (result.saved) {
          attempts = { accountStatus: "saved" };
        } else {
          attempts = { accountStatus: "failed", accountReason: result.reason, localStatus: saveLocally() };
        }
      } catch {
        attempts = { accountStatus: "failed", accountReason: "request-failed", localStatus: saveLocally() };
      }
    } else {
      attempts = { accountStatus: "failed", accountReason: "account-unavailable", localStatus: saveLocally() };
    }

    const outcome = resolvePreparationActivitySaveOutcome(attempts);
    pendingRef.current = false;
    setSaveState((current) => current?.requestId === requestId && current.activityKey === requestedActivityKey
      ? { requestId, activityKey: requestedActivityKey, status: "settled", message: outcome.message }
      : current);
    if (next === "completed" && outcome.persisted) {
      trackAnalytics("preparation_activity_recorded", { track, item_id: itemId, status: next, persistence: outcome.persistence });
    }
  }

  const status = activityStatus.activityKey === currentActivityKey ? activityStatus.status : "not-started";
  const pending = saveState?.status === "pending";
  const savingCurrentActivity = pending && saveState.activityKey === currentActivityKey;
  const message = saveState?.activityKey === currentActivityKey
    ? saveState.status === "pending" ? "Recording activity…" : saveState.message
    : pending ? "Finishing previous activity save…" : null;
  const complete = status === "completed";
  return <div className="preparation-activity-control">
    <button type="button" className={complete ? "is-complete" : undefined} aria-pressed={complete} aria-disabled={pending} onClick={() => { if (!pending) void update(complete ? "in-progress" : "completed"); }}>
      {complete ? <CheckCircle2 size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
      {pending ? savingCurrentActivity ? "Recording…" : "Finishing previous activity save…" : complete ? "Recorded complete" : `Record ${noun} complete`}
    </button>
    <small>{accountPlatformAvailable ? "Records self-reported preparation activity to an account when signed in or this browser when available—not mastery or interview readiness." : "Account saving is unavailable. This control uses browser storage when available; it does not indicate mastery or interview readiness."}</small>
    <small role="status" aria-live="polite" aria-atomic="true">{message}</small>
  </div>;
}

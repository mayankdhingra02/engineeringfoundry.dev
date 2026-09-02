"use client";

import { BookmarkCheck } from "lucide-react";
import { useRef, useState } from "react";
import { saveActiveStudyPlanAction } from "@/features/preparation-progress/plan-actions";
import { preparationProgressEvent, readLocalPreparationProgress, saveLocalPlan, writeLocalPreparationProgress } from "@/lib/preparation-progress/local";
import {
  resolveStudyPlanSaveOutcome,
  studyPlanId,
  type SaveStudyPlanInput,
  type StudyPlanSaveAttempts,
} from "@/lib/preparation-progress/plan-save";
import { track } from "@/lib/analytics";

type SaveState = {
  requestId: number;
  planKey: string;
  label: string;
  status: "pending" | "settled";
  message: string | null;
};

export function useStudyPlanSaveCoordinator() {
  const requestIdRef = useRef(0);
  const pendingRef = useRef(false);
  const [saveState, setSaveState] = useState<SaveState | null>(null);
  return { requestIdRef, pendingRef, saveState, setSaveState };
}

export type StudyPlanSaveCoordinator = ReturnType<typeof useStudyPlanSaveCoordinator>;

function visibleSaveMessage(saveState: SaveState | null, planKey?: string) {
  if (!saveState) return null;
  if (saveState.status === "pending") return saveState.planKey === planKey ? "Saving this plan…" : "Finishing previous plan save…";
  if (!saveState.message) return null;
  return saveState.planKey === planKey ? saveState.message : `Previous save for ${saveState.label}: ${saveState.message}`;
}

export function StudyPlanSaveStatus({ coordinator }: { coordinator: StudyPlanSaveCoordinator }) {
  const message = visibleSaveMessage(coordinator.saveState);
  return message ? <div className="save-study-plan-control"><small role="status" aria-live="polite" aria-atomic="true">{message}</small></div> : null;
}

export function SaveStudyPlanControl({
  input,
  href,
  label,
  accountPlatformAvailable,
  coordinator,
}: {
  input: SaveStudyPlanInput;
  href: string;
  label: string;
  accountPlatformAvailable: boolean;
  coordinator: StudyPlanSaveCoordinator;
}) {
  const { requestIdRef, pendingRef, saveState, setSaveState } = coordinator;
  const planId = studyPlanId(input);
  const planKey = `${planId}\n${href}\n${label}`;
  const pending = saveState?.status === "pending";
  const savingCurrentPlan = pending && saveState.planKey === planKey;

  async function save() {
    if (pendingRef.current) return;
    pendingRef.current = true;
    const requestId = ++requestIdRef.current;
    setSaveState({ requestId, planKey, label, status: "pending", message: null });

    let attempts: StudyPlanSaveAttempts;
    if (accountPlatformAvailable) {
      try {
        const result = await saveActiveStudyPlanAction(input);
        if (result.saved) {
          attempts = { accountStatus: "saved" };
        } else {
          attempts = {
            accountStatus: "failed",
            accountReason: result.reason,
            localStatus: saveLocally(),
          };
        }
      } catch {
        attempts = {
          accountStatus: "failed",
          accountReason: "request-failed",
          localStatus: saveLocally(),
        };
      }
    } else {
      attempts = {
        accountStatus: "failed",
        accountReason: "account-unavailable",
        localStatus: saveLocally(),
      };
    }

    const outcome = resolveStudyPlanSaveOutcome(attempts);
    pendingRef.current = false;
    if (outcome.persisted) {
      track("study_plan_activated", {
        track: input.track,
        plan_id: planId,
        persistence: outcome.persistence,
      });
    }
    setSaveState((current) => current?.requestId === requestId && current.planKey === planKey
      ? { requestId, planKey, label, status: "settled", message: outcome.message }
      : current);

    function saveLocally(): "saved" | "failed" {
      try {
        const current = readLocalPreparationProgress(window.localStorage);
        writeLocalPreparationProgress(window.localStorage, saveLocalPlan(current, { track: input.track, href, label }));
        window.dispatchEvent(new CustomEvent(preparationProgressEvent));
        return "saved";
      } catch {
        return "failed";
      }
    }
  }

  return <div className="save-study-plan-control">
    <button type="button" className="button button-secondary" aria-disabled={pending} onClick={() => { if (!pending) void save(); }}><BookmarkCheck size={15} aria-hidden="true" />{pending ? savingCurrentPlan ? "Saving…" : "Finishing previous plan save…" : "Save as active plan"}</button>
    <small>{accountPlatformAvailable ? "Saving replaces the active plan for this track; it does not mark work complete." : "Account saving is unavailable. This control uses browser storage when available; it does not mark work complete."}</small>
    <small role="status" aria-live="polite" aria-atomic="true">{visibleSaveMessage(saveState, planKey)}</small>
  </div>;
}

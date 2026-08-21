"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { recordPreparationActivityAction } from "@/features/preparation-progress/actions";
import {
  preparationProgressEvent,
  readLocalPreparationProgress,
  recordLocalProgress,
  writeLocalPreparationProgress,
  type LocalProgressStatus,
  type PreparationTrack,
} from "@/lib/preparation-progress/local";

export function PreparationActivityControl({ track, itemId, noun = "activity" }: { track: PreparationTrack; itemId: string; noun?: string }) {
  const [status, setStatus] = useState<LocalProgressStatus | "not-started">("not-started");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const current = readLocalPreparationProgress(window.localStorage);
        setStatus(current.items.find((item) => item.track === track && item.itemId === itemId)?.status ?? "not-started");
      } catch { setStatus("not-started"); }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [itemId, track]);

  async function update(next: LocalProgressStatus) {
    setStatus(next);
    setPending(true);
    try {
      let saved = false;
      try {
        const result = await recordPreparationActivityAction({ track, itemId, status: next });
        saved = result.saved;
        setMessage(result.message);
      } catch { setMessage("Saved in this browser. Sign in later to import it deliberately."); }
      if (!saved) {
        try {
          const current = readLocalPreparationProgress(window.localStorage);
          writeLocalPreparationProgress(window.localStorage, recordLocalProgress(current, { track, itemId, status: next }));
          window.dispatchEvent(new CustomEvent(preparationProgressEvent));
        } catch { /* Browser storage is optional; the visible state remains useful for this visit. */ }
      }
    } finally { setPending(false); }
  }

  const complete = status === "completed";
  return <div className="preparation-activity-control">
    <button type="button" className={complete ? "is-complete" : undefined} aria-pressed={complete} disabled={pending} onClick={() => { void update(complete ? "in-progress" : "completed"); }}>
      {complete ? <CheckCircle2 size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
      {complete ? `Recorded complete` : `Record ${noun} complete`}
    </button>
    <small>Records preparation activity in this browser—not mastery or interview readiness.</small>
    {message && <small role="status">{message}</small>}
  </div>;
}

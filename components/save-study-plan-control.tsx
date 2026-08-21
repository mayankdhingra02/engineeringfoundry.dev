"use client";

import { BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { saveActiveStudyPlanAction, type SaveStudyPlanInput } from "@/features/preparation-progress/plan-actions";
import { preparationProgressEvent, readLocalPreparationProgress, saveLocalPlan, writeLocalPreparationProgress } from "@/lib/preparation-progress/local";

export function SaveStudyPlanControl({ input, href, label }: { input: SaveStudyPlanInput; href: string; label: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setPending(true);
    try {
      let saved = false;
      try {
        const result = await saveActiveStudyPlanAction(input);
        saved = result.saved;
        setMessage(result.message);
      } catch { setMessage("Saved in this browser. Sign in later to save it to your account."); }
      if (!saved) {
        try {
          const current = readLocalPreparationProgress(window.localStorage);
          writeLocalPreparationProgress(window.localStorage, saveLocalPlan(current, { track: input.track, href, label }));
          window.dispatchEvent(new CustomEvent(preparationProgressEvent));
        } catch { /* Browser storage is optional; the selected plan remains visible this visit. */ }
      }
    } finally { setPending(false); }
  }

  return <div className="save-study-plan-control">
    <button type="button" className="button button-secondary" disabled={pending} onClick={() => { void save(); }}><BookmarkCheck size={15} aria-hidden="true" />{pending ? "Saving…" : "Save as active plan"}</button>
    <small>Saving replaces the active plan for this track; it does not mark work complete.</small>
    {message && <small role="status">{message}</small>}
  </div>;
}

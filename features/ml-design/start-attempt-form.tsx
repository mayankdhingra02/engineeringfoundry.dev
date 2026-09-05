"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

export function MlDesignStartAttemptForm({ action, defaultTitle }: { action: (formData: FormData) => void | Promise<void>; defaultTitle: string }) {
  const [mode, setMode] = useState("guided");
  return <form action={action} className="ml-attempt-start">
    <label>Attempt title<input name="title" required maxLength={160} defaultValue={defaultTitle} /></label>
    <label>Mode<select name="mode" value={mode} onChange={(event) => setMode(event.target.value)}><option value="guided">Guided</option><option value="untimed">Untimed</option><option value="timed">Timed</option></select></label>
    {mode === "timed" ? <label>Duration<select name="duration_minutes" defaultValue="45"><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></label> : <input type="hidden" name="duration_minutes" value="" />}
    <label>Exposure<select name="fresh_exposure" defaultValue="fresh"><option value="fresh">Fresh — no solution reviewed</option><option value="repeat">Repeat — solution seen before</option></select></label>
    <button className="button"><Plus size={15} aria-hidden="true" />Start private attempt</button>
  </form>;
}
